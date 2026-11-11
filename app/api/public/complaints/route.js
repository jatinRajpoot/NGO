import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/support-api';
import { lookupComplaintStatus, submitComplaint } from '../../../lib/support-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('query') || url.searchParams.get('ticket') || '';
  if (!q.trim()) {
    return jsonResponse({ ok: false, error: 'Provide Ticket Number or Email to check complaint status.' }, 400);
  }
  const results = await lookupComplaintStatus(q);
  return jsonResponse({ ok: true, complaints: results }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await submitComplaint(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse(
    {
      ok: true,
      complaint: {
        ticketNo: res.complaint.ticketNo,
        status: res.complaint.status,
        subject: res.complaint.subject,
      },
    },
    201
  );
}
