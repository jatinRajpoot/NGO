// POST /api/admin/auth/logout
//
// Revokes the presented session server-side, then clears the admin session
// cookie. The token's nonce is added to the revocation list maintained by
// `app/lib/admin-auth.js`, so replaying a copy of the cookie after logout fails
// verification instead of staying usable until expiry.
//
// Revocation is scoped to the cookies on this request: other devices signed in
// with the same credentials keep their sessions. Store failures never fail the
// request — the cookie is still cleared and the session then falls back to
// expiring normally (see the fallback note in admin-auth.js).
//
// Responses:
//   200 { ok: true }        cookie cleared (idempotent)
//   403 { ok: false }       missing or mismatched Origin header
//
// Runs on the Node.js runtime to match `app/lib/admin-auth.js`.

import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  cookieOptions,
  isHttpsRequest,
  isSameOrigin,
  revokeAdminSession,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

function send(body, status, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });
}

function failure(status, error, headers = {}) {
  return send({ ok: false, error }, status, headers);
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return failure(403, 'forbidden_origin');
    }

    // Revoke before clearing. `revokeAdminSession` never throws, so a store
    // outage degrades to the previous behaviour (token valid until expiry)
    // instead of blocking the response the browser needs to drop the cookie.
    await revokeAdminSession(request);

    // Same name, path, and security attributes as the login cookie, with an
    // immediate expiry so browsers drop it. The empty value is a fallback for
    // clients that only honour Set-Cookie value changes.
    const isHttps = isHttpsRequest(request);
    const baseCookieOpts = cookieOptions(isHttps);

    const response = send({ ok: true }, 200);
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: '',
      ...baseCookieOpts,
      secure: Boolean(baseCookieOpts.secure || isHttps),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch {
    return failure(500, 'internal_error');
  }
}
