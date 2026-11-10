import { isSameOrigin } from '../../../lib/portal-auth';
import { getDonorWorkspace, updateDonorNotificationsAndDispatch } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedDonor } from '../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const donor = await requireAuthenticatedDonor(request);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    return jsonNoStore(
      { ok: true, notifications: donor.notifications, dispatchLog: donor.dispatchLog || [] },
      200
    );
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}

export async function PUT(request) {
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
    const res = await updateDonorNotificationsAndDispatch(donor.id, body);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    return jsonNoStore({ ok: true, notifications: res.notifications }, 200);
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
    const res = await updateDonorNotificationsAndDispatch(donor.id, {
      action: 'test_dispatch',
      channel: body.channel,
    });
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const refreshed = await getDonorWorkspace(donor.id);
    return jsonNoStore(
      { ok: true, delivery: res.delivery, logEntry: res.logEntry, dispatchLog: res.dispatchLog, donor: refreshed },
      200
    );
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
