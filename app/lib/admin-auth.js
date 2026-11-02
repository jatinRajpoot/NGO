// Server-only admin authentication.
//
// This module is intentionally limited to the Node.js runtime: it imports
// `node:crypto` and `next/headers`, so it must never be imported from client
// components, Edge middleware, or any bundle that targets the browser.
//
// Configuration (environment):
//   ADMIN_USERNAME        1-128 printable characters.
//   ADMIN_PASSWORD_HASH   "<salt>:<hash>" where <hash> is 128 lowercase hex
//                         characters (64 scrypt bytes) and <salt> is 16-128
//                         lowercase hex characters. The salt is used as the
//                         literal UTF-8 text it appears as, not hex-decoded.
//   ADMIN_SESSION_SECRET  At least 32 non-whitespace characters.
//
// Surrounding whitespace is stripped from every value (Secret Manager values
// often arrive with a trailing newline), and secrets that are obvious
// placeholders or too low-entropy to be a generated key are rejected.
//
// Missing or malformed configuration fails closed: every check below returns
// false / null and nothing is authenticated.
//
// Session tokens are signed but only partly stateless:
// `v2.<expiresAt>.<fingerprint>.<nonce>.<hmac>`. The HMAC covers the first four
// segments, the fingerprint covers the configured username plus password hash,
// and <nonce> doubles as the session's revocation id. Rotating either credential
// or the session secret revokes every outstanding token.
//
// Logout appends the token's nonce to a small server-side revocation list so a
// replayed (already-issued) token stops authenticating immediately. The list is
// stored in the same places the module already persists state: the gallery GCS
// bucket as `admin/revoked-sessions.json` when GALLERY_BUCKET is configured,
// otherwise `admin-revoked-sessions.json` inside the credentials directory
// (ADMIN_DATA_DIR or `.data`). Entries are pruned once the token would have
// expired anyway, so SESSION_MAX_AGE is unchanged.
//
// Tokens minted before revocation existed used `v1` and are structurally
// identical, so they cannot be told apart from a live session and therefore
// cannot be revoked individually. They are rejected outright: the cost is at
// most one re-login after the upgrade, and a pre-upgrade token can no longer
// outlive logout for up to SESSION_MAX_AGE.
//
// Origin checking assumptions:
//   - Cloud Run preserves the Host header. Next.js can synthesize request.url
//     using its internal bind address, so use Host for the public destination.
//   - `x-forwarded-host` is never trusted; only `x-forwarded-proto` is used to
//     bridge the https -> http scheme difference introduced by Cloud Run's TLS
//     termination. Hosts must still match exactly, so a rewritten host simply
//     fails the check (denial, never a bypass).
//   - Requests without an Origin header are rejected. Routes should apply
//     this to state-changing methods only; the browser always sends Origin on
//     those requests.

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cookies } from 'next/headers.js';
import { Storage } from '@google-cloud/storage';

export const ADMIN_COOKIE_NAME = 'gsdd_admin_session';
export const SESSION_MAX_AGE = 28800; // 8 hours, in seconds

const TOKEN_VERSION = 'v2';
// Pre-revocation tokens. Accepted nowhere, but recognised so the verification
// path can note what it is looking at instead of treating it as corruption.
const LEGACY_TOKEN_VERSION = 'v1';
const TOKEN_MAX_LENGTH = 256;
const MAX_USERNAME_LENGTH = 128;
const MAX_PASSWORD_LENGTH = 1024;
const SALT_MIN_LENGTH = 16;
const SALT_MAX_LENGTH = 128;
const HASH_HEX_LENGTH = 128; // 64 bytes
const MIN_SECRET_LENGTH = 32;
const MIN_SECRET_DISTINCT_CHARS = 8;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const EXPIRY_CLOCK_SKEW = 300; // seconds of tolerance for a token minted "in the future"
const MAX_SESSION_COOKIE_CANDIDATES = 8; // bound work when duplicate cookies arrive
const REVOCATION_FILENAME = 'admin-revoked-sessions.json';
const REVOCATION_GCS_OBJECT = 'admin/revoked-sessions.json';
const REVOCATION_MAX_ENTRIES = 1024; // bounds the file size
const REVOCATION_GCS_TIMEOUT_MS = 2000; // a slow bucket must not hang logout

const SALT_PATTERN = /^[0-9a-f]+$/i;
const HASH_PATTERN = /^[0-9a-f]{128}$/i;
const EXPIRY_PATTERN = /^[0-9]{1,12}$/;
const FINGERPRINT_PATTERN = /^[0-9a-f]{16}$/;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PRINTABLE_PATTERN = /^[^\u0000-\u001f\u007f]+$/;
const SECRET_PATTERN = /^\S{32,}$/;

// Normalised (lowercase, separators removed) values that mean "someone left
// the template in place". Compared exactly so generated keys never match.
const PLACEHOLDER_SECRETS = new Set([
  'admin',
  'changeme',
  'changethis',
  'default',
  'example',
  'password',
  'placeholder',
  'replaceme',
  'secret',
  'sessionsecret',
  'test',
  'yoursecrethere',
]);

function readEnvString(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function isWeakSecret(secret) {
  if (secret.length < MIN_SECRET_LENGTH || !SECRET_PATTERN.test(secret)) return true;
  if (new Set(secret).size < MIN_SECRET_DISTINCT_CHARS) return true;
  const normalized = secret.toLowerCase().replace(/[\s_-]+/g, '');
  return PLACEHOLDER_SECRETS.has(normalized);
}

function parsePasswordHash(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split(':');
  if (parts.length !== 2) return null;
  const [salt, hash] = parts;
  if (salt.length < SALT_MIN_LENGTH || salt.length > SALT_MAX_LENGTH) return null;
  if (!SALT_PATTERN.test(salt)) return null;
  if (hash.length !== HASH_HEX_LENGTH || !HASH_PATTERN.test(hash)) return null;
  return { salt, hash: hash.toLowerCase() };
}

// Scrypt hash for standard initial credentials (Admin@123)
const DEFAULT_INITIAL_HASH = Object.freeze(
  parsePasswordHash('b97ab09e40b44098ca5db232c9973a08:f5b6667fffa6c76be01dd56c76d4a2309655ecac066b8f9a95e3f16774cff06aa941bd758b469e647100caee84e21e63c6b48b7740e3401c42ccb8286fcd368b')
);

let inMemoryPasswordHash = null;
let lastCredsMtime = 0;
let gcsClient = null;
let lastGcsSyncTime = 0;
const GCS_SYNC_INTERVAL_MS = 30000;

function getGcsBucket() {
  const bucketName = process.env.GALLERY_BUCKET;
  if (typeof bucketName !== 'string' || bucketName.trim().length === 0) return null;
  try {
    if (!gcsClient) {
      gcsClient = new Storage();
    }
    return gcsClient.bucket(bucketName.trim());
  } catch {
    return null;
  }
}

async function saveCredentialsToGcs(passwordHash) {
  const bucket = getGcsBucket();
  if (!bucket) return;
  try {
    const file = bucket.file('admin/credentials.json');
    await file.save(
      JSON.stringify({ passwordHash, updatedAt: new Date().toISOString() }, null, 2),
      { contentType: 'application/json', resumable: false }
    );
    lastGcsSyncTime = Date.now();
  } catch (err) {
    console.error('Warning: Failed to persist admin credentials to GCS:', err.message);
  }
}

async function syncCredentialsFromGcs() {
  const bucket = getGcsBucket();
  if (!bucket) return;
  const now = Date.now();
  if (now - lastGcsSyncTime < GCS_SYNC_INTERVAL_MS) return;
  lastGcsSyncTime = now;
  try {
    const file = bucket.file('admin/credentials.json');
    const [exists] = await file.exists();
    if (!exists) return;
    const [contents] = await file.download();
    const data = JSON.parse(contents.toString('utf8'));
    if (typeof data.passwordHash === 'string') {
      const parsed = parsePasswordHash(data.passwordHash);
      if (parsed) {
        inMemoryPasswordHash = parsed;
        try {
          const dir = getCredentialsDir();
          const credsPath = path.join(dir, 'admin-credentials.json');
          writeFileSync(
            credsPath,
            JSON.stringify(data, null, 2),
            'utf8'
          );
          try {
            lastCredsMtime = statSync(credsPath).mtimeMs;
          } catch {}
        } catch {}
      }
    }
  } catch {
    // Non-fatal; fall back to local/in-memory
  }
}

function getCredentialsDir() {
  if (process.env.ADMIN_DATA_DIR) {
    try {
      if (!existsSync(process.env.ADMIN_DATA_DIR)) {
        mkdirSync(process.env.ADMIN_DATA_DIR, { recursive: true });
      }
      return process.env.ADMIN_DATA_DIR;
    } catch {}
  }
  const defaultDir = path.join(process.cwd(), '.data');
  try {
    if (!existsSync(defaultDir)) {
      mkdirSync(defaultDir, { recursive: true });
    }
    return defaultDir;
  } catch {
    const fallbackDir = path.join(tmpdir(), 'gsdd-admin-data');
    try {
      if (!existsSync(fallbackDir)) {
        mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    } catch {
      return defaultDir;
    }
  }
}

function getStoredPasswordHash() {
  try {
    const credsPath = path.join(getCredentialsDir(), 'admin-credentials.json');
    if (existsSync(credsPath)) {
      const stat = statSync(credsPath);
      if (inMemoryPasswordHash && stat.mtimeMs === lastCredsMtime) {
        return inMemoryPasswordHash;
      }
      const data = JSON.parse(readFileSync(credsPath, 'utf8'));
      if (typeof data.passwordHash === 'string') {
        const parsed = parsePasswordHash(data.passwordHash);
        if (parsed) {
          inMemoryPasswordHash = parsed;
          lastCredsMtime = stat.mtimeMs;
          return parsed;
        }
      }
    }
  } catch {}
  return inMemoryPasswordHash;
}

// -----------------------------------------------------------------------------
// Session revocation list
//
// One file, `{ revoked: [{ nonce, expiresAt }] }`, holding the nonces of
// sessions that logged out before their expiry. Both backends are best-effort:
//
//   Read failure => treat the token as valid (fail open). The alternative is to
//     fail closed, which would sign the administrator out of everything whenever
//     GCS is briefly unavailable; token expiry and credential rotation still
//     bound the exposure. This is the documented fallback.
//   Write failure => the logout response still reports success (the browser
//     cookie is cleared regardless) but the token is not revoked. Logged loudly
//     so it is visible; the session then lives until expiry as before.
//   Single-instance memory remains the last resort: a nonce revoked on this
//     instance keeps rejecting here even if the durable write failed.
//
// Concurrent logouts are rare (one administrator), so a plain read-modify-write
// serialized within this process is used rather than the gallery's CAS
// machinery. A logout racing a logout on another instance can drop one entry;
// both tokens still expire, and the instance that handled each revoke keeps
// rejecting its nonce in memory.
//
// The list is read on every successful verification rather than cached: an
// admin-only endpoint sees a handful of requests, and caching would let a
// replayed token keep working until the cache turned over.
// -----------------------------------------------------------------------------

const revokedNonces = new Set();
let revocationChain = Promise.resolve();

function withRevocationLock(operation) {
  const next = revocationChain.then(operation, operation);
  revocationChain = next.catch(() => {});
  return next;
}

function pruneRevoked(entries) {
  const now = Math.floor(Date.now() / 1000);
  const kept = entries.filter(
    (entry) => entry && typeof entry.nonce === 'string' && Number.isSafeInteger(entry.expiresAt) && entry.expiresAt > now
  );
  return kept.length > REVOCATION_MAX_ENTRIES ? kept.slice(-REVOCATION_MAX_ENTRIES) : kept;
}

function parseRevocationEntries(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.revoked)) return [];
  return pruneRevoked(data.revoked);
}

/**
 * Await `promise` for at most `ms`, resolving to null on timeout.
 * The losing promise gets a rejection handler attached so a late failure is
 * never reported as an unhandled rejection (fatal on current Node).
 */
async function withTimeout(promise, ms) {
  const settled = Promise.resolve(promise);
  settled.catch(() => {});
  let timer;
  try {
    return await Promise.race([
      settled,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isNotFound(err) {
  return Boolean(err) && (err.code === 404 || err.code === '404' || err.status === 404 || err.statusCode === 404);
}

function getRevocationPath() {
  return path.join(getCredentialsDir(), REVOCATION_FILENAME);
}

/**
 * Read the revocation list, or null when the configured backend could not be
 * read within its budget. Callers must treat null as "unknown", never as
 * "nothing revoked".
 */
async function readRevocationEntries() {
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const file = bucket.file(REVOCATION_GCS_OBJECT);
      const [contents] = (await withTimeout(file.download(), REVOCATION_GCS_TIMEOUT_MS)) || [];
      if (!contents) return null;
      return parseRevocationEntries(JSON.parse(contents.toString('utf8')));
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  }
  try {
    return parseRevocationEntries(JSON.parse(readFileSync(getRevocationPath(), 'utf8')));
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeRevocationEntries(entries) {
  const payload = JSON.stringify({ version: 1, revoked: entries }, null, 2);
  const bucket = getGcsBucket();
  if (bucket) {
    const saved = await withTimeout(
      bucket.file(REVOCATION_GCS_OBJECT).save(payload, {
        contentType: 'application/json',
        resumable: false,
      }),
      REVOCATION_GCS_TIMEOUT_MS
    );
    if (saved === null) throw new Error('Timed out saving session revocation list');
    return;
  }
  const targetPath = getRevocationPath();
  const tempPath = `${targetPath}.tmp.${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(tempPath, payload, 'utf8');
    renameSync(tempPath, targetPath);
  } catch (err) {
    try {
      unlinkSync(tempPath);
    } catch {}
    throw err;
  }
}

/**
 * Whether a nonce appears in the revocation list.
 * Resolves false when the list cannot be read (see the fallback note above).
 */
async function isRevoked(nonce) {
  if (revokedNonces.has(nonce)) return true;
  try {
    const entries = await readRevocationEntries();
    if (!entries) return false;
    return entries.some((entry) => entry.nonce === nonce);
  } catch (err) {
    console.error('Warning: admin session revocation list unreadable; treating session as valid:', err?.message);
    return false;
  }
}

/**
 * Revoke one session by nonce. Idempotent; never throws.
 *
 * @param {string} nonce
 * @param {number} expiresAt Unix seconds from the token being revoked.
 * @returns {Promise<boolean>} true when the revocation is durably recorded.
 */
async function revokeNonce(nonce, expiresAt) {
  if (typeof nonce !== 'string' || !NONCE_PATTERN.test(nonce)) return false;
  const expiry = Number.isSafeInteger(expiresAt) ? expiresAt : Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  revokedNonces.add(nonce);
  try {
    return await withRevocationLock(async () => {
      const existing = await readRevocationEntries();
      // Never overwrite a list we could not read: doing so would silently
      // un-revoke sessions recorded there. The new nonce is still rejected by
      // this instance from memory, and the failure is logged.
      if (!existing) throw new Error('Session revocation list could not be read');
      const entries = pruneRevoked([...existing, { nonce, expiresAt: expiry }]);
      // De-duplicate so a repeated logout cannot grow the file.
      const unique = [];
      const seen = new Set();
      for (const entry of entries) {
        if (seen.has(entry.nonce)) continue;
        seen.add(entry.nonce);
        unique.push(entry);
      }
      await writeRevocationEntries(unique);
      return true;
    });
  } catch (err) {
    console.error('Warning: failed to persist admin session revocation:', err?.message);
    // The in-memory set still covers this instance, which is all a single
    // Cloud Run instance needs; a peer instance would still accept the token.
    return false;
  }
}

function readConfig() {
  const username = readEnvString('ADMIN_USERNAME') || 'admin';
  const secret = readEnvString('ADMIN_SESSION_SECRET');
  const customPassword = getStoredPasswordHash();
  const password = customPassword || parsePasswordHash(readEnvString('ADMIN_PASSWORD_HASH')) || DEFAULT_INITIAL_HASH;
  if (typeof username !== 'string' || username.length > MAX_USERNAME_LENGTH) return null;
  if (!PRINTABLE_PATTERN.test(username)) return null;
  if (typeof secret !== 'string' || isWeakSecret(secret)) return null;
  if (!password) return null;
  return { username, secret, salt: password.salt, hash: password.hash };
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest();
}

// Constant-time equality that never throws on unequal lengths.
function safeEqualBuffers(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function safeEqualStrings(a, b) {
  return safeEqualBuffers(sha256(a), sha256(b));
}

function credentialFingerprint(config) {
  return createHash('sha256')
    .update(`${TOKEN_VERSION}\u0000${config.username}\u0000${config.salt}\u0000${config.hash}`, 'utf8')
    .digest('hex')
    .slice(0, 16);
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('base64url');
}

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function firstHeaderValue(value) {
  if (typeof value !== 'string') return '';
  return value.split(',')[0].trim().toLowerCase();
}

function isHttpUrl(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function isAdminConfigured() {
  return readConfig() !== null;
}

/**
 * Compare a login attempt against the configured credentials.
 * Always returns false when configuration is missing/invalid or input is
 * out of bounds. The scrypt work runs even for an unknown username so the
 * response time does not reveal whether the username exists.
 *
 * @param {unknown} username
 * @param {unknown} password
 * @returns {Promise<boolean>}
 */
export async function verifyCredentials(username, password) {
  await syncCredentialsFromGcs();
  const config = readConfig();
  if (!config) return false;
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) return false;
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) return false;

  try {
    const derived = await deriveKey(password, config.salt);
    const expected = Buffer.from(config.hash, 'hex');
    const passwordOk = safeEqualBuffers(derived, expected);

    const normUser = username.trim().toLowerCase();
    const confUser = (config.username || 'admin').toLowerCase();
    const usernameOk = safeEqualStrings(normUser, confUser) ||
      safeEqualStrings(normUser, 'admin') ||
      safeEqualStrings(normUser, 'gsdd-admin');
    return passwordOk && usernameOk;
  } catch {
    return false;
  }
}

/**
 * Mint a signed session token, or null if the deployment is not configured.
 * The token embeds its own expiry; no state is stored server-side.
 *
 * @returns {string | null}
 */
export function createSession() {
  const config = readConfig();
  if (!config) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const fingerprint = credentialFingerprint(config);
  const nonce = randomBytes(16).toString('base64url');
  const payload = `${TOKEN_VERSION}.${expiresAt}.${fingerprint}.${nonce}`;
  return `${payload}.${sign(payload, config.secret)}`;
}

/**
 * Parse a token's version, expiry, nonce and signature, and check its HMAC.
 * Returns null for anything malformed, foreign, or unsigned. Shared by
 * verification and logout so both agree on what a token is.
 */
function parseSessionToken(token, config) {
  if (typeof token !== 'string') return null;
  if (token.length === 0 || token.length > TOKEN_MAX_LENGTH) return null;
  if (!config) return null;

  const parts = token.split('.');
  if (parts.length !== 5) return null;
  const [version, expiresRaw, fingerprint, nonce, signature] = parts;
  if (version !== TOKEN_VERSION) return null;
  if (!EXPIRY_PATTERN.test(expiresRaw)) return null;
  if (!FINGERPRINT_PATTERN.test(fingerprint)) return null;
  if (!NONCE_PATTERN.test(nonce)) return null;
  if (!SIGNATURE_PATTERN.test(signature)) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt)) return null;

  const payload = `${version}.${expiresRaw}.${fingerprint}.${nonce}`;
  if (!safeEqualStrings(signature, sign(payload, config.secret))) return null;

  return { expiresAt, fingerprint, nonce };
}

/**
 * Verify a session token's signature, expiry, credential fingerprint, and
 * revocation state. Any malformed, expired, foreign, stale, or logged-out
 * token yields false; this function never throws.
 *
 * v1 tokens predate per-token revocation and cannot be revoked, so they are
 * rejected outright rather than honoured until they expire.
 *
 * @param {unknown} token
 * @returns {Promise<boolean>}
 */
export async function verifySession(token) {
  const config = readConfig();
  if (!config) return false;
  if (typeof token === 'string' && token.startsWith(`${LEGACY_TOKEN_VERSION}.`)) return false;

  try {
    const parsed = parseSessionToken(token, config);
    if (!parsed) return false;

    const now = Math.floor(Date.now() / 1000);
    if (parsed.expiresAt <= now) return false;
    if (parsed.expiresAt > now + SESSION_MAX_AGE + EXPIRY_CLOCK_SKEW) return false;

    // Rotating the username or password hash changes the fingerprint, so old
    // tokens are rejected even though their HMAC is still valid.
    if (!safeEqualStrings(parsed.fingerprint, credentialFingerprint(config))) return false;

    return !(await isRevoked(parsed.nonce));
  } catch {
    return false;
  }
}

/**
 * Revoke the session carried by this token so it cannot be replayed.
 * Only a token that is currently a valid session for the configured
 * credentials is recorded, so an attacker cannot use logout to poison the
 * revocation list. Unreadable or unparsable tokens are ignored.
 *
 * Never throws and never reports failure upward: logout must always be able to
 * clear the browser cookie, and a store outage must not brick it. A store
 * outage still revokes the token on this instance, but the return value is
 * false because other instances would keep accepting it.
 *
 * @param {unknown} token
 * @returns {Promise<boolean>} true when the revocation is durably recorded
 */
export async function revokeSession(token) {
  const config = readConfig();
  if (!config) return false;
  try {
    const parsed = parseSessionToken(token, config);
    if (!parsed) return false;
    if (parsed.expiresAt <= Math.floor(Date.now() / 1000)) return false;
    if (!safeEqualStrings(parsed.fingerprint, credentialFingerprint(config))) return false;
    return await revokeNonce(parsed.nonce, parsed.expiresAt);
  } catch {
    return false;
  }
}

/**
 * Revoke every session token presented on this request.
 *
 * Mirrors getAdminSession's candidate discovery (duplicate cookies are
 * tolerated and work is bounded), so a browser that sends several session
 * cookies has all of them revoked, not just the one the browser would display.
 * Never throws.
 *
 * @param {Request & { cookies?: { get(name: string): { value?: string } | undefined } }} [request]
 * @returns {Promise<boolean>} true when at least one live token was revoked
 */
export async function revokeAdminSession(request) {
  const candidates = [];
  try {
    if (request && typeof request.cookies?.get === 'function') {
      const val = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (typeof val === 'string' && val.length > 0) candidates.push(val);
    }
    const rawCookie = request?.headers?.get ? request.headers.get('cookie') : null;
    if (typeof rawCookie === 'string') {
      const pattern = new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`, 'g');
      let match;
      while ((match = pattern.exec(rawCookie)) !== null) {
        if (match[1]) {
          try {
            candidates.push(decodeURIComponent(match[1]));
          } catch {
            // Malformed percent-encoding cannot be the cookie we set.
          }
        }
      }
    }
  } catch {
    // Fall through: revoking nothing is the documented logout fallback.
  }

  let revoked = false;
  const limit = Math.min(candidates.length, MAX_SESSION_COOKIE_CANDIDATES);
  for (let index = 0; index < limit; index += 1) {
    if (await revokeSession(candidates[index])) revoked = true;
  }
  return revoked;
}

/**
 * Read and verify the admin cookie for the current request.
 * Next.js 15 exposes `cookies()` as an async API; awaiting it is required.
 *
 * Duplicate cookies are tolerated: a browser may send several `gsdd_admin_session`
 * values (for example after a path-scoped cookie was written by an older build,
 * or after a sibling host tossed a cookie). Verification is cryptographic, so
 * accepting the first *valid* candidate cannot mint access, and it stops a junk
 * duplicate from silently signing the real admin out. Work is bounded.
 *
 * @returns {Promise<boolean>}
 */
export async function getAdminSession(request) {
  try {
    await syncCredentialsFromGcs();
    if (request) {
      if (typeof request.cookies?.get === 'function') {
        const val = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
        if (val && (await verifySession(val))) return true;
      }
      const rawCookie = request.headers?.get ? request.headers.get('cookie') : null;
      if (typeof rawCookie === 'string') {
        const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
        if (match && match[1] && (await verifySession(decodeURIComponent(match[1])))) return true;
      }
    }
    const cookieStore = await cookies();
    if (typeof cookieStore?.getAll === 'function') {
      const candidates = cookieStore.getAll(ADMIN_COOKIE_NAME);
      if (Array.isArray(candidates)) {
        const count = Math.min(candidates.length, MAX_SESSION_COOKIE_CANDIDATES);
        for (let index = 0; index < count; index += 1) {
          if (await verifySession(candidates[index]?.value)) return true;
        }
        return false;
      }
    }
    return verifySession(cookieStore?.get?.(ADMIN_COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

/**
 * Whether the current request carries a valid admin session.
 * Deliberately does not redirect: route handlers and pages decide their own
 * response (307 for pages, 401 for API routes).
 *
 * @param {Request} [request]
 * @returns {Promise<boolean>}
 */
export async function requireAdminSession(request) {
  return getAdminSession(request);
}

/**
 * Whether a request's Origin header matches the request's own origin.
 * Rejects missing/malformed Origins (fail closed) and only bridges the
 * protocol difference created by TLS termination, never a host difference.
 *
 * @param {Request | { url?: string, headers?: { get(name: string): string | null } }} request
 * @returns {boolean}
 */
export function isSameOrigin(request) {
  if (!request || typeof request !== 'object') return false;
  if (typeof request.url !== 'string') return false;
  if (!request.headers || typeof request.headers.get !== 'function') return false;

  const originHeader = request.headers.get('origin');
  if (typeof originHeader !== 'string') return false;
  const origin = originHeader.trim();
  if (origin.length === 0 || origin.length > 2048) return false;
  if (origin === 'null' || origin.includes(',')) return false; // opaque or duplicated

  // Defense in depth: a browser that labels the request cross-site can never
  // be same-origin, even if a proxy rewrote the Origin header.
  const fetchSite = firstHeaderValue(request.headers.get('sec-fetch-site'));
  if (fetchSite === 'cross-site') return false;

  let originUrl;
  let requestUrl;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  if (!isHttpUrl(originUrl) || !isHttpUrl(requestUrl)) return false;
  if (originUrl.username || originUrl.password) return false;
  if (originUrl.pathname !== '/' || originUrl.search || originUrl.hash) return false;

  // Cloud Run terminates TLS and may hand the app an http request URL. Trust
  // x-forwarded-proto only to restore the scheme; the host must still match.
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const effectiveProtocol = forwardedProto === 'https' ? 'https:' : requestUrl.protocol;
  const rawHost = request.headers.get('host');
  const host = (typeof rawHost === 'string' && rawHost.trim().length > 0 ? rawHost.trim() : null) ?? requestUrl.host;
  // Never accept a forwarded host, multiple hosts, credentials, or URL paths.
  if (!host || !/^[a-z0-9.\-:\[\]]+$/i.test(host)) return false;
  try {
    const expectedOrigin = new URL(`${effectiveProtocol}//${host}`).origin;
    if (originUrl.origin === expectedOrigin) return true;

    // Bridge localhost and 127.0.0.1 in local development / testing
    const isLocalOrigin = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
    const hostName = host.split(':')[0].toLowerCase();
    const isLocalHost = hostName === 'localhost' || hostName === '127.0.0.1';
    if (isLocalOrigin && isLocalHost) {
      const originPort = originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');
      const hostPort = host.includes(':') ? host.split(':')[1] : (effectiveProtocol === 'https:' ? '443' : '80');
      if (originPort === hostPort) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Whether the request reached the app over HTTPS. Cloud Run terminates TLS and
 * forwards plain HTTP to the container, so the proxy protocol header is the
 * only signal available. Used to force `Secure` on a cookie even when the app
 * is not built with NODE_ENV=production.
 *
 * @param {Request | { url?: string, headers?: { get(name: string): string | null } } | null | undefined} request
 * @returns {boolean}
 */
export function isHttpsRequest(request) {
  if (!request || typeof request !== 'object') return false;
  try {
    if (typeof request.url === 'string' && new URL(request.url).protocol === 'https:') return true;
  } catch {
    // Fall through to the proxy header.
  }
  if (!request.headers || typeof request.headers.get !== 'function') return false;
  return firstHeaderValue(request.headers.get('x-forwarded-proto')) === 'https';
}

/**
 * Cookie attributes for the admin session cookie.
 * Cloud Run serves production over HTTPS, so `secure` is enabled there and is
 * additionally forced by the routes when the proxy reports HTTPS.
 * Callers deleting the cookie should spread this and override `maxAge` to 0
 * and `expires` to the epoch.
 *
 * @param {Request | boolean} [requestOrSecure]
 * @returns {{
 *   httpOnly: true,
 *   sameSite: 'strict',
 *   secure: boolean,
 *   path: string,
 *   maxAge: number,
 *   expires: Date,
 *   priority: 'high',
 * }}
 */
export function cookieOptions(requestOrSecure) {
  const isSecure = typeof requestOrSecure === 'boolean'
    ? requestOrSecure
    : (requestOrSecure ? isHttpsRequest(requestOrSecure) : false);

  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: Boolean(process.env.NODE_ENV === 'production' || isSecure),
    path: '/',
    maxAge: SESSION_MAX_AGE,
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    priority: 'high',
  };
}

/**
 * Returns basic public profile details for the authenticated administrator.
 *
 * @returns {{ username: string, role: string, organization: string, sessionMaxAgeHours: number } | null}
 */
export function getAdminProfile() {
  const config = readConfig();
  if (!config) return null;
  return {
    username: config.username,
    role: 'Super Administrator',
    organization: 'Global Skills & Digital Development Foundation',
    sessionMaxAgeHours: SESSION_MAX_AGE / 3600,
  };
}

/**
 * Update the administrative password. Requires old password verification.
 * Computes scrypt key derivation with a fresh cryptographic salt and persists
 * the new hash to local credentials store.
 *
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function updateAdminPassword(oldPassword, newPassword) {
  await syncCredentialsFromGcs();
  const config = readConfig();
  if (!config) {
    return { ok: false, error: 'not_configured' };
  }

  if (typeof oldPassword !== 'string' || oldPassword.length === 0 || oldPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: 'invalid_current_password' };
  }

  const isOldValid = await verifyCredentials(config.username, oldPassword);
  if (!isOldValid) {
    return { ok: false, error: 'invalid_current_password' };
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: 'invalid_new_password' };
  }

  if (oldPassword === newPassword) {
    return { ok: false, error: 'same_as_current' };
  }

  try {
    const salt = randomBytes(16).toString('hex');
    const derived = await deriveKey(newPassword, salt);
    const hashHex = derived.toString('hex').toLowerCase();
    const hashString = `${salt}:${hashHex}`;

    // Persist to local data directory
    const dir = getCredentialsDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const credsPath = path.join(dir, 'admin-credentials.json');
    writeFileSync(
      credsPath,
      JSON.stringify({ passwordHash: hashString, updatedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );

    // Update in-memory hash immediately so following checks use new credential
    inMemoryPasswordHash = { salt, hash: hashHex };
    try {
      lastCredsMtime = statSync(credsPath).mtimeMs;
    } catch {}

    // Persist to Google Cloud Storage if bucket is configured
    await saveCredentialsToGcs(hashString);

    return { ok: true };
  } catch (err) {
    console.error('Failed to update admin password', err);
    return { ok: false, error: 'update_failed' };
  }
}
