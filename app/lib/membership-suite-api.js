import { NextResponse } from 'next/server';
import { isSameOrigin, requireAdminSession } from './admin-auth';

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
