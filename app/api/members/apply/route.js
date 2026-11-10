import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/portal-auth';
import { createMembershipApplication } from '../../../lib/portal-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'forbidden_origin' }, { status: 403, headers: NO_STORE });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400, headers: NO_STORE });
    }
    const res = await createMembershipApplication(body);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: res.status, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, application: res.application }, { status: 201, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}
