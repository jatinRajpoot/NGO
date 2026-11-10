import { isSameOrigin } from '../../../lib/portal-auth';
import { updateMemberProfile } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedMember } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request) {
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
    const res = await updateMemberProfile(member.id, body);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    return jsonNoStore({ ok: true, member: res.member }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
