import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import { NO_STORE, jsonResponse, setCoordinatorCookie } from '../../../lib/finance-api';
import { verifyCoordinatorCredentials } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const coord = await verifyCoordinatorCredentials(body.identifier || body.email, body.password);
  if (!coord) {
    return jsonResponse({ ok: false, error: 'Invalid coordinator credentials or inactive account.' }, 401);
  }

  const res = NextResponse.json({ ok: true, coordinator: coord }, { status: 200, headers: NO_STORE });
  if (!setCoordinatorCookie(res, request, coord.id)) {
    return jsonResponse({ ok: false, error: 'Signing secret is not configured.' }, 503);
  }
  return res;
}
