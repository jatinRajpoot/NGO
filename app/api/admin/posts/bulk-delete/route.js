import { isSameOrigin, requireAdminSession } from '../../../../lib/admin-auth';
import { bulkDeletePosts } from '../../../../lib/posts-store';
import { jsonResponse } from '../../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const authed = await requireAdminSession(request);
  if (!authed) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    const res = await bulkDeletePosts(body.ids);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, deletedCount: res.deletedCount, deletedIds: res.deletedIds }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to delete selected posts.' }, 500);
  }
}
