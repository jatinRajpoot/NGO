import {
  DONOR_COOKIE_NAME,
  PORTAL_SESSION_MAX_AGE,
  createPortalSessionToken,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
} from '../../../lib/portal-auth';
import { changeDonorPassword } from '../../../lib/portal-store';
import { jsonNoStore, requireAuthenticatedDonor } from '../../../lib/donor-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const res = await changeDonorPassword(donor.id, body.currentPassword, body.newPassword);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }

    const token = createPortalSessionToken('donor', donor.id, res.tokenVersion);
    const response = jsonNoStore({ ok: true, message: 'Password updated on server.' }, 200);
    response.cookies.set({
      name: DONOR_COOKIE_NAME,
      value: token,
      ...portalCookieOptions(isHttpsRequest(request)),
      maxAge: PORTAL_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return jsonNoStore({ ok: false, error: 'internal_error' }, 500);
  }
}
