import { readPostImage } from '../../../../lib/posts-store';
import { NO_STORE } from '../../../../lib/posts-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGE_HEADERS = {
  ...NO_STORE,
  'Content-Security-Policy': "default-src 'none'; sandbox",
};

export async function GET(_request, context) {
  const { id } = await context.params;
  const clean = typeof id === 'string' ? id.replace(/\/+$/, '').trim() : '';
  if (!clean || clean.includes('..') || clean.includes('/') || clean.includes('\\')) {
    return new Response(null, { status: 404, headers: NO_STORE });
  }

  try {
    const file = await readPostImage(clean);
    if (!file) return new Response(null, { status: 404, headers: NO_STORE });
    return new Response(file.buffer, {
      status: 200,
      headers: {
        ...IMAGE_HEADERS,
        'Content-Type': file.contentType,
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: NO_STORE });
  }
}
