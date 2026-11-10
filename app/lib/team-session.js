// Server-only session, scrypt credential verification, and profile persistence for Team Portal.

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cookies } from 'next/headers.js';
import { Storage } from '@google-cloud/storage';
import { defaultTeamMembers } from '../team/team-data';
import { isHttpsRequest } from './admin-auth';

export const TEAM_COOKIE_NAME = 'gsdd_team_session';
export const TEAM_SESSION_MAX_AGE = 28800; // 8 hours

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const REVOCATION_FILENAME = 'team-revoked-sessions.json';
const ACCOUNTS_FILENAME = 'team-accounts.json';
const SECRET_FILENAME = 'team-session-secret.key';

let cachedSecret = null;
let cachedGcsClient = null;
const memoryRevoked = new Set();
let teamLock = Promise.resolve();

function withTeamLock(fn) {
  const next = teamLock.then(fn, fn);
  teamLock = next.catch(() => {});
  return next;
}

function getTeamDataDir() {
  const candidates = [
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'team'),
    path.join(tmpdir(), 'gsdd-team-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // Try next directory
    }
  }
  return path.join(tmpdir(), 'gsdd-team-data');
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
  const envSecret = (
    process.env.TEAM_SESSION_SECRET ||
    process.env.PORTAL_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    ''
  ).trim();
  if (envSecret.length >= 32) return envSecret;
  if (cachedSecret) return cachedSecret;

  const secretPath = path.join(getTeamDataDir(), SECRET_FILENAME);
  try {
    if (existsSync(secretPath)) {
      const stored = readFileSync(secretPath, 'utf8').trim();
      if (stored.length >= 32) {
        cachedSecret = stored;
        return cachedSecret;
      }
    }
  } catch {
    // Generate new ephemeral/persisted secret
  }

  const generated = randomBytes(48).toString('hex');
  try {
    writeFileSync(secretPath, generated, { encoding: 'utf8', mode: 0o600 });
  } catch {
    // Fallback to memory only
  }
  cachedSecret = generated;
  return generated;
}

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scryptCallback(String(password), salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

export async function hashTeamPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await deriveKey(password, salt);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyTeamPassword(password, storedHash) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 512) return false;
  const parts = typeof storedHash === 'string' ? storedHash.split(':') : [];
  const validFormat =
    parts.length === 2 && /^[0-9a-f]{16,128}$/i.test(parts[0]) && /^[0-9a-f]{128}$/i.test(parts[1]);
  const salt = validFormat ? parts[0] : '00000000000000000000000000000000';
  const derived = await deriveKey(password, salt);
  if (!validFormat) return false;
  const expected = Buffer.from(parts[1].toLowerCase(), 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

async function readJsonFile(filename, createDefaultFn) {
  const bucket = getGcsBucket();
  if (bucket) {
    const file = bucket.file(`team/${filename}`);
    try {
      const [contents] = await file.download();
      return JSON.parse(contents.toString('utf8'));
    } catch (err) {
      if (err?.code === 404 || err?.status === 404 || err?.statusCode === 404) {
        const initial = await createDefaultFn();
        await writeJsonFile(filename, initial);
        return initial;
      }
      throw err;
    }
  }
  const target = path.join(getTeamDataDir(), filename);
  if (!existsSync(target)) {
    const initial = await createDefaultFn();
    await writeJsonFile(filename, initial);
    return initial;
  }
  return JSON.parse(readFileSync(target, 'utf8'));
}

async function writeJsonFile(filename, data) {
  const payload = JSON.stringify(data, null, 2);
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`team/${filename}`).save(payload, {
      contentType: 'application/json',
      resumable: false,
    });
    return;
  }
  const target = path.join(getTeamDataDir(), filename);
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

export async function getTeamAccounts() {
  return readJsonFile(ACCOUNTS_FILENAME, () =>
    defaultTeamMembers.map((m) => ({
      ...m,
      passwordHash: null,
      tokenVersion: 1,
    }))
  );
}

export function sanitizeTeamMember(account) {
  if (!account) return null;
  const { passwordHash, tokenVersion, ...safe } = account;
  return safe;
}

export async function authenticateTeamMember(identifier, password) {
  const term = String(identifier || '').trim().toLowerCase();
  const normalizedPhone = term.replace(/\s+/g, '');
  if (!term || typeof password !== 'string' || password.length === 0) return null;

  const accounts = await getTeamAccounts();
  const account = accounts.find(
    (m) =>
      String(m.email || '').toLowerCase() === term ||
      String(m.id || '').toLowerCase() === term ||
      String(m.phone || '').replace(/\s+/g, '').toLowerCase() === normalizedPhone
  );
  if (!account) return null;

  // Check per-account stored hash first
  if (account.passwordHash) {
    const ok = await verifyTeamPassword(password, account.passwordHash);
    return ok ? { member: sanitizeTeamMember(account), tokenVersion: Number(account.tokenVersion || 1) } : null;
  }

  // Otherwise check explicitly configured server secret for executive portal
  const envMemberKey = `TEAM_PASSWORD_${String(account.id || '').replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
  const configuredSecret = (process.env[envMemberKey] || process.env.TEAM_PORTAL_PASSWORD || '').trim();
  if (configuredSecret.length < 8) {
    return null;
  }

  const expectedHash = await hashTeamPassword(configuredSecret);
  const ok = await verifyTeamPassword(password, expectedHash);
  return ok ? { member: sanitizeTeamMember(account), tokenVersion: Number(account.tokenVersion || 1) } : null;
}

function signPayload(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createTeamSessionToken(memberId, tokenVersion = 1) {
  const cleanId = String(memberId || '').trim();
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(cleanId)) {
    throw new Error('Invalid team member id');
  }
  const expiresAt = Math.floor(Date.now() / 1000) + TEAM_SESSION_MAX_AGE;
  const nonce = randomBytes(16).toString('base64url');
  const payload = `t1.${cleanId}.${tokenVersion}.${expiresAt}.${nonce}`;
  return `${payload}.${signPayload(payload, getSessionSecret())}`;
}

export async function verifyTeamSessionToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 256) return null;
  const parts = token.split('.');
  if (parts.length !== 6) return null;
  const [prefix, memberId, tvRaw, expiresRaw, nonce, sig] = parts;
  if (prefix !== 't1') return null;
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(memberId)) return null;
  if (!/^\d{1,6}$/.test(tvRaw) || !/^\d{1,12}$/.test(expiresRaw)) return null;
  if (!/^[A-Za-z0-9_-]{22}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(sig)) return null;

  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;

  const payload = `t1.${memberId}.${tvRaw}.${expiresRaw}.${nonce}`;
  const expectedSig = signPayload(payload, getSessionSecret());
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  if (memoryRevoked.has(nonce)) return null;
  const revokedList = await readJsonFile(REVOCATION_FILENAME, () => ({ revoked: [] }));
  const now = Math.floor(Date.now() / 1000);
  if (
    Array.isArray(revokedList?.revoked) &&
    revokedList.revoked.some((entry) => entry && entry.nonce === nonce && entry.expiresAt > now)
  ) {
    memoryRevoked.add(nonce);
    return null;
  }

  return { memberId, tokenVersion: Number(tvRaw), expiresAt, nonce };
}

export async function getAuthenticatedTeamMember(request) {
  let token = request?.cookies?.get?.(TEAM_COOKIE_NAME)?.value || null;
  if (!token) {
    try {
      const store = await cookies();
      token = store.get(TEAM_COOKIE_NAME)?.value || null;
    } catch {
      token = null;
    }
  }
  const session = await verifyTeamSessionToken(token);
  if (!session) return null;

  const accounts = await getTeamAccounts();
  const account = accounts.find((m) => m.id === session.memberId);
  if (!account) return null;
  if (Number(account.tokenVersion || 1) !== session.tokenVersion) return null;
  return { session, member: sanitizeTeamMember(account) };
}

export async function revokeTeamSession(request) {
  let token = request?.cookies?.get?.(TEAM_COOKIE_NAME)?.value || null;
  if (!token) {
    try {
      const store = await cookies();
      token = store.get(TEAM_COOKIE_NAME)?.value || null;
    } catch {
      token = null;
    }
  }
  const session = await verifyTeamSessionToken(token);
  if (!session) return false;
  memoryRevoked.add(session.nonce);
  await withTeamLock(async () => {
    const data = await readJsonFile(REVOCATION_FILENAME, () => ({ revoked: [] }));
    const now = Math.floor(Date.now() / 1000);
    const active = (Array.isArray(data?.revoked) ? data.revoked : []).filter(
      (entry) => entry && entry.nonce && entry.expiresAt > now && entry.nonce !== session.nonce
    );
    active.push({ nonce: session.nonce, expiresAt: session.expiresAt });
    await writeJsonFile(REVOCATION_FILENAME, { revoked: active.slice(-1024) });
  });
  return true;
}

export async function updateTeamMemberRecord(memberId, updaterFn) {
  return withTeamLock(async () => {
    const accounts = await getTeamAccounts();
    const index = accounts.findIndex((m) => m.id === memberId);
    if (index === -1) return null;
    const next = await updaterFn(accounts[index]);
    accounts[index] = next;
    await writeJsonFile(ACCOUNTS_FILENAME, accounts);
    return sanitizeTeamMember(next);
  });
}

export function teamCookieOptions(request) {
  const isHttps = isHttpsRequest(request);
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TEAM_SESSION_MAX_AGE,
    secure: Boolean(isHttps || (process.env.NODE_ENV === 'production' && process.env.GALLERY_BUCKET)),
  };
}
