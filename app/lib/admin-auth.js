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
// Session tokens are stateless: `v1.<expiresAt>.<fingerprint>.<nonce>.<hmac>`.
// The HMAC covers the first four segments, and the fingerprint covers the
// configured username plus password hash. Rotating either credential or the
// session secret therefore revokes every outstanding token. There is no
// server-side revocation list.
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
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'gsdd_admin_session';
export const SESSION_MAX_AGE = 28800; // 8 hours, in seconds

const TOKEN_VERSION = 'v1';
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

function readConfig() {
  const username = readEnvString('ADMIN_USERNAME');
  const secret = readEnvString('ADMIN_SESSION_SECRET');
  const password = parsePasswordHash(readEnvString('ADMIN_PASSWORD_HASH'));
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
  const config = readConfig();
  if (!config) return false;
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) return false;
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) return false;

  try {
    const derived = await deriveKey(password, config.salt);
    const expected = Buffer.from(config.hash, 'hex');
    const passwordOk = safeEqualBuffers(derived, expected);
    const usernameOk = safeEqualStrings(username, config.username);
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
 * Verify a session token's signature, expiry, and credential fingerprint.
 * Any malformed, expired, foreign, or stale token yields false; this function
 * never throws.
 *
 * @param {unknown} token
 * @returns {boolean}
 */
export function verifySession(token) {
  if (typeof token !== 'string') return false;
  if (token.length === 0 || token.length > TOKEN_MAX_LENGTH) return false;

  const config = readConfig();
  if (!config) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 5) return false;
    const [version, expiresRaw, fingerprint, nonce, signature] = parts;
    if (version !== TOKEN_VERSION) return false;
    if (!EXPIRY_PATTERN.test(expiresRaw)) return false;
    if (!FINGERPRINT_PATTERN.test(fingerprint)) return false;
    if (!NONCE_PATTERN.test(nonce)) return false;
    if (!SIGNATURE_PATTERN.test(signature)) return false;

    const expiresAt = Number(expiresRaw);
    if (!Number.isSafeInteger(expiresAt)) return false;

    const payload = `${version}.${expiresRaw}.${fingerprint}.${nonce}`;
    if (!safeEqualStrings(signature, sign(payload, config.secret))) return false;

    const now = Math.floor(Date.now() / 1000);
    if (expiresAt <= now) return false;
    if (expiresAt > now + SESSION_MAX_AGE + EXPIRY_CLOCK_SKEW) return false;

    // Rotating the username or password hash changes the fingerprint, so old
    // tokens are rejected even though their HMAC is still valid.
    return safeEqualStrings(fingerprint, credentialFingerprint(config));
  } catch {
    return false;
  }
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
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    if (typeof cookieStore?.getAll === 'function') {
      const candidates = cookieStore.getAll(ADMIN_COOKIE_NAME);
      if (Array.isArray(candidates)) {
        const count = Math.min(candidates.length, MAX_SESSION_COOKIE_CANDIDATES);
        for (let index = 0; index < count; index += 1) {
          if (verifySession(candidates[index]?.value)) return true;
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
 * @returns {Promise<boolean>}
 */
export async function requireAdminSession() {
  return getAdminSession();
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
    return originUrl.origin === new URL(`${effectiveProtocol}//${host}`).origin;
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
