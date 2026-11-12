import { jsonResponse, requireAdminApi } from '../../../lib/finance-api';
import {
  createCoordinator,
  deleteCoordinators,
  listCoordinators,
  updateCoordinator,
} from '../../../lib/finance-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  const coordinators = await listCoordinators({ tab });
  return jsonResponse({ ok: true, coordinators }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createCoordinator(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, coordinator: res.coordinator }, 201);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateCoordinator(String(body.id || ''), body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, coordinator: res.coordinator }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteCoordinators(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
