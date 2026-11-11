import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookieOptions, isSameOrigin, requireAdminSession } from './admin-auth';
import { getCoordinatorById } from './finance-store';

export const COORDINATOR_COOKIE = 'gsdd_coordinator_session';

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

function getCoordSecret() {
  const s = process.env.ADMIN_SESSION_SECRET || '';
  return s.trim().length >= 16 ? s.trim() : null;
}

export function signCoordinatorSession(coordId) {
  const secret = getCoordSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + 28800;
  const payload = `c1.${exp}.${coordId}`;
  const sig = createHmac('sha256', `coord:${secret}`).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export async function getAuthenticatedCoordinator(request) {
  const secret = getCoordSecret();
  if (!secret) return null;
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COORDINATOR_COOKIE}=([^;]+)`));
  const token = m ? decodeURIComponent(m[1]) : '';
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'c1') return null;

  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null;

  const payload = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const expectedSig = createHmac('sha256', `coord:${secret}`).update(payload).digest('base64url');
  const a = Buffer.from(parts[3]);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return getCoordinatorById(parts[2]);
}

export function setCoordinatorCookie(response, request, coordId) {
  const token = signCoordinatorSession(coordId);
  if (!token) return false;
  response.cookies.set(COORDINATOR_COOKIE, token, cookieOptions(request));
  return true;
}
