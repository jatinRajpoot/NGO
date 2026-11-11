import { csvResponse, jsonResponse, requireAdminApi } from '../../../../lib/finance-api';
import {
  createFinanceDonation,
  deleteFinanceDonations,
  listFinanceDonations,
  toCsv,
  updateFinanceDonation,
} from '../../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const donations = await listFinanceDonations({
    source: url.searchParams.get('source') || 'all',
    status: url.searchParams.get('status') || 'all',
    preset: url.searchParams.get('preset') || 'all',
    from: url.searchParams.get('from') || '',
    to: url.searchParams.get('to') || '',
    search: url.searchParams.get('search') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Receipt No', 'Source', 'Donor Name', 'Email', 'Phone', 'PAN', 'Amount (INR)', 'Purpose', 'Method', 'Status', 'UTR / Ref', 'Date'],
      donations.map((d) => [
        d.receiptNo,
        d.source,
        d.donorName,
        d.email,
        d.phone,
        d.pan,
        d.amount,
        d.purpose,
        d.method,
        d.status,
        d.utr,
        String(d.createdAt || '').slice(0, 10),
      ])
    );
    return csvResponse(csv, 'gsdd-donations-report.csv');
  }

  return jsonResponse({ ok: true, donations }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createFinanceDonation(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, donation: res.donation }, 201);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateFinanceDonation(String(body.id || ''), body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, donation: res.donation }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteFinanceDonations(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
