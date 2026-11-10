import { isSameOrigin } from '../../../../../lib/portal-auth';
import { getDonorWorkspace, updateDonorSubscriptionStatus } from '../../../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedDonor } from '../../../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    const donor = await requireAuthenticatedDonor(request);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    const params = await context.params;
    const subId = params?.id;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonNoStore({ ok: false, error: 'invalid_json' }, 400);
    }
    const res = await updateDonorSubscriptionStatus(donor.id, subId, body);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const refreshed = await getDonorWorkspace(donor.id);
    return jsonNoStore({ ok: true, subscription: res.subscription, donor: refreshed }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
