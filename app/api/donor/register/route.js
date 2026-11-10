import {
  DONOR_COOKIE_NAME,
  PORTAL_SESSION_MAX_AGE,
  createPortalSessionToken,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
} from '../../../lib/portal-auth';
import { registerDonorAccount } from '../../../lib/portal-store';
import { jsonNoStore } from '../../../lib/donor-session';

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
    const res = await registerDonorAccount(body);
    if (!res.ok) {
      return jsonNoStore({ ok: false, error: res.error }, res.status);
    }
    const token = createPortalSessionToken('donor', res.donor.id, res.donor.tokenVersion || 1);
    const response = jsonNoStore({ ok: true, donor: res.donor }, 201);
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
