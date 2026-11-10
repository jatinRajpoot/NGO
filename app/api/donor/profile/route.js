import { isSameOrigin } from '../../../lib/portal-auth';
import { updateDonorProfile } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedDonor } from '../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    const donor = await requireAuthenticatedDonor(request);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonNoStore({ ok: false, error: 'invalid_json' }, 400);
    }
    const res = await updateDonorProfile(donor.id, body);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    return jsonNoStore({ ok: true, donor: res.donor }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
