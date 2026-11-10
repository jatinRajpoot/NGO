import { jsonNoStore, requireAuthenticatedMember } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const member = await requireAuthenticatedMember(request);
    if (!member) {
      return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);
    }
    return jsonNoStore({ ok: true, member }, 200);
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
