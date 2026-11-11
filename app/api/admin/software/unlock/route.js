import { NextResponse } from 'next/server';
import { cookieOptions } from '../../../../lib/admin-auth';
import { NO_STORE, jsonResponse, requireAdminApi } from '../../../../lib/admin-system-api';
import {
  createPanelUnlockCookieValue,
  getPanelPasswordStatus,
  isPanelUnlocked,
  setupOrChangePanelPassword,
  verifyPanelPassword,
} from '../../../../lib/admin-system-store';
import { PANEL_UNLOCK_COOKIE, PANEL_UNLOCK_TTL_SECONDS } from '../../../../lib/panel-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const status = await getPanelPasswordStatus();
  const unlocked = await isPanelUnlocked(request);
  return jsonResponse({ ok: true, unlocked, configured: status.configured, source: status.source }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  if (body.action === 'setup' || body.action === 'change') {
    const res = await setupOrChangePanelPassword({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  } else {
    const valid = await verifyPanelPassword(body.panelPassword || body.password || '');
    if (!valid) {
      return jsonResponse({ ok: false, error: 'Invalid Software Panel Password.' }, 403);
    }
  }

  const token = await createPanelUnlockCookieValue();
  if (!token) {
    return jsonResponse({ ok: false, error: 'Signing secret is not configured.' }, 503);
  }

  const res = NextResponse.json({ ok: true, unlocked: true }, { status: 200, headers: NO_STORE });
  const baseCookie = cookieOptions(request);
  res.cookies.set(PANEL_UNLOCK_COOKIE, token, {
    ...baseCookie,
    maxAge: PANEL_UNLOCK_TTL_SECONDS,
    expires: new Date(Date.now() + PANEL_UNLOCK_TTL_SECONDS * 1000),
  });
  return res;
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const res = NextResponse.json({ ok: true, unlocked: false }, { status: 200, headers: NO_STORE });
  const baseCookie = cookieOptions(request);
  res.cookies.set(PANEL_UNLOCK_COOKIE, '', {
    ...baseCookie,
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}
