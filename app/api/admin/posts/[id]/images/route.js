import { requireAdminSession } from '../../../../../lib/admin-auth';
import { getPostById } from '../../../../../lib/posts-store';
import { jsonResponse } from '../../../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) return jsonResponse({ ok: false, error: 'Post not found.' }, 404);
  return jsonResponse({ ok: true, title: post.title, images: post.images || [] }, 200);
}
