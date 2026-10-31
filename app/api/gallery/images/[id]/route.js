import { createHash } from 'node:crypto';
import { readGalleryImage } from '../../../../lib/gallery-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mutable gallery images must not be cached by browsers or shared intermediaries:
// deletion and visibility updates must take effect immediately without serving
// stale content.
const IMAGE_CACHE_CONTROL = 'no-store, max-age=0, must-revalidate';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

const IMAGE_HEADERS = {
  'Cache-Control': IMAGE_CACHE_CONTROL,
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  // Belt-and-braces: even if a stored object were ever mislabelled, it cannot
  // execute script or load subresources when opened as a document.
  'Content-Security-Policy': "default-src 'none'; sandbox",
};

function etagFor(buffer) {
  return `"${createHash('sha1').update(buffer).digest('base64url')}"`;
}

function etagMatches(header, etag) {
  if (typeof header !== 'string' || header.trim() === '') return false;
  return header.split(',').some((candidate) => {
    const value = candidate.trim();
    if (value === '*') return true;
    return value.replace(/^W\//, '') === etag;
  });
}

export async function GET(request, context) {
  let params;
  try {
    params = await context?.params;
  } catch {
    return new Response(null, { status: 400, headers: NO_STORE_HEADERS });
  }

  const rawId = params?.id;
  if (typeof rawId !== 'string' || rawId.trim() === '') {
    return new Response(null, { status: 404, headers: NO_STORE_HEADERS });
  }

  let id;
  try {
    id = decodeURIComponent(rawId).trim();
  } catch {
    return new Response(null, { status: 404, headers: NO_STORE_HEADERS });
  }

  if (id.endsWith('/')) {
    id = id.replace(/\/+$/, '');
  }

  if (
    id.length === 0 ||
    id.length > 256 ||
    id === '.' ||
    id === '..' ||
    id.endsWith('.') ||
    id.includes('..') ||
    id.includes('/') ||
    id.includes('\\') ||
    id.includes('\0') ||
    id.includes('%') ||
    /[\u0000-\u001f\u007f]/.test(id) ||
    !/^[A-Za-z0-9_.-]+$/.test(id)
  ) {
    return new Response(null, { status: 404, headers: NO_STORE_HEADERS });
  }

  try {
    const result = await readGalleryImage(id);
    if (!result || !result.buffer) {
      return new Response(null, { status: 404, headers: NO_STORE_HEADERS });
    }

    const etag = etagFor(result.buffer);
    if (etagMatches(request.headers.get('if-none-match'), etag)) {
      return new Response(null, {
        status: 304,
        headers: { ...IMAGE_HEADERS, ETag: etag },
      });
    }

    return new Response(result.buffer, {
      status: 200,
      headers: {
        ...IMAGE_HEADERS,
        ETag: etag,
        'Content-Type': result.contentType || 'application/octet-stream',
      },
    });
  } catch (err) {
    console.error('Gallery: failed to read image', err);
    return new Response(null, { status: 503, headers: NO_STORE_HEADERS });
  }
}
