import { csvResponse, jsonResponse, requireAdminApi } from '../../../lib/finance-api';
import {
  listAutoPayMandates,
  toCsv,
  updateAutoPayMandateStatus,
} from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const mandates = await listAutoPayMandates({ query: url.searchParams.get('search') || '' });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Mandate Ref', 'Donor Name', 'Email', 'Phone', 'Monthly Amount', 'Gateway', 'Purpose', 'Status', 'Next Debit', 'Payments Count'],
      mandates.map((m) => [
        m.mandateRef,
        m.donorName,
        m.email,
        m.phone,
        m.amount,
        m.gateway,
        m.purpose,
        m.status,
        m.nextDebitDate,
        (m.payments || []).length,
      ])
    );
    return csvResponse(csv, 'gsdd-autopay-mandates.csv');
  }

  return jsonResponse({ ok: true, mandates }, 200);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateAutoPayMandateStatus(String(body.id || ''), {
    status: body.status,
  });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, mandate: res.mandate }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateAutoPayMandateStatus(String(body.id || ''), { triggerDebit: true });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, mandate: res.mandate }, 200);
}
