import { requireAdminApi, jsonResponse } from '../../../lib/admin-system-api';
import { listBirthdays, sendBirthdayWish } from '../../../lib/admin-system-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  try {
    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'upcoming';
    const birthdays = await listBirthdays({ tab });
    return jsonResponse({ ok: true, birthdays }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load birthdays.' }, 500);
  }
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    const res = await sendBirthdayWish({ id: body.id, message: body.message });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, record: res.record }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to send birthday wish.' }, 500);
  }
}
