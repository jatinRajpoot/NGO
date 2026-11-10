import { isSameOrigin, requireAdminSession } from '../../../../lib/admin-auth';
import { deletePost, getPostById, updatePost } from '../../../../lib/posts-store';
import { jsonResponse, parseMultipartFiles } from '../../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) return jsonResponse({ ok: false, error: 'Post not found.' }, 404);
  return jsonResponse({ ok: true, post }, 200);
}

export async function PATCH(request, context) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const { id } = await context.params;
    const ctype = (request.headers.get('content-type') || '').toLowerCase();
    let type = '';
    let title = '';
    let descriptionHtml = '';
    let deletedImageIds = [];
    let newImageFiles = [];

    if (ctype.includes('multipart/form-data')) {
      const formData = await request.formData();
      type = String(formData.get('type') || '');
      title = String(formData.get('title') || '');
      descriptionHtml = String(formData.get('descriptionHtml') || formData.get('description') || '');
      const rawDeleted = formData.get('deletedImageIds');
      if (typeof rawDeleted === 'string' && rawDeleted.trim()) {
        try {
          deletedImageIds = JSON.parse(rawDeleted);
        } catch {
          deletedImageIds = [];
        }
      }
      const parsed = await parseMultipartFiles(formData, ['images', 'images[]']);
      if (!parsed.ok) return jsonResponse({ ok: false, error: parsed.error }, 400);
      newImageFiles = parsed.files;
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
      type = body.type;
      title = body.title;
      descriptionHtml = body.descriptionHtml ?? body.description;
      deletedImageIds = Array.isArray(body.deletedImageIds) ? body.deletedImageIds : [];
    }

    const res = await updatePost(id, { type, title, descriptionHtml, deletedImageIds, newImageFiles });
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, post: res.post }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to update post.' }, 500);
  }
}

export async function DELETE(request, context) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const { id } = await context.params;
    const res = await deletePost(id);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, deletedId: res.deletedId }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to delete post.' }, 500);
  }
}
