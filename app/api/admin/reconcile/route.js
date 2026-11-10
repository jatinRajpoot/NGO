import { NextResponse } from 'next/server';
import { isSameOrigin, requireAdminSession } from '../../../lib/admin-auth';
import { listPendingReconciliations, reconcilePortalItem } from '../../../lib/portal-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request) {
  const authed = await requireAdminSession(request);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }
  try {
    const data = await listPendingReconciliations();
    return NextResponse.json({ ok: true, ...data }, { status: 200, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'forbidden_origin' }, { status: 403, headers: NO_STORE });
  }
  const authed = await requireAdminSession(request);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400, headers: NO_STORE });
    }
    const res = await reconcilePortalItem({
      kind: body.kind,
      id: body.id,
      action: body.action,
      bankRef: body.bankRef,
      adminUser: 'admin',
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: res.status, headers: NO_STORE });
    }
    return NextResponse.json(res, { status: 200, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}
