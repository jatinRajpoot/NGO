import { NextResponse } from 'next/server';
import {
  isSameOrigin,
  requireAdminSession,
} from '../../../lib/admin-auth';
import {
  GALLERY_MAX_ALT_LENGTH,
  GALLERY_MAX_FILE_BYTES,
  addGalleryPhoto,
  listGalleryPhotos,
  removeGalleryPhoto,
  updateGalleryPhoto,
} from '../../../lib/gallery-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Keep the limits in one place: the storage module enforces the same bounds.
const MAX_FILE_BYTES = GALLERY_MAX_FILE_BYTES;
const MAX_ALT_LENGTH = GALLERY_MAX_ALT_LENGTH;
const MAX_OVERHEAD_BYTES = 1024 * 1024; // 1 MiB overhead for multipart headers/fields
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + MAX_OVERHEAD_BYTES; // 11 MiB
const MAX_JSON_BYTES = 4096;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

function send(body, status, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });
}

function failure(status, error, headers = {}) {
  return send({ ok: false, error }, status, headers);
}

function hasJsonContentType(request) {
  const header = request.headers.get('content-type');
  if (typeof header !== 'string' || header.trim() === '') return false;
  const mediaType = header.split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

function isMultipartContentType(request) {
  const header = request.headers.get('content-type');
  if (typeof header !== 'string' || header.trim() === '') return false;
  const mediaType = header.split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'multipart/form-data';
}

/**
 * Stream request body up to maxBytes. Enforces limit on actual received bytes.
 * Returns { ok: true, buffer } or { ok: false, status, error }.
 */
async function readBodyBytes(request, maxBytes) {
  const declaredLength = request.headers.get('content-length');
  if (typeof declaredLength === 'string' && declaredLength !== '') {
    if (!/^\d{1,10}$/.test(declaredLength)) {
      return { ok: false, status: 400, error: 'invalid_content_length' };
    }
    if (Number(declaredLength) > maxBytes) {
      return { ok: false, status: 413, error: 'payload_too_large' };
    }
  }

  if (!request.body || typeof request.body.getReader !== 'function') {
    return { ok: false, status: 400, error: 'invalid_request' };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {}
        return { ok: false, status: 413, error: 'payload_too_large' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: 'read_error' };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  if (totalBytes === 0) {
    return { ok: false, status: 400, error: 'empty_body' };
  }

  return { ok: true, buffer: Buffer.concat(chunks) };
}

/**
 * Detect image format from magic signatures.
 * Supported: JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A), WebP (RIFF....WEBP).
 * Strictly rejects SVG, HTML, scripts, or unrecognized formats.
 */
function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP signature: RIFF at 0..3 and WEBP at 8..11
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

/**
 * Validate that date string is a real calendar date in YYYY-MM-DD format.
 */
function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    return false;
  }

  if (year < 1900 || year > 2100) return false;
  return true;
}

export async function GET(request) {
  const isAuth = await requireAdminSession();
  if (!isAuth) {
    return failure(401, 'unauthorized');
  }

  try {
    const photos = await listGalleryPhotos();
    return send({ photos }, 200);
  } catch (err) {
    console.error('Gallery: failed to list photos', err);
    return failure(503, 'storage_error');
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return failure(403, 'forbidden_origin');
  }

  const isAuth = await requireAdminSession();
  if (!isAuth) {
    return failure(401, 'unauthorized');
  }

  if (!isMultipartContentType(request)) {
    return failure(400, 'invalid_content_type');
  }

  const readResult = await readBodyBytes(request, MAX_MULTIPART_BYTES);
  if (!readResult.ok) {
    return failure(readResult.status, readResult.error);
  }

  let formData;
  try {
    const parsedResponse = new Response(readResult.buffer, {
      headers: { 'content-type': request.headers.get('content-type') },
    });
    formData = await parsedResponse.formData();
  } catch {
    return failure(400, 'invalid_multipart_body');
  }

  const file = formData.get('file');
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
    return failure(400, 'missing_file');
  }

  // Reject oversized parts before copying them into another buffer. The byte
  // limit on the parsed buffer below remains authoritative (file.size is only a
  // client-supplied hint and can be absent).
  if (typeof file.size === 'number' && file.size > MAX_FILE_BYTES) {
    return failure(413, 'file_too_large');
  }

  let fileBuffer;
  try {
    fileBuffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return failure(400, 'file_read_error');
  }

  if (fileBuffer.length === 0) {
    return failure(400, 'empty_file');
  }

  if (fileBuffer.length > MAX_FILE_BYTES) {
    return failure(413, 'file_too_large');
  }

  const detectedFormat = detectImageFormat(fileBuffer);
  if (!detectedFormat) {
    return failure(400, 'invalid_image_format');
  }

  const rawMime = typeof file.type === 'string' ? file.type.split(';')[0].trim().toLowerCase() : '';
  const filename = typeof file.name === 'string' ? file.name.trim() : '';
  const extMatch = filename.match(/\.([a-z0-9]+)$/i);
  const fileExt = extMatch ? extMatch[1].toLowerCase() : '';

  let canonicalContentType = '';
  let canonicalExt = '';

  if (detectedFormat === 'jpeg') {
    if (rawMime !== 'image/jpeg' && rawMime !== 'image/jpg') {
      return failure(400, 'mismatched_content_type');
    }
    if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
      return failure(400, 'mismatched_extension');
    }
    canonicalContentType = 'image/jpeg';
    canonicalExt = fileExt === 'jpeg' ? 'jpeg' : 'jpg';
  } else if (detectedFormat === 'png') {
    if (rawMime !== 'image/png') {
      return failure(400, 'mismatched_content_type');
    }
    if (fileExt !== 'png') {
      return failure(400, 'mismatched_extension');
    }
    canonicalContentType = 'image/png';
    canonicalExt = 'png';
  } else if (detectedFormat === 'webp') {
    if (rawMime !== 'image/webp') {
      return failure(400, 'mismatched_content_type');
    }
    if (fileExt !== 'webp') {
      return failure(400, 'mismatched_extension');
    }
    canonicalContentType = 'image/webp';
    canonicalExt = 'webp';
  } else {
    return failure(400, 'unsupported_image_format');
  }

  const rawAlt = formData.get('alt');
  if (typeof rawAlt !== 'string') {
    return failure(400, 'missing_alt');
  }
  const alt = rawAlt.replace(/\s+/g, ' ').trim();
  if (alt.length === 0 || alt.length > MAX_ALT_LENGTH || CONTROL_CHARACTER_PATTERN.test(alt)) {
    return failure(400, 'invalid_alt');
  }

  const rawDate = formData.get('date');
  if (typeof rawDate !== 'string' || !isValidCalendarDate(rawDate.trim())) {
    return failure(400, 'invalid_date');
  }
  const date = rawDate.trim();

  try {
    const photo = await addGalleryPhoto({
      buffer: fileBuffer,
      contentType: canonicalContentType,
      extension: canonicalExt,
      date,
      alt,
    });
    return send({ photo }, 201);
  } catch (err) {
    console.error('Gallery: failed to store uploaded photo', err);
    return failure(503, 'storage_error');
  }
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) {
    return failure(403, 'forbidden_origin');
  }

  const isAuth = await requireAdminSession();
  if (!isAuth) {
    return failure(401, 'unauthorized');
  }

  if (!hasJsonContentType(request)) {
    return failure(400, 'invalid_content_type');
  }

  const readResult = await readBodyBytes(request, MAX_JSON_BYTES);
  if (!readResult.ok) {
    return failure(readResult.status, readResult.error);
  }

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(readResult.buffer);
  } catch {
    return failure(400, 'invalid_utf8');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return failure(400, 'invalid_json');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return failure(400, 'invalid_body');
  }

  const { id } = data;
  if (typeof id !== 'string' || id.trim().length === 0 || id.length > 256) {
    return failure(400, 'invalid_id');
  }

  const cleanId = id.trim();
  if (
    cleanId.includes('..') ||
    cleanId.includes('/') ||
    cleanId.includes('\\') ||
    cleanId.includes('%') ||
    CONTROL_CHARACTER_PATTERN.test(cleanId) ||
    cleanId.endsWith('.') ||
    cleanId.endsWith(' ') ||
    !/^[A-Za-z0-9_.-]+$/.test(cleanId)
  ) {
    return failure(400, 'invalid_id');
  }

  try {
    const removed = await removeGalleryPhoto(cleanId);
    if (!removed) {
      return failure(404, 'not_found');
    }
    return send({ ok: true }, 200);
  } catch (err) {
    console.error('Gallery: failed to remove photo', err);
    return failure(503, 'storage_error');
  }
}

export async function PATCH(request) {
  if (!isSameOrigin(request)) {
    return failure(403, 'forbidden_origin');
  }

  const isAuth = await requireAdminSession();
  if (!isAuth) {
    return failure(401, 'unauthorized');
  }

  if (hasJsonContentType(request)) {
    const readResult = await readBodyBytes(request, MAX_JSON_BYTES);
    if (!readResult.ok) {
      return failure(readResult.status, readResult.error);
    }

    let data;
    try {
      data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(readResult.buffer));
    } catch {
      return failure(400, 'invalid_json');
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return failure(400, 'invalid_body');
    }

    const { id, alt, date } = data;
    if (typeof id !== 'string' || id.trim().length === 0 || id.length > 256) {
      return failure(400, 'invalid_id');
    }
    const cleanId = id.trim();

    if (alt !== undefined) {
      const cleanAlt = typeof alt === 'string' ? alt.replace(/\s+/g, ' ').trim() : '';
      if (cleanAlt.length === 0 || cleanAlt.length > MAX_ALT_LENGTH || CONTROL_CHARACTER_PATTERN.test(cleanAlt)) {
        return failure(400, 'invalid_alt');
      }
    }

    if (date !== undefined) {
      if (typeof date !== 'string' || !isValidCalendarDate(date.trim())) {
        return failure(400, 'invalid_date');
      }
    }

    try {
      const photo = await updateGalleryPhoto({
        id: cleanId,
        alt: alt !== undefined ? alt.trim() : undefined,
        date: date !== undefined ? date.trim() : undefined,
      });

      if (!photo) {
        return failure(404, 'not_found');
      }

      return send({ ok: true, photo }, 200);
    } catch (err) {
      console.error('Gallery: failed to update photo', err);
      return failure(503, 'storage_error');
    }
  } else if (isMultipartContentType(request)) {
    const readResult = await readBodyBytes(request, MAX_MULTIPART_BYTES);
    if (!readResult.ok) {
      return failure(readResult.status, readResult.error);
    }

    let formData;
    try {
      const parsedResponse = new Response(readResult.buffer, {
        headers: { 'content-type': request.headers.get('content-type') },
      });
      formData = await parsedResponse.formData();
    } catch {
      return failure(400, 'invalid_multipart_body');
    }

    const rawId = formData.get('id');
    if (typeof rawId !== 'string' || rawId.trim().length === 0 || rawId.length > 256) {
      return failure(400, 'invalid_id');
    }
    const cleanId = rawId.trim();

    const rawAlt = formData.get('alt');
    let cleanAlt;
    if (rawAlt !== null && rawAlt !== undefined) {
      if (typeof rawAlt !== 'string') return failure(400, 'invalid_alt');
      cleanAlt = rawAlt.replace(/\s+/g, ' ').trim();
      if (cleanAlt.length === 0 || cleanAlt.length > MAX_ALT_LENGTH || CONTROL_CHARACTER_PATTERN.test(cleanAlt)) {
        return failure(400, 'invalid_alt');
      }
    }

    const rawDate = formData.get('date');
    let cleanDate;
    if (rawDate !== null && rawDate !== undefined) {
      if (typeof rawDate !== 'string' || !isValidCalendarDate(rawDate.trim())) {
        return failure(400, 'invalid_date');
      }
      cleanDate = rawDate.trim();
    }

    const file = formData.get('file');
    let fileBuffer;
    let canonicalContentType;
    let canonicalExt;

    if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) {
        return failure(413, 'file_too_large');
      }
      try {
        fileBuffer = Buffer.from(await file.arrayBuffer());
      } catch {
        return failure(400, 'file_read_error');
      }
      if (fileBuffer.length > MAX_FILE_BYTES) {
        return failure(413, 'file_too_large');
      }

      const detectedFormat = detectImageFormat(fileBuffer);
      if (!detectedFormat) {
        return failure(400, 'invalid_image_format');
      }

      const rawMime = typeof file.type === 'string' ? file.type.split(';')[0].trim().toLowerCase() : '';
      const filename = typeof file.name === 'string' ? file.name.trim() : '';
      const extMatch = filename.match(/\.([a-z0-9]+)$/i);
      const fileExt = extMatch ? extMatch[1].toLowerCase() : '';

      if (detectedFormat === 'jpeg') {
        if (rawMime && rawMime !== 'image/jpeg' && rawMime !== 'image/jpg') {
          return failure(400, 'mismatched_content_type');
        }
        if (fileExt && fileExt !== 'jpg' && fileExt !== 'jpeg') {
          return failure(400, 'mismatched_extension');
        }
        canonicalContentType = 'image/jpeg';
        canonicalExt = fileExt === 'jpeg' ? 'jpeg' : 'jpg';
      } else if (detectedFormat === 'png') {
        if (rawMime && rawMime !== 'image/png') {
          return failure(400, 'mismatched_content_type');
        }
        if (fileExt && fileExt !== 'png') {
          return failure(400, 'mismatched_extension');
        }
        canonicalContentType = 'image/png';
        canonicalExt = 'png';
      } else if (detectedFormat === 'webp') {
        if (rawMime && rawMime !== 'image/webp') {
          return failure(400, 'mismatched_content_type');
        }
        if (fileExt && fileExt !== 'webp') {
          return failure(400, 'mismatched_extension');
        }
        canonicalContentType = 'image/webp';
        canonicalExt = 'webp';
      } else {
        return failure(400, 'unsupported_image_format');
      }
    }

    try {
      const photo = await updateGalleryPhoto({
        id: cleanId,
        alt: cleanAlt,
        date: cleanDate,
        buffer: fileBuffer,
        contentType: canonicalContentType,
        extension: canonicalExt,
      });

      if (!photo) {
        return failure(404, 'not_found');
      }

      return send({ ok: true, photo }, 200);
    } catch (err) {
      console.error('Gallery: failed to update photo', err);
      return failure(503, 'storage_error');
    }
  } else {
    return failure(400, 'invalid_content_type');
  }
}

