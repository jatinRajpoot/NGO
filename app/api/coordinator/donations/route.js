import { isSameOrigin } from '../../../lib/admin-auth';
import { getAuthenticatedCoordinator, jsonResponse } from '../../../lib/finance-api';
import { createCoordinatorDonation, listCoordinatorDonations } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const coord = await getAuthenticatedCoordinator(request);
  if (!coord) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  const donations = await listCoordinatorDonations({ coordinatorId: coord.id });
  return jsonResponse({ ok: true, donations }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const coord = await getAuthenticatedCoordinator(request);
  if (!coord) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createCoordinatorDonation({
    ...body,
    coordinatorId: coord.id,
    coordinatorName: coord.name,
    status: 'Pending',
  });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, donation: res.donation }, 201);
}
