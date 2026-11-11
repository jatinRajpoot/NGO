import { requireAdminApi, jsonResponse } from '../../../lib/admin-system-api';
import { getAdminOverviewData } from '../../../lib/admin-system-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  try {
    const overview = await getAdminOverviewData();
    return jsonResponse({ ok: true, overview }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load dashboard overview.' }, 500);
  }
}
