import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../lib/portal-auth';
import { requestVisitorCertificate, verifyDocumentCode } from '../../lib/portal-store';

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
      return NextResponse.json({ ok: false, error: 'code parameter is required' }, { status: 400, headers: NO_STORE });
    }
    const result = await verifyDocumentCode(code);
    return NextResponse.json({ ok: true, ...result }, { status: result.found ? 200 : 404, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'forbidden_origin' }, { status: 403, headers: NO_STORE });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400, headers: NO_STORE });
    }
    const res = await requestVisitorCertificate(body);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: res.status, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, certificate: res.certificate }, { status: 201, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}
