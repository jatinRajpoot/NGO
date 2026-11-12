import { csvResponse, jsonResponse, requireAdminApi } from '../../../../lib/membership-suite-api';
import {
  createExtendedMember,
  deleteExtendedMembers,
  listExtendedMembers,
  toCsv,
  updateExtendedMember,
} from '../../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const members = await listExtendedMembers({
    tab: url.searchParams.get('tab') || 'all',
    search: url.searchParams.get('search') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Reg No', 'Name', 'Email', 'Mobile', 'District', 'State', 'Designation', 'Added By', 'Fee', 'Payment', 'Account Status', 'Referred', 'Ref. Donations', 'Joined'],
      members.map((m) => [
        m.regNo,
        m.name,
        m.email,
        m.mobile,
        m.district,
        m.state,
        m.designation,
        m.addedBy,
        m.membershipFee,
        m.paymentStatus,
        m.accountStatus,
        m.referredCount,
        m.referredDonationsTotal,
        m.joinedAt,
      ])
    );
    return csvResponse(csv, 'gsdd-members-export.csv');
  }

  return jsonResponse({ ok: true, members }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await createExtendedMember(body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, member: res.member }, 201);
}

export async function PATCH(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await updateExtendedMember(String(body.id || ''), body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, member: res.member }, 200);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteExtendedMembers(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
