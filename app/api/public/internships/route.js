import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/operations-api';
import {
  applyForInternship,
  listInternships,
  verifyInternshipCertificate,
} from '../../../lib/operations-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const verifyCert = url.searchParams.get('verifyCert') || '';
  if (verifyCert.trim()) {
    const result = await verifyInternshipCertificate(verifyCert);
    return jsonResponse({ ok: true, ...result }, result.found ? 200 : 404);
  }
  const internships = await listInternships({ publicOnly: true });
  return jsonResponse({ ok: true, internships }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await applyForInternship(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, application: res.application }, 201);
}
