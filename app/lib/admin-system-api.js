import { NextResponse } from 'next/server';
import { isSameOrigin, requireAdminSession } from './admin-auth';
import { isPanelUnlocked } from './admin-system-store';

export const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
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

export async function requireUnlockedPanelApi(request, { checkOrigin = false } = {}) {
  const authError = await requireAdminApi(request, { checkOrigin });
  if (authError) return authError;

  const unlocked = await isPanelUnlocked(request);
  if (!unlocked) {
    return jsonResponse(
      { ok: false, error: 'panel_password_required', message: 'Panel password verification required.' },
      403
    );
  }
  return null;
}
