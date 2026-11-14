import {
  DONOR_COOKIE_NAME,
  PORTAL_SESSION_MAX_AGE,
  createPortalSessionToken,
  isHttpsRequest,
  isSameOrigin,
  portalCookieOptions,
} from '../../../lib/portal-auth';
import { authenticateDonorAccount, getDonorWorkspace } from '../../../lib/portal-store';
import { jsonNoStore } from '../../../lib/donor-session';

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
        : typeof body?.donorId === 'string'
        ? body.donorId
        : typeof body?.phone === 'string'
        ? body.phone
        : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!identifier.trim() || !password) {
      return jsonNoStore({ ok: false, error: 'Email/Donor ID and password are required.' }, 400);
    }

    const donor = await authenticateDonorAccount(identifier, password);
    if (!donor) {
      return jsonNoStore({ ok: false, error: 'Invalid Donor ID, email, or password.' }, 401);
    }

    const workspace = await getDonorWorkspace(donor.id);
    const token = createPortalSessionToken('donor', donor.id, donor.tokenVersion || 1);
    const response = jsonNoStore({ ok: true, donor: workspace || donor }, 200);
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
