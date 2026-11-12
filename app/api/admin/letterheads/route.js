import { requireAdminApi, jsonResponse } from '../../../lib/admin-system-api';
import {
  createLetterHead,
  deleteLetterHeadIds,
  listLetterHeads,
  updateLetterHead,
} from '../../../lib/admin-system-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  try {
    const letterheads = await listLetterHeads();
    return jsonResponse({ ok: true, letterheads }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to load letterheads.' }, 500);
  }
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    const res = await createLetterHead(body);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, letterhead: res.letterhead }, 201);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to create letterhead.' }, 500);
  }
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    const res = await updateLetterHead(String(body.id || ''), body);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, letterhead: res.letterhead }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to update letterhead.' }, 500);
  }
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
    const res = await deleteLetterHeadIds(ids);
    if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
    return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to delete letterhead.' }, 500);
  }
}
