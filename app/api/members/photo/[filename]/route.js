import { NO_STORE } from '../../../../lib/membership-suite-api';
import { readMemberPhoto } from '../../../../lib/membership-suite-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, context) {
  const { filename } = await context.params;
  const clean = String(filename || '').replace(/\/+$/, '').trim();
  const data = await readMemberPhoto(clean);
  if (!data) return new Response(null, { status: 404, headers: NO_STORE });
  return new Response(data.buffer, {
    status: 200,
    headers: {
      ...NO_STORE,
      'Content-Type': data.contentType,
    },
  });
}
