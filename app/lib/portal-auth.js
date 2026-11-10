// Server-only authentication & session management for Member and Donor portals.
// Uses node:crypto scrypt hashing, timingSafeEqual, and HMAC-SHA256 signed HttpOnly cookies
// with server-side session revocation stored alongside portal data.

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cookies } from 'next/headers.js';
import { Storage } from '@google-cloud/storage';

export const MEMBER_COOKIE_NAME = 'gsdd_member_session';
export const DONOR_COOKIE_NAME = 'gsdd_donor_session';
export const PORTAL_SESSION_MAX_AGE = 28800; // 8 hours

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const REVOCATION_FILENAME = 'portal-revoked-sessions.json';
const SECRET_FILENAME = 'portal-session-secret.key';
const REVOCATION_MAX_ENTRIES = 2048;

const SALT_PATTERN = /^[0-9a-f]{16,128}$/i;
const HASH_PATTERN = /^[0-9a-f]{128}$/i;
const EXPIRY_PATTERN = /^[0-9]{1,12}$/;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{3,64}$/;

let cachedSecret = null;
let cachedGcsClient = null;
const memoryRevoked = new Set();
let revocationChain = Promise.resolve();

function getPortalDataDir() {
  const candidates = [
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'portal'),
    path.join(tmpdir(), 'gsdd-portal-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // Try next candidate
    }
  }
  return path.join(tmpdir(), 'gsdd-portal-data');
}

function getGcsBucket() {
  const bucketName = process.env.GALLERY_BUCKET;
  if (typeof bucketName !== 'string' || bucketName.trim().length === 0) return null;
  try {
    if (!cachedGcsClient) cachedGcsClient = new Storage();
    return cachedGcsClient.bucket(bucketName.trim());
  } catch {
    return null;
  }
}

function getSessionSecret() {
  const envSecret = (process.env.PORTAL_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || '').trim();
  if (envSecret.length >= 32) return envSecret;
  if (cachedSecret) return cachedSecret;

  const secretPath = path.join(getPortalDataDir(), SECRET_FILENAME);
  try {
    if (existsSync(secretPath)) {
      const stored = readFileSync(secretPath, 'utf8').trim();
      if (stored.length >= 32) {
        cachedSecret = stored;
        return cachedSecret;
      }
    }
  } catch {}

  const generated = randomBytes(48).toString('hex');
  cachedSecret = generated;
  try {
    writeFileSync(secretPath, generated, { encoding: 'utf8', mode: 0o600 });
  } catch {}
  return generated;
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest();
}

function safeEqualStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return timingSafeEqual(sha256(a), sha256(b));
}

function signPayload(payload, secret) {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('base64url');
}

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 1024) {
    throw new Error('Password must be between 8 and 1024 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 1024) {
    return false;
  }
  const fallbackSalt = '00000000000000000000000000000000';
  const parts = typeof storedHash === 'string' ? storedHash.split(':') : [];
  const validFormat =
    parts.length === 2 && SALT_PATTERN.test(parts[0]) && HASH_PATTERN.test(parts[1]);

  const salt = validFormat ? parts[0] : fallbackSalt;
  const derived = await deriveKey(password, salt);
  if (!validFormat) return false;
  const expected = Buffer.from(parts[1].toLowerCase(), 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function pruneRevoked(entries) {
  const now = Math.floor(Date.now() / 1000);
  const kept = (Array.isArray(entries) ? entries : []).filter(
    (e) => e && typeof e.nonce === 'string' && Number.isSafeInteger(e.expiresAt) && e.expiresAt > now
  );
  return kept.length > REVOCATION_MAX_ENTRIES ? kept.slice(-REVOCATION_MAX_ENTRIES) : kept;
}

async function readRevokedList() {
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const [contents] = await bucket.file(`portal/${REVOCATION_FILENAME}`).download();
      const parsed = JSON.parse(contents.toString('utf8'));
      return pruneRevoked(parsed?.revoked);
    } catch {
      return [];
    }
  }
  try {
    const raw = readFileSync(path.join(getPortalDataDir(), REVOCATION_FILENAME), 'utf8');
    return pruneRevoked(JSON.parse(raw)?.revoked);
  } catch {
    return [];
  }
}

async function writeRevokedList(entries) {
  const payload = JSON.stringify({ version: 1, revoked: entries }, null, 2);
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`portal/${REVOCATION_FILENAME}`).save(payload, {
      contentType: 'application/json',
      resumable: false,
    });
    return;
  }
  const target = path.join(getPortalDataDir(), REVOCATION_FILENAME);
  const temp = `${target}.tmp.${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(temp, payload, 'utf8');
    renameSync(temp, target);
  } catch (err) {
    try {
      unlinkSync(temp);
    } catch {}
    throw err;
  }
}

async function isNonceRevoked(nonce) {
  if (memoryRevoked.has(nonce)) return true;
  const list = await readRevokedList();
  return list.some((e) => e.nonce === nonce);
}

async function revokeNonce(nonce, expiresAt) {
  if (!NONCE_PATTERN.test(nonce)) return false;
  memoryRevoked.add(nonce);
  const next = revocationChain.then(async () => {
    const existing = await readRevokedList();
    const merged = pruneRevoked([...existing, { nonce, expiresAt }]);
    const seen = new Set();
    const deduped = [];
    for (const entry of merged) {
      if (seen.has(entry.nonce)) continue;
      seen.add(entry.nonce);
      deduped.push(entry);
    }
    await writeRevokedList(deduped);
  });
  revocationChain = next.catch(() => {});
  try {
    await next;
    return true;
  } catch {
    return false;
  }
}

export function createPortalSessionToken(role, subjectId, tokenVersion = 1) {
  if (role !== 'member' && role !== 'donor') {
    throw new Error('Invalid portal role');
  }
  if (!ID_PATTERN.test(String(subjectId || ''))) {
    throw new Error('Invalid subject id');
  }
  const secret = getSessionSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + PORTAL_SESSION_MAX_AGE;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `p1.${role}.${subjectId}.${tokenVersion}.${expiresAt}.${nonce}`;
  return `${payload}.${signPayload(payload, secret)}`;
}

export function parsePortalSessionToken(token, expectedRole) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 256) return null;
  const parts = token.split('.');
  if (parts.length !== 7) return null;
  const [prefix, role, subjectId, tvRaw, expiresRaw, nonce, signature] = parts;
  if (prefix !== 'p1' || role !== expectedRole) return null;
  if (!ID_PATTERN.test(subjectId)) return null;
  if (!/^\d{1,6}$/.test(tvRaw)) return null;
  if (!EXPIRY_PATTERN.test(expiresRaw)) return null;
  if (!NONCE_PATTERN.test(nonce)) return null;
  if (!SIGNATURE_PATTERN.test(signature)) return null;

  const expiresAt = Number(expiresRaw);
  const tokenVersion = Number(tvRaw);
  if (!Number.isSafeInteger(expiresAt) || !Number.isSafeInteger(tokenVersion)) return null;

  const payload = `${prefix}.${role}.${subjectId}.${tvRaw}.${expiresRaw}.${nonce}`;
  const expectedSig = signPayload(payload, getSessionSecret());
  if (!safeEqualStrings(signature, expectedSig)) return null;

  return { role, subjectId, tokenVersion, expiresAt, nonce };
}

export async function verifyPortalSession(token, expectedRole, expectedTokenVersion = null) {
  const parsed = parsePortalSessionToken(token, expectedRole);
  if (!parsed) return null;
  const now = Math.floor(Date.now() / 1000);
  if (parsed.expiresAt <= now) return null;
  if (parsed.expiresAt > now + PORTAL_SESSION_MAX_AGE + 300) return null;
  if (expectedTokenVersion !== null && parsed.tokenVersion !== expectedTokenVersion) return null;
  if (await isNonceRevoked(parsed.nonce)) return null;
  return parsed;
}

export async function getPortalSessionFromRequest(request, role) {
  const cookieName = role === 'member' ? MEMBER_COOKIE_NAME : DONOR_COOKIE_NAME;
  const candidates = [];

  if (request && typeof request.cookies?.get === 'function') {
    const val = request.cookies.get(cookieName)?.value;
    if (val) candidates.push(val);
  }
  const rawCookie = request?.headers?.get ? request.headers.get('cookie') : null;
  if (typeof rawCookie === 'string') {
    const pattern = new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`, 'g');
    let match;
    while ((match = pattern.exec(rawCookie)) !== null) {
      try {
        candidates.push(decodeURIComponent(match[1]));
      } catch {}
    }
  }
  if (candidates.length === 0) {
    try {
      const store = await cookies();
      for (const item of store.getAll(cookieName)) {
        if (item?.value) candidates.push(item.value);
      }
    } catch {}
  }

  for (const candidate of candidates.slice(0, 6)) {
    const verified = await verifyPortalSession(candidate, role);
    if (verified) return verified;
  }
  return null;
}

export async function revokePortalSessionFromRequest(request, role) {
  const cookieName = role === 'member' ? MEMBER_COOKIE_NAME : DONOR_COOKIE_NAME;
  const candidates = [];
  if (request && typeof request.cookies?.get === 'function') {
    const val = request.cookies.get(cookieName)?.value;
    if (val) candidates.push(val);
  }
  const rawCookie = request?.headers?.get ? request.headers.get('cookie') : null;
  if (typeof rawCookie === 'string') {
    const pattern = new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`, 'g');
    let match;
    while ((match = pattern.exec(rawCookie)) !== null) {
      try {
        candidates.push(decodeURIComponent(match[1]));
      } catch {}
    }
  }
  let revoked = false;
  for (const token of candidates.slice(0, 6)) {
    const parsed = parsePortalSessionToken(token, role);
    if (parsed && (await revokeNonce(parsed.nonce, parsed.expiresAt))) {
      revoked = true;
    }
  }
  return revoked;
}

export function isHttpsRequest(request) {
  const proto = request?.headers?.get ? request.headers.get('x-forwarded-proto') : null;
  if (typeof proto === 'string' && proto.split(',')[0].trim().toLowerCase() === 'https') {
    return true;
  }
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function portalCookieOptions(isHttps) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: Boolean(isHttps || process.env.NODE_ENV === 'production' && process.env.GALLERY_BUCKET),
  };
}

export function isSameOrigin(request) {
  if (!request || typeof request !== 'object') return false;
  if (typeof request.url !== 'string') return false;
  if (!request.headers || typeof request.headers.get !== 'function') return false;

  const originHeader = request.headers.get('origin');
  if (typeof originHeader !== 'string') return false;
  const origin = originHeader.trim();
  if (origin.length === 0 || origin.length > 2048 || origin === 'null' || origin.includes(',')) {
    return false;
  }

  const fetchSite = (request.headers.get('sec-fetch-site') || '').split(',')[0].trim().toLowerCase();
  if (fetchSite === 'cross-site') return false;

  let originUrl;
  let requestUrl;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  if ((originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') || originUrl.username || originUrl.password) {
    return false;
  }
  if (originUrl.pathname !== '/' || originUrl.search || originUrl.hash) return false;

  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const effectiveProtocol = forwardedProto === 'https' ? 'https:' : requestUrl.protocol;
  const rawHost = request.headers.get('host');
  const host = (typeof rawHost === 'string' && rawHost.trim().length > 0 ? rawHost.trim() : null) ?? requestUrl.host;
  if (!host || !/^[a-z0-9.\-:\[\]]+$/i.test(host)) return false;

  try {
    const expectedOrigin = new URL(`${effectiveProtocol}//${host}`).origin;
    if (originUrl.origin === expectedOrigin) return true;

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
