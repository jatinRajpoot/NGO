import { NextResponse } from 'next/server';
import { isSameOrigin, requireAdminSession } from './admin-auth';
import { COORDINATOR_COOKIE_NAME, createPortalSessionToken, getPortalSessionFromRequest, isHttpsRequest, portalCookieOptions, PORTAL_SESSION_MAX_AGE } from './portal-auth';
import { getCoordinatorById } from './finance-store';

export const COORDINATOR_COOKIE = COORDINATOR_COOKIE_NAME;
export const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function csvResponse(csvText, filename) {
  return new Response(csvText, {
    status: 200,
    headers: {
      ...NO_STORE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function requireAdminApi(request, { checkOrigin = false } = {}) {
  if (checkOrigin && !isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const authed = await requireAdminSession(request);
  if (!authed) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
}

export async function getAuthenticatedCoordinator(request) {
  const session = await getPortalSessionFromRequest(request, 'coordinator');
  if (!session) return null;
  const coordinator = await getCoordinatorById(session.subjectId);
  if (coordinator?.status !== 'Active' || (coordinator.tokenVersion || 1) !== session.tokenVersion) return null;
  return coordinator;
}

export function setCoordinatorCookie(response, request, coordinator) {
  const token = createPortalSessionToken('coordinator', coordinator.id, coordinator.tokenVersion || 1);
  response.cookies.set(COORDINATOR_COOKIE, token, { ...portalCookieOptions(isHttpsRequest(request)), maxAge: PORTAL_SESSION_MAX_AGE });
}
