import { jsonResponse, requireAdminApi } from '../../../lib/finance-api';
import {
  createCampaign,
  deleteCampaigns,
  listCampaigns,
  listFinanceDonations,
  updateCampaign,
} from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  if (tab === 'received-donations') {
    const all = await listFinanceDonations({ source: 'all', status: 'all' });
    const campaignDonations = all.filter((d) => d.campaignId || d.source === 'campaign');
    return jsonResponse({ ok: true, donations: campaignDonations }, 200);
  }
  const campaigns = await listCampaigns({ tab });
  return jsonResponse({ ok: true, campaigns }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createCampaign(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, campaign: res.campaign }, 201);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateCampaign(String(body.id || ''), body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, campaign: res.campaign }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteCampaigns(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
