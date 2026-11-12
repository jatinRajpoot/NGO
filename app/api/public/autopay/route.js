import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/finance-api';
import { listAutoPayMandates, registerAutoPayMandate } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || url.searchParams.get('ref') || '';
  if (!query.trim()) {
    return jsonResponse({ ok: false, error: 'Provide Mandate Ref, Email, or Mobile to check AutoPay status.' }, 400);
  }
  const matches = await listAutoPayMandates({ query });
  const sanitized = matches.map((m) => ({
    mandateRef: m.mandateRef,
    donorName: m.donorName,
    amount: m.amount,
    frequency: m.frequency,
    purpose: m.purpose,
    gateway: m.gateway,
    status: m.status,
    nextDebitDate: m.nextDebitDate,
    payments: m.payments || [],
  }));
  return jsonResponse({ ok: true, mandates: sanitized }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await registerAutoPayMandate(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, mandate: res.mandate }, 201);
}
