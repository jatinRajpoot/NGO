import { NextResponse } from 'next/server';
import { cookieOptions, isSameOrigin } from '../../../lib/admin-auth';
import { COORDINATOR_COOKIE, NO_STORE, jsonResponse } from '../../../lib/finance-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const res = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  res.cookies.set(COORDINATOR_COOKIE, '', {
    ...cookieOptions(request),
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
