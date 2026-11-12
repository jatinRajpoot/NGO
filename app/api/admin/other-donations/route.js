import { csvResponse, jsonResponse, requireAdminApi } from '../../../lib/finance-api';
import {
  createOtherDonation,
  deleteOtherDonations,
  listOtherDonations,
  toCsv,
} from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const donations = await listOtherDonations({
    preset: url.searchParams.get('preset') || 'all',
    from: url.searchParams.get('from') || '',
    to: url.searchParams.get('to') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Donation No', 'Donor Name', 'Email', 'Category', 'Items', 'Condition', 'Received By', 'Date'],
      donations.map((d) => [
        d.donationNo,
        d.donorName,
        d.email,
        d.category,
        (d.items || []).map((i) => `${i.itemName} (${i.quantity} ${i.unit})`).join('; '),
        d.condition,
        d.receivedBy,
        d.date,
      ])
    );
    return csvResponse(csv, 'gsdd-other-donations.csv');
  }

  return jsonResponse({ ok: true, donations }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createOtherDonation(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, donation: res.donation }, 201);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteOtherDonations(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
