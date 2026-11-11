import { csvResponse, jsonResponse, requireAdminApi } from '../../../lib/finance-api';
import {
  deleteCoordinatorDonations,
  listCoordinatorDonations,
  toCsv,
  updateCoordinatorDonationStatus,
} from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const donations = await listCoordinatorDonations({
    coordinatorId: url.searchParams.get('coordinatorId') || 'all',
    method: url.searchParams.get('method') || 'all',
    status: url.searchParams.get('status') || 'all',
    preset: url.searchParams.get('preset') || 'all',
    from: url.searchParams.get('from') || '',
    to: url.searchParams.get('to') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Receipt No', 'Coordinator', 'Donor Name', 'Phone', 'Amount', 'Method', 'Purpose', 'Proof Ref', 'Status', 'Date'],
      donations.map((d) => [
        d.receiptNo,
        d.coordinatorName,
        d.donorName,
        d.donorPhone,
        d.amount,
        d.method,
        d.purpose,
        d.proofRef,
        d.status,
        String(d.createdAt || '').slice(0, 10),
      ])
    );
    return csvResponse(csv, 'gsdd-coordinator-donations.csv');
  }

  return jsonResponse({ ok: true, donations }, 200);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateCoordinatorDonationStatus(String(body.id || ''), {
    status: body.status,
    rejectionReason: body.rejectionReason,
  });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, donation: res.donation }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteCoordinatorDonations(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
