import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../lib/portal-auth';
import { createPendingDonation, lookupDonationStatus } from '../../lib/portal-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('trackingId') || url.searchParams.get('receiptNo') || '';
    if (!code.trim()) {
      return NextResponse.json({ ok: false, error: 'trackingId or receiptNo is required' }, { status: 400, headers: NO_STORE });
    }
    const donation = await lookupDonationStatus(code);
    if (!donation) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, donation }, { status: 200, headers: NO_STORE });
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
    const res = await createPendingDonation({
      source: 'visitor',
      donorName: body.donorName,
      email: body.email,
      phone: body.phone,
      pan: body.pan,
      amount: body.amount,
      frequency: body.frequency,
      purpose: body.purpose,
      method: body.method,
      utr: body.utr,
      cashNote: body.cashNote,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: res.status, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, donation: res.donation }, { status: 201, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: NO_STORE });
  }
}
