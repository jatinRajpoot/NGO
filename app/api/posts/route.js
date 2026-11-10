import { listPosts } from '../../lib/posts-store';
import { jsonResponse } from '../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const posts = await listPosts({ filter });
    return jsonResponse({ ok: true, posts }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load activity posts.' }, 500);
  }
}
