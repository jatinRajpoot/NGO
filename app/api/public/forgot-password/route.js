import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/membership-suite-api';
import { resetMemberPasswordByEmailAndPhone } from '../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  if (body.step === 'request') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return jsonResponse({ ok: false, error: 'Valid account email is required.' }, 400);
    }
    return jsonResponse(
      {
        ok: true,
        message: 'If an account matches this email, enter your registered mobile number and new password below to complete reset.',
      },
      200
    );
  }

  const res = await resetMemberPasswordByEmailAndPhone({
    email: body.email,
    phone: body.phone,
    newPassword: body.newPassword,
  });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, message: 'Password has been reset successfully. You may now sign in.' }, 200);
}
