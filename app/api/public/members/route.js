import { isSameOrigin } from '../../../lib/admin-auth';
import { jsonResponse } from '../../../lib/membership-suite-api';
import {
  createExtendedMember,
  getPublicGeneralMembers,
  listDesignations,
  listManagementBody,
} from '../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'general';
  const verify = url.searchParams.get('verify') || '';
  const q = url.searchParams.get('q') || '';

  if (verify.trim()) {
    const result = await getPublicGeneralMembers({ verify });
    return jsonResponse({ ok: true, ...result }, result.found ? 200 : 404);
  }
  if (view === 'management') {
    const members = await listManagementBody({ publicOnly: true });
    return jsonResponse({ ok: true, members }, 200);
  }
  if (view === 'designations') {
    const designations = await listDesignations({ status: '1' });
    return jsonResponse({ ok: true, designations }, 200);
  }

  const members = await getPublicGeneralMembers({ q });
  return jsonResponse({ ok: true, members }, 200);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'forbidden_origin' }, 403);
  }
  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  let fields = {};
  let photoFile = null;

  if (ctype.includes('multipart/form-data')) {
    const fd = await request.formData();
    for (const [k, v] of fd.entries()) {
      if (k !== 'photo') fields[k] = String(v || '');
    }
    const entry = fd.get('photo');
    if (entry && typeof entry === 'object' && typeof entry.arrayBuffer === 'function' && entry.size > 0) {
      photoFile = {
        buffer: Buffer.from(await entry.arrayBuffer()),
        filename: entry.name || 'avatar.png',
        contentType: entry.type || '',
      };
    }
  } else {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    fields = body;
  }

  const res = await createExtendedMember(fields, { isPublicApply: true, photoFile });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, member: res.member }, 201);
}
