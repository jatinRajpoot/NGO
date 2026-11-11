import { jsonResponse } from '../../../lib/operations-api';
import { listProjects } from '../../../lib/operations-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const projects = await listProjects({
    tab: url.searchParams.get('tab') || 'all',
    category: url.searchParams.get('category') || 'all',
  });
  return jsonResponse({ ok: true, projects }, 200);
}
