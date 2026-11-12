import { getAuthenticatedCoordinator, jsonResponse } from '../../../lib/finance-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const coord = await getAuthenticatedCoordinator(request);
  if (!coord) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  return jsonResponse({ ok: true, coordinator: coord }, 200);
}
