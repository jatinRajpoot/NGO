import { csvResponse, jsonResponse, requireAdminApi } from '../../../../lib/support-api';
import {
  createBeneficiary,
  deleteBeneficiaries,
  listBeneficiaries,
  toCsv,
  updateBeneficiary,
} from '../../../../lib/support-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const beneficiaries = await listBeneficiaries({
    tab: url.searchParams.get('tab') || 'all',
    search: url.searchParams.get('search') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Tracking Code', 'Name', 'Category', 'District', 'State', 'Phone', 'Status', 'Benefits Provided'],
      beneficiaries.map((b) => [
        b.trackingCode,
        b.name,
        b.category,
        b.district,
        b.state,
        b.phone,
        b.status,
        (b.benefits || []).map((bf) => `${bf.benefitTitle} (${bf.date})`).join('; '),
      ])
    );
    return csvResponse(csv, 'gsdd-beneficiaries-benefits.csv');
  }

  return jsonResponse({ ok: true, beneficiaries }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createBeneficiary(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, beneficiary: res.beneficiary }, 201);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateBeneficiary(String(body.id || ''), body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, beneficiary: res.beneficiary }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteBeneficiaries(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
