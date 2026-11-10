import { jsonNoStore, requireAuthenticatedDonor } from '../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const donor = await requireAuthenticatedDonor(request);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    return jsonNoStore({ ok: true, donor }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
