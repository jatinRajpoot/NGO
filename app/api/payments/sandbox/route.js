import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/finance-api';
import { createGatewaySession } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    }
    const res = await createGatewaySession(body);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, session: res.session }, 201);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to initialize payment gateway session.' }, 500);
  }
}
