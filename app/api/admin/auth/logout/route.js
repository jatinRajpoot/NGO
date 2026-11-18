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

    if (!(await revokeAdminSession(request))) {
      return failure(503, 'session_revocation_unavailable');
    }

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
