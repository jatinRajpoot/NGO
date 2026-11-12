import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/support-api';
import { createBeneficiary, listBeneficiaries } from '../../../lib/support-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const beneficiaries = await listBeneficiaries({
    search: url.searchParams.get('q') || '',
    publicOnly: true,
  });
  return jsonResponse({ ok: true, beneficiaries }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createBeneficiary(body, { isDirectPublicRequest: true });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse(
    {
      ok: true,
      request: {
        trackingCode: res.beneficiary.trackingCode,
        name: res.beneficiary.name,
        category: res.beneficiary.category,
        status: res.beneficiary.status,
      },
    },
    201
  );
}
