import { NO_STORE, jsonResponse, requireAdminApi } from '../../../../lib/admin-system-api';
import {
  ADMIN_PHOTO_MAX_BYTES,
  readAdminPhoto,
  removeAdminPhoto,
  saveAdminPhoto,
} from '../../../../lib/admin-system-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const file = url.searchParams.get('file') || '';
  const data = await readAdminPhoto(file);
  if (!data) {
    return new Response(null, { status: 404, headers: NO_STORE });
  }
  return new Response(data.buffer, {
    status: 200,
    headers: {
      ...NO_STORE,
      'Content-Type': data.contentType,
    },
  });
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const formData = await request.formData();
    const entry = formData.get('photo') || formData.get('image') || formData.get('file');
    if (!entry || typeof entry !== 'object' || typeof entry.arrayBuffer !== 'function') {
      return jsonResponse({ ok: false, error: 'Please choose an image file to upload.' }, 400);
    }
    if (entry.size > ADMIN_PHOTO_MAX_BYTES) {
      return jsonResponse({ ok: false, error: 'Profile photo must be 2 MB or smaller.' }, 400);
    }
    const buffer = Buffer.from(await entry.arrayBuffer());
    const res = await saveAdminPhoto({
      buffer,
      filename: entry.name || 'avatar.png',
      contentType: entry.type || '',
    });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, 400);
    return jsonResponse({ ok: true, profile: res.profile }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to upload profile photo.' }, 500);
  }
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const res = await removeAdminPhoto();
    return jsonResponse({ ok: true, profile: res.profile }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to remove profile photo.' }, 500);
  }
}
