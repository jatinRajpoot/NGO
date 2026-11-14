import {
  MEMBER_COOKIE_NAME,
  PORTAL_SESSION_MAX_AGE,
  createPortalSessionToken,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
} from '../../../lib/portal-auth';
import { authenticateMemberAccount, getMemberWorkspace } from '../../../lib/portal-store';
import { jsonNoStore } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    const body = await request.json().catch(() => null);
    const identifier =
      typeof body?.identifier === 'string'
        ? body.identifier
        : typeof body?.email === 'string'
        ? body.email
        : typeof body?.phone === 'string'
        ? body.phone
        : typeof body?.username === 'string'
        ? body.username
        : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!identifier.trim() || !password) {
      return jsonNoStore({ ok: false, error: 'Email/mobile and password are required.' }, 400);
    }

    const member = await authenticateMemberAccount(identifier, password);
    if (!member) {
      return jsonNoStore({ ok: false, error: 'Invalid email/mobile or password.' }, 401);
    }

    const workspace = await getMemberWorkspace(member.id);
    const token = createPortalSessionToken('member', member.id, member.tokenVersion || 1);
    const response = jsonNoStore({ ok: true, member: workspace || member }, 200);
    response.cookies.set({
      name: MEMBER_COOKIE_NAME,
      value: token,
      ...portalCookieOptions(isHttpsRequest(request)),
      maxAge: PORTAL_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
