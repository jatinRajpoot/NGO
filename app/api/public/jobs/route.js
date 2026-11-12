import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/operations-api';
import { applyForJob, listJobs } from '../../../lib/operations-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const jobs = await listJobs({ publicOnly: true });
  return jsonResponse({ ok: true, jobs }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await applyForJob(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, application: res.application }, 201);
}
