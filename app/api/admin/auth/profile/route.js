import {
  getAdminProfile,
  isSameOrigin,
  requireAdminSession,
} from '../../../../lib/admin-auth';
import {
  getExtendedAdminProfile,
  updateExtendedAdminProfile,
} from '../../../../lib/admin-system-store';
import { jsonResponse } from '../../../../lib/admin-system-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const isAuth = await requireAdminSession(request);
  if (!isAuth) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  const baseProfile = getAdminProfile();
  if (!baseProfile) {
    return jsonResponse({ ok: false, error: 'not_configured' }, 503);
  }

  const extended = await getExtendedAdminProfile();
  return jsonResponse(
    {
      ok: true,
      profile: {
        ...extended,
        ...baseProfile,
      },
    },
    200
  );
}

export async function PATCH(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const isAuth = await requireAdminSession(request);
  if (!isAuth) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  const baseProfile = getAdminProfile();
  if (!baseProfile) {
    return jsonResponse({ ok: false, error: 'not_configured' }, 503);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const updated = await updateExtendedAdminProfile(body);
  return jsonResponse(
    {
      ok: true,
      profile: {
        ...updated,
        ...baseProfile,
      },
    },
    200
  );
}
