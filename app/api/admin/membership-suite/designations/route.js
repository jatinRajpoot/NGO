import { csvResponse, jsonResponse, requireAdminApi } from '../../../../lib/membership-suite-api';
import {
  deleteDesignations,
  listDesignations,
  toCsv,
  upsertDesignation,
} from '../../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const designations = await listDesignations({ status: url.searchParams.get('status') || 'all' });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Title', 'Fee (Rs.)', 'Validity (Years)', 'Renewal Fee (Rs.)', 'Status', 'Benefits'],
      designations.map((d) => [d.title, d.feeRs, d.validityYears, d.renewalFeeRs, Number(d.status) === 1 ? 'Active' : 'Inactive', d.benefitsSummary])
    );
    return csvResponse(csv, 'gsdd-designations.csv');
  }

  return jsonResponse({ ok: true, designations }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await upsertDesignation(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, designation: res.designation }, res.status);
}

export async function PATCH(request) {
  return POST(request);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteDesignations(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
