import { jsonResponse } from '../../../lib/finance-api';
import { listCampaigns } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  const all = await listCampaigns({ tab: tab === 'draft' ? 'all' : tab });
  // Never expose Draft campaigns publicly
  const publicList = all.filter((c) => c.status !== 'Draft');
  return jsonResponse({ ok: true, campaigns: publicList }, 200);
}
