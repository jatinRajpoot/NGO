import {
  MEMBER_COOKIE_NAME,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
  revokePortalSessionFromRequest,
} from '../../../lib/portal-auth';
import { jsonNoStore } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
    }
    await revokePortalSessionFromRequest(request, 'member');
    const response = jsonNoStore({ ok: true }, 200);
    response.cookies.set({
      name: MEMBER_COOKIE_NAME,
      value: '',
      ...portalCookieOptions(isHttpsRequest(request)),
      maxAge: 0,
    });
    return response;
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
