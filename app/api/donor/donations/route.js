import { isSameOrigin } from '../../../lib/portal-auth';
import { createPendingDonation, getDonorWorkspace } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedDonor } from '../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const donor = await requireAuthenticatedDonor(request);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    return jsonNoStore({ ok: true, donations: donor.donations || [] }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}

export async function POST(request) {
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
    const res = await createPendingDonation({
      source: 'donor',
      donorId: donor.id,
      donorName: donor.name,
      email: donor.email,
      phone: donor.phone,
      pan: donor.pan || '',
      amount: body.amount,
      frequency: body.frequency || 'one-time',
      program: body.program,
      method: body.method || 'UPI',
      utr: body.utr,
      cashNote: body.cashNote,
    });
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const refreshed = await getDonorWorkspace(donor.id);
    return jsonNoStore({ ok: true, donation: res.donation, donor: refreshed }, 201);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
