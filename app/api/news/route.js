import { listNews } from '../../lib/posts-store';
import { jsonResponse } from '../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const news = await listNews({ type: 'active' });
    return jsonResponse({ ok: true, news }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load published news.' }, 500);
  }
}
