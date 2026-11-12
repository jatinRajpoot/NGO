import { isSameOrigin, requireAdminSession } from '../../../lib/admin-auth';
import {
  createNewsItem,
  deleteNewsItems,
  listNews,
  updateNewsItem,
} from '../../../lib/posts-store';
import { fileEntryToDescriptor, jsonResponse } from '../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const news = await listNews({ type });
    return jsonResponse({ ok: true, news }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load news.' }, 500);
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const ctype = (request.headers.get('content-type') || '').toLowerCase();
    let title = '';
    let description = '';
    let status = 'active';
    let imageFile = null;

    if (ctype.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = String(formData.get('title') || '');
      description = String(formData.get('description') || '');
      status = String(formData.get('status') || 'active');
      const file = formData.get('image') || formData.get('file');
      if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
        const desc = await fileEntryToDescriptor(file);
        if (desc?.error) return jsonResponse({ ok: false, error: desc.error }, 400);
        imageFile = desc;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
      title = body.title;
      description = body.description;
      status = body.status || 'active';
    }

    const res = await createNewsItem({ title, description, status, imageFile });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, news: res.news }, 201);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to create news item.' }, 500);
  }
}

export async function PATCH(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const ctype = (request.headers.get('content-type') || '').toLowerCase();
    let id = '';
    let title;
    let description;
    let status;
    let removeImage = false;
    let imageFile = null;

    if (ctype.includes('multipart/form-data')) {
      const formData = await request.formData();
      id = String(formData.get('id') || '');
      title = formData.has('title') ? String(formData.get('title') || '') : undefined;
      description = formData.has('description') ? String(formData.get('description') || '') : undefined;
      status = formData.has('status') ? String(formData.get('status') || '') : undefined;
      removeImage = formData.get('removeImage') === 'true';
      const file = formData.get('image') || formData.get('file');
      if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
        const desc = await fileEntryToDescriptor(file);
        if (desc?.error) return jsonResponse({ ok: false, error: desc.error }, 400);
        imageFile = desc;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
      id = String(body.id || '');
      title = body.title;
      description = body.description;
      status = body.status;
      removeImage = Boolean(body.removeImage);
    }

    if (!id) return jsonResponse({ ok: false, error: 'News ID is required.' }, 400);
    const res = await updateNewsItem(id, { title, description, status, removeImage, imageFile });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, news: res.news }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to update news item.' }, 500);
  }
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];
    const res = await deleteNewsItems(ids);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to delete news item.' }, 500);
  }
}
