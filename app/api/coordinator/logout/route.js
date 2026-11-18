import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import { isHttpsRequest, portalCookieOptions, revokePortalSessionFromRequest } from '../../../lib/portal-auth';
import { COORDINATOR_COOKIE, NO_STORE, jsonResponse } from '../../../lib/finance-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  if (!(await revokePortalSessionFromRequest(request, 'coordinator'))) {
    return jsonResponse({ ok: false, error: 'session_revocation_unavailable' }, 503);
  }
  const res = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  res.cookies.set(COORDINATOR_COOKIE, '', {
    ...portalCookieOptions(isHttpsRequest(request)),
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
