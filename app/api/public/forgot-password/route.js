import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/membership-suite-api';
import { requestMemberPasswordReset, confirmMemberPasswordReset } from '../../../lib/member-recovery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  const result = body.step === 'request'
    ? await requestMemberPasswordReset(body.email)
    : await confirmMemberPasswordReset({ token: body.token, newPassword: body.newPassword });
  return jsonResponse(result, result.status);
}
