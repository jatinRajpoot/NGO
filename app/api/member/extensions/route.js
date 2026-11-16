import { isSameOrigin } from '../../../lib/portal-auth';
import { jsonNoStore, requireAuthenticatedMember } from '../../../lib/member-session';
import { updateMemberProfile } from '../../../lib/portal-store';
import {
  getMemberExtensionsSnapshot,
  saveMemberPhoto,
} from '../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const member = await requireAuthenticatedMember(request);
  if (!member) return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);

  const snapshot = await getMemberExtensionsSnapshot(member);
  return jsonNoStore({ ok: true, ...snapshot }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonNoStore({ ok: false, error: 'forbidden_origin' }, 403);
  const member = await requireAuthenticatedMember(request);
  if (!member) return jsonNoStore({ ok: false, error: 'unauthorized' }, 401);

  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  if (ctype.includes('multipart/form-data')) {
    const fd = await request.formData();
    const entry = fd.get('photo');
    if (!entry || typeof entry !== 'object' || typeof entry.arrayBuffer !== 'function') {
      return jsonNoStore({ ok: false, error: 'Select a valid image file.' }, 400);
    }
    const saved = await saveMemberPhoto({
      buffer: Buffer.from(await entry.arrayBuffer()),
      filename: entry.name || 'avatar.png',
      contentType: entry.type || '',
    });
    if (!saved.ok) return jsonNoStore({ ok: false, error: saved.error }, 400);
    await updateMemberProfile(member.id, { photoSrc: saved.src });
    return jsonNoStore({ ok: true, photoSrc: saved.src }, 200);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonNoStore({ ok: false, error: 'invalid_json' }, 400);

  if (body.action === 'gateway_donate') {
    const gateway = String(body.gateway || 'phonepe').toLowerCase();
    if (gateway === 'phonepe' && (String(body.username) !== 'test' || String(body.password) !== 'test')) {
      return jsonNoStore({
        ok: false,
        error: 'PhonePe Net Banking sandbox requires username "test" and password "test".',
      }, 401);
    }
    return jsonNoStore({ ok: true, isSandbox: true, status: 'Simulated', message: 'Simulation complete. No payment was collected or recorded.' }, 200);
  }

  return jsonNoStore({ ok: false, error: 'Unknown action.' }, 400);
}
