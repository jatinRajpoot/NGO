import { getSoftwareSettings } from '../../../lib/admin-system-store';
import {
  MEMBER_COOKIE_NAME,
  PORTAL_SESSION_MAX_AGE,
  createPortalSessionToken,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
} from '../../../lib/portal-auth';
import { registerMemberAccount } from '../../../lib/portal-store';
import { jsonNoStore } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonNoStore({ ok: false, error: 'invalid_json' }, 400);
    }
    const access = await getSoftwareSettings('access-settings') || {};
    if (access.allowPublicRegistration === false) {
      return jsonNoStore({ ok: false, error: 'Online membership registration is currently closed.' }, 403);
    }
    const res = await registerMemberAccount(body, { requireApproval: access.requireAdminApproval !== false });
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }

    if (res.member.status !== 'Active') return jsonNoStore({ ok: true, member: res.member }, 201);
    const token = createPortalSessionToken('member', res.member.id, res.member.tokenVersion || 1);
    const response = jsonNoStore({ ok: true, member: res.member }, 201);
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
