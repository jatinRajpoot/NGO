import { isSameOrigin } from '../../../lib/portal-auth';
import { createPendingDonation, getMemberWorkspace } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedMember } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const member = await requireAuthenticatedMember(request);
    if (!member) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    return jsonNoStore({ ok: true, donations: member.donations || [] }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    const member = await requireAuthenticatedMember(request);
    if (!member) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonNoStore({ ok: false, error: 'invalid_json' }, 400);
    }
    const res = await createPendingDonation({
      source: 'member',
      memberId: member.id,
      donorName: member.name,
      email: member.email,
      phone: member.phone,
      pan: body.pan || '',
      amount: body.amount,
      frequency: 'one-time',
      program: body.program,
      method: body.method || 'UPI',
      utr: body.utr,
    });
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const refreshed = await getMemberWorkspace(member.id);
    return jsonNoStore({ ok: true, donation: res.donation, member: refreshed }, 201);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
