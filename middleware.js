import { NextResponse } from 'next/server';
import { PANEL_UNLOCK_COOKIE, verifyPanelUnlockToken } from './app/lib/panel-token';

export const config = {
  matcher: ['/admin/software/:path*'],
};

export async function middleware(request) {
  const secret =
    typeof process.env.ADMIN_SESSION_SECRET === 'string'
      ? process.env.ADMIN_SESSION_SECRET.trim()
      : '';
  const token = request.cookies.get(PANEL_UNLOCK_COOKIE)?.value || '';
  const valid =
    secret.length >= 16 && token ? await verifyPanelUnlockToken(token, secret) : false;

  if (!valid) {
    return new NextResponse(
      [
        '<!DOCTYPE html>',
        '<html lang="en"><head><meta charset="utf-8" />',
        '<meta name="robots" content="noindex,nofollow" />',
        '<title>403 Forbidden — Panel Password Required</title></head>',
        '<body style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:64px auto;padding:24px;color:#0f172a;line-height:1.6;">',
        '<h1 style="margin:0 0 12px;font-size:24px;">403 Forbidden</h1>',
        '<p>Direct access to Software Update configuration routes requires verifying the separate Panel Password inside the Admin Dashboard.</p>',
        '<p><a href="/admin/" style="color:#2563eb;font-weight:600;">Return to Admin Dashboard</a></p>',
        '</body></html>',
      ].join(''),
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  return NextResponse.next();
}
