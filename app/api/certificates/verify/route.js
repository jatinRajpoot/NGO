import { NextResponse } from 'next/server';
import { verifyDocumentCode } from '../../../lib/portal-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || url.searchParams.get('id') || '';
    if (!code.trim()) {
      return NextResponse.json({ ok: false, error: 'Verification code is required' }, { status: 400, headers: NO_STORE });
    }
    const result = await verifyDocumentCode(code);
    return NextResponse.json({ ok: true, ...result }, { status: result.found ? 200 : 404, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const code = body?.code || body?.id || body?.query || '';
    if (!String(code).trim()) {
      return NextResponse.json({ ok: false, error: 'Verification code is required' }, { status: 400, headers: NO_STORE });
    }
    const result = await verifyDocumentCode(code);
    return NextResponse.json({ ok: true, ...result }, { status: result.found ? 200 : 404, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}
