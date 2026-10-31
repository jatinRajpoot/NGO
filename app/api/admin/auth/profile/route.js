import { NextResponse } from 'next/server';
import {
  getAdminProfile,
  requireAdminSession,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  const isAuth = await requireAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const profile = getAdminProfile();
  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'not_configured' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ ok: true, profile }, { status: 200, headers: NO_STORE_HEADERS });
}
