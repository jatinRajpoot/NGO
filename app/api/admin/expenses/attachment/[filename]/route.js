import { NO_STORE, requireAdminApi } from '../../../../../lib/operations-api';
import { readExpenseAttachment } from '../../../../../lib/operations-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const { filename } = await context.params;
  const data = await readExpenseAttachment(filename);
  if (!data) return new Response(null, { status: 404, headers: NO_STORE });
  return new Response(data.buffer, {
    status: 200,
    headers: {
      ...NO_STORE,
      'Content-Type': data.contentType,
      'Content-Disposition': 'inline',
    },
  });
}
