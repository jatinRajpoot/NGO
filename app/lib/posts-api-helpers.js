import { NextResponse } from 'next/server';
import { POST_MAX_IMAGE_BYTES, POST_MAX_IMAGES } from './posts-store';

export const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export function jsonResponse(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function fileEntryToDescriptor(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.arrayBuffer !== 'function') return null;
  if (entry.size <= 0) return { error: 'One of the selected image files is empty.' };
  if (entry.size > POST_MAX_IMAGE_BYTES) return { error: 'Each image must be 2 MB or smaller.' };
  const ab = await entry.arrayBuffer();
  return {
    buffer: Buffer.from(ab),
    filename: typeof entry.name === 'string' ? entry.name : 'upload.png',
    contentType: typeof entry.type === 'string' ? entry.type : '',
  };
}

export async function parseMultipartFiles(formData, fieldNames = ['images', 'images[]', 'file', 'image']) {
  const files = [];
  for (const field of fieldNames) {
    for (const item of formData.getAll(field)) {
      if (item && typeof item === 'object' && typeof item.arrayBuffer === 'function' && item.size > 0) {
        files.push(item);
      }
    }
  }
  if (files.length > POST_MAX_IMAGES) {
    return { ok: false, error: `Maximum ${POST_MAX_IMAGES} images are allowed per post.` };
  }

  const converted = [];
  for (const entry of files) {
    const desc = await fileEntryToDescriptor(entry);
    if (desc?.error) return { ok: false, error: desc.error };
    if (desc) converted.push(desc);
  }
  return { ok: true, files: converted };
}
