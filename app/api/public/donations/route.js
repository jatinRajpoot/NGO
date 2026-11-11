import { jsonResponse } from '../../../lib/finance-api';
import { searchPublicDonations } from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const donations = await searchPublicDonations(q);
  return jsonResponse({ ok: true, donations }, 200);
}
