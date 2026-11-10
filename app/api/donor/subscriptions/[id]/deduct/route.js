import { isSameOrigin } from '../../../../../lib/portal-auth';
import { getDonorWorkspace, processSubscriptionCycleDeduction } from '../../../../../lib/portal-store';
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
    const idempotencyKey = body?.idempotencyKey;

    const res = await processSubscriptionCycleDeduction(donor.id, subId, idempotencyKey);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const refreshed = await getDonorWorkspace(donor.id);
    return jsonNoStore(
      {
        ok: true,
        idempotentReplay: res.idempotentReplay,
        cycle: res.cycle,
        subscription: res.subscription,
        donor: refreshed,
      },
      res.status
    );
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
