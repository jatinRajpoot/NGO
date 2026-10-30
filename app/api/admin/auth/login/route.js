// POST /api/admin/auth/login
//
// Authenticates an admin and mints the signed session cookie. This route must
// run on the Node.js runtime because `app/lib/admin-auth.js` uses `node:crypto`
// and `next/headers`.
//
// Responses:
//   200 { ok: true }        session cookie set
//   400 { ok: false }       malformed or oversized request body/credentials
//   401 { ok: false }       credentials rejected
//   403 { ok: false }       missing or mismatched Origin header
//   429 { ok: false }       too many failed attempts for this client
//   503 { ok: false }       admin authentication is not configured
//
// Rate limiting is best-effort only. Counters live in module memory, so they
// are per process, reset on cold start, and are NOT shared between Cloud Run
// instances. This raises the cost of online guessing but does not replace an
// edge limit (Cloud Armor / load-balancer rate limiting) or an external store.
//
// Client identification uses the *last* address in x-forwarded-for, i.e. the
// hop appended by the closest proxy. Cloud Run appends the address it sees to
// any client-supplied list, so a caller cannot rotate the limiter key by
// sending fake leading entries. Only once that header is absent do the
// single-value x-real-ip / cf-connecting-ip headers get considered.

import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE,
  cookieOptions,
  createSession,
  isAdminConfigured,
  isHttpsRequest,
  isSameOrigin,
  verifyCredentials,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 8192; // 8 KiB
const MAX_USERNAME_LENGTH = 128;
const MAX_PASSWORD_LENGTH = 1024;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_MAX_KEYS = 2048;
const MAX_CLIENT_KEY_LENGTH = 64;
const MAX_FORWARDED_FOR_HOPS = 16;
const MAX_CONCURRENT_VERIFICATIONS = 4;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

// Bounded, best-effort failure counter keyed by client address. Keys are
// validated IPs/strings and the Map is capped, so attacker-chosen values cannot
// grow memory without bound.
const failedAttempts = new Map();

// Bounded concurrency counter to protect the libuv threadpool and container
// memory from scrypt exhaustion under concurrent login load.
let activeVerifications = 0;

function send(body, status, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });
}

function failure(status, error, headers = {}) {
  return send({ ok: false, error }, status, headers);
}

function hasJsonContentType(request) {
  const header = request?.headers?.get ? request.headers.get('content-type') : null;
  if (typeof header !== 'string' || header.trim() === '') return false;
  const mediaType = header.split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

/**
 * Read at most MAX_BODY_BYTES of the request body and decode it as UTF-8.
 * Returns null for oversized, unreadable, or invalid-UTF-8 bodies.
 */
async function readBody(request) {
  const declared = request?.headers?.get ? request.headers.get('content-length') : null;
  if (typeof declared === 'string' && declared !== '') {
    const trimmed = declared.trim();
    if (!/^\d{1,7}$/.test(trimmed)) return null;
    if (Number(trimmed) > MAX_BODY_BYTES) return null;
  }
  if (!request?.body || typeof request.body.getReader !== 'function') {
    return null;
  }

  let reader;
  try {
    reader = request.body.getReader();
  } catch {
    return null;
  }

  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The stream may already be closed; nothing left to do.
        }
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Lock already released.
    }
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Parse `{ username, password }` with strict shape and length bounds.
 * Unknown extra fields are ignored; anything else yields null (400).
 */
function parseCredentials(text) {
  if (typeof text !== 'string' || text.length === 0) return null;

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const { username, password } = data;
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) return null;
  if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) return null;

  return { username, password };
}

function normalizeIp(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > MAX_CLIENT_KEY_LENGTH) return null;
  if (isIP(trimmed)) return trimmed;
  // Handle bracketed IPv6: [::1] or [2001:db8::1] with optional port
  if (trimmed.startsWith('[')) {
    const closing = trimmed.indexOf(']');
    if (closing !== -1) {
      const v6 = trimmed.slice(1, closing);
      if (isIP(v6) === 6) return v6;
    }
  }
  // Handle IPv4 with port: 192.168.1.1:8080
  const colonIndex = trimmed.lastIndexOf(':');
  if (colonIndex !== -1 && trimmed.indexOf(':') === colonIndex) {
    const v4 = trimmed.slice(0, colonIndex);
    if (isIP(v4) === 4) return v4;
  }
  return null;
}

function clientKey(request) {
  const forwarded = request?.headers?.get ? request.headers.get('x-forwarded-for') : null;
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const rawHops = forwarded.split(',');
    const hops = rawHops.slice(-MAX_FORWARDED_FOR_HOPS);
    for (let index = hops.length - 1; index >= 0; index -= 1) {
      const ip = normalizeIp(hops[index]);
      if (ip) return ip;
    }
  }
  const realIp = request?.headers?.get ? request.headers.get('x-real-ip') : null;
  if (typeof realIp === 'string') {
    const ip = normalizeIp(realIp);
    if (ip) return ip;
  }
  const cfIp = request?.headers?.get ? request.headers.get('cf-connecting-ip') : null;
  if (typeof cfIp === 'string') {
    const ip = normalizeIp(cfIp);
    if (ip) return ip;
  }
  if (typeof request?.ip === 'string') {
    const ip = normalizeIp(request.ip);
    if (ip) return ip;
  }
  return 'unknown';
}

function pruneAttempts(now) {
  for (const [key, entry] of failedAttempts) {
    if (!entry || entry.resetAt <= now) failedAttempts.delete(key);
  }
}

function checkRateLimit(key, now) {
  const entry = failedAttempts.get(key);
  if (!entry) return { limited: false, retryAfter: 0 };
  if (entry.resetAt <= now) {
    failedAttempts.delete(key);
    return { limited: false, retryAfter: 0 };
  }
  if (entry.count < RATE_LIMIT_MAX_ATTEMPTS) return { limited: false, retryAfter: 0 };
  return {
    limited: true,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

function recordFailure(key, now) {
  const entry = failedAttempts.get(key);
  if (entry && entry.resetAt > now) {
    entry.count += 1;
    // Refresh insertion order so eviction removes the least recently seen key.
    failedAttempts.delete(key);
    failedAttempts.set(key, entry);
    return;
  }

  failedAttempts.delete(key);
  if (failedAttempts.size >= RATE_LIMIT_MAX_KEYS) {
    pruneAttempts(now);
    if (failedAttempts.size >= RATE_LIMIT_MAX_KEYS) {
      const oldest = failedAttempts.keys().next();
      if (!oldest.done) failedAttempts.delete(oldest.value);
    }
  }
  failedAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) return failure(403, 'forbidden_origin');
    if (!isAdminConfigured()) return failure(503, 'not_configured');

    const now = Date.now();
    const key = clientKey(request);
    const limit = checkRateLimit(key, now);
    if (limit.limited) {
      return failure(429, 'too_many_attempts', {
        'Retry-After': String(limit.retryAfter),
      });
    }

    if (!hasJsonContentType(request)) return failure(400, 'invalid_request');

    const credentials = parseCredentials(await readBody(request));
    if (!credentials) return failure(400, 'invalid_request');

    if (activeVerifications >= MAX_CONCURRENT_VERIFICATIONS) {
      return failure(429, 'too_many_attempts', {
        'Retry-After': '1',
      });
    }

    activeVerifications += 1;
    let valid = false;
    try {
      valid = await verifyCredentials(credentials.username, credentials.password);
    } catch {
      valid = false;
    } finally {
      activeVerifications = Math.max(0, activeVerifications - 1);
    }

    if (!valid) {
      recordFailure(key, Date.now());
      return failure(401, 'invalid_credentials');
    }

    failedAttempts.delete(key);

    // Mint after the credential check so an unconfigured deployment can never
    // produce a cookie. createSession() returning null means config vanished
    // between checks (or is otherwise unusable), so fail closed.
    const token = createSession();
    if (!token) return failure(503, 'not_configured');

    const isHttps = isHttpsRequest(request);
    const baseCookieOpts = cookieOptions(isHttps);

    const response = send({ ok: true }, 200);
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      ...baseCookieOpts,
      secure: Boolean(baseCookieOpts.secure || isHttps),
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return failure(500, 'internal_error');
  }
}
