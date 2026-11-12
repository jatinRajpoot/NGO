import { isSameOrigin, requireAdminSession } from '../../../lib/admin-auth';
import { createPost, listPosts } from '../../../lib/posts-store';
import { jsonResponse, parseMultipartFiles } from '../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const posts = await listPosts({ filter });
    return jsonResponse({ ok: true, posts }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load posts.' }, 500);
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const ctype = (request.headers.get('content-type') || '').toLowerCase();
    let type = '';
    let title = '';
    let descriptionHtml = '';
    let imageFiles = [];

    if (ctype.includes('multipart/form-data')) {
      const formData = await request.formData();
      type = String(formData.get('type') || '');
      title = String(formData.get('title') || '');
      descriptionHtml = String(formData.get('descriptionHtml') || formData.get('description') || '');
      const parsed = await parseMultipartFiles(formData, ['images', 'images[]']);
      if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, 400);
      imageFiles = parsed.files;
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
      type = body.type;
      title = body.title;
      descriptionHtml = body.descriptionHtml ?? body.description;
    }

    const res = await createPost({ type, title, descriptionHtml, imageFiles });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, post: res.post }, 201);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to create post.' }, 500);
  }
}
