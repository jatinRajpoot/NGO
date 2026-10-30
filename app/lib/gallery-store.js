// Server-only gallery storage module.
//
// Implements the shared gallery contract:
//   - listGalleryPhotos() -> [{ id, src, alt, date }] (date formatted YYYY-MM-DD)
//   - addGalleryPhoto({ buffer, contentType, extension, date, alt }) -> photo
//   - removeGalleryPhoto(id) -> boolean
//   - readGalleryImage(id) -> { buffer, contentType } | null
//
// Storage modes:
//   1. Google Cloud Storage (GCS):
//      Active when `process.env.GALLERY_BUCKET` is configured and non-empty.
//      Uses concurrency-safe generation-match CAS (Compare-And-Swap) retry logic
//      to update `manifest.json`. When the manifest is absent, `ifGenerationMatch: 0`
//      is asserted, and the manifest is downloaded pinned to the generation read
//      first, so the parsed bytes and the CAS precondition always describe the
//      same revision. Uploaded files are named `<uuid>.<ext>` and uploaded prior
//      to publishing metadata; on manifest update failure, uploaded bytes are
//      cleaned up. No-op manifest mutations never write. Errors on GCS never fall
//      back to local storage.
//   2. Local storage:
//      Active only in development or test environments (`process.env.NODE_ENV !== 'production'`)
//      when `GALLERY_BUCKET` is not set. Data is stored in `.data/gallery/` or
//      `process.env.GALLERY_DATA_DIR`. Manifest mutations are serialized via an in-process
//      mutex and written atomically via temporary files and rename.
//   3. Production without bucket:
//      Lists seed originals from `public/media/gallery/`, but fails all mutation
//      operations (`addGalleryPhoto`, `removeGalleryPhoto`).
//
// Hardening rules enforced here (not only in the HTTP layer):
//   - Requested ids and stored filenames are restricted to a single, simple path
//     segment with a known image extension, so a tampered manifest can never make
//     the local backend read or delete outside the gallery data directory, and can
//     never point the GCS backend at `manifest.json`.
//   - Served content types are derived from the validated stored filename instead
//     of trusting the declared MIME type recorded in the manifest.
//   - Uploads are size/alt/date validated, magic-byte validated, written via a
//     temporary file, and cleaned up when publication fails.

import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';

const MANIFEST_FILENAME = 'manifest.json';
const MANIFEST_CONTENT_TYPE = 'application/json';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ORIGINAL_FILENAME_PATTERN = /^IMG-(\d{4})(\d{2})(\d{2})-WA\d+\.webp$/i;
const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
// Uploaded bytes are always `<uuid>.<ext>`. Only allow that shape (no separators,
// no extra dots, no JSON) so stored filenames can be joined onto the data
// directory or used as object names without escaping the gallery storage.
const STORED_FILENAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}\.(?:jpe?g|png|webp)$/i;
const WINDOWS_RESERVED_NAME_PATTERN = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ALT_LENGTH = 300;
const MAX_ID_LENGTH = 256;
const MAX_CAS_ATTEMPTS = 8;

const CONTENT_TYPE_BY_EXTENSION = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
});

const EXTENSION_BY_CONTENT_TYPE = Object.freeze({
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

// Shared with the admin API route so both layers enforce identical limits.
export const GALLERY_MAX_FILE_BYTES = MAX_IMAGE_BYTES;
export const GALLERY_MAX_ALT_LENGTH = MAX_ALT_LENGTH;

let cachedStorage = null;

function getStorage() {
  if (!cachedStorage) {
    cachedStorage = new Storage();
  }
  return cachedStorage;
}

function getBucketName() {
  const bucket = process.env.GALLERY_BUCKET;
  if (typeof bucket === 'string' && bucket.trim().length > 0) {
    return bucket.trim();
  }
  return null;
}

function getBucket() {
  const bucketName = getBucketName();
  if (!bucketName) return null;
  return getStorage().bucket(bucketName);
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isProductionWithoutBucket() {
  return isProduction() && !getBucketName();
}

function getLocalDataDir() {
  return process.env.GALLERY_DATA_DIR || path.join(process.cwd(), '.data', 'gallery');
}

// In-process serialization mutex for local development/testing mutations.
// Multi-process deployments must use GCS (production does).
let localMutationChain = Promise.resolve();

function withLocalLock(operation) {
  const next = localMutationChain.then(operation, operation);
  localMutationChain = next.catch(() => {});
  return next;
}

function isNotFoundError(err) {
  if (!err) return false;
  return (
    err.code === 404 ||
    err.code === '404' ||
    err.code === 'ENOENT' ||
    err.status === 404 ||
    err.statusCode === 404
  );
}

function isPreconditionFailedError(err) {
  if (!err) return false;
  if (err.code === 412 || err.code === '412' || err.status === 412 || err.statusCode === 412) {
    return true;
  }
  return String(err.message || '').includes('412');
}

function casBackoff(attempt) {
  return Math.min(50 * Math.pow(2, attempt) + Math.random() * 50, 800);
}

function createEmptyManifest() {
  return {
    version: 1,
    uploaded: [],
    hiddenOriginals: [],
  };
}

function normalizeManifest(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.uploaded) || !Array.isArray(data.hiddenOriginals)) {
    throw new Error('Invalid gallery manifest');
  }
  return {
    version: 1,
    uploaded: data.uploaded,
    hiddenOriginals: data.hiddenOriginals,
  };
}

/**
 * Validate and sanitize image ID or filename to prevent directory traversal.
 * Handles inputs formatted as UUID, filename, or /api/gallery/images/ path.
 */
function normalizeImageId(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s.length === 0 || s.length > MAX_ID_LENGTH) return null;
  s = s.split('?')[0].split('#')[0];
  s = s.replace(/^\/+|\/+$/g, '');

  if (s.startsWith('api/gallery/images/')) {
    s = s.slice('api/gallery/images/'.length).replace(/^\/+|\/+$/g, '');
  } else if (s.startsWith('media/gallery/')) {
    s = s.slice('media/gallery/'.length).replace(/^\/+|\/+$/g, '');
  }

  if (s.includes('/') || s.includes('\\') || s.includes('..') || s.includes('\0') || s.includes('%')) {
    return null;
  }

  const base = path.basename(s);
  if (!base || base === '.' || base === '..' || !SAFE_ID_PATTERN.test(base)) {
    return null;
  }
  if (base.endsWith('.') || base.endsWith(' ')) return null;

  return base;
}

/**
 * Validate a filename recorded in the manifest before it is joined onto the
 * local data directory or used as a GCS object name. Rejects traversal,
 * `manifest.json`, temporary files, and Windows device names.
 */
function sanitizeStoredFilename(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (name.length === 0 || name.length > 128) return null;
  if (!STORED_FILENAME_PATTERN.test(name)) return null;
  const stem = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
  if (!stem || WINDOWS_RESERVED_NAME_PATTERN.test(stem)) return null;
  return name;
}

function contentTypeForFilename(filename) {
  if (typeof filename !== 'string') return 'application/octet-stream';
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  return CONTENT_TYPE_BY_EXTENSION[filename.slice(dot + 1).toLowerCase()] || 'application/octet-stream';
}

/**
 * Validate image buffer magic bytes against the canonical MIME type derived
 * from the validated extension to reject spoofed files.
 */
function validateImageBuffer(buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new Error('Image data is too small or invalid');
  }

  const type = (contentType || '').toLowerCase().trim();
  if (type === 'image/webp') {
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      throw new Error('Image data does not match image/webp format');
    }
  } else if (type === 'image/jpeg') {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      throw new Error('Image data does not match image/jpeg format');
    }
  } else if (type === 'image/png') {
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      throw new Error('Image data does not match image/png format');
    }
  } else {
    throw new Error('Unsupported image type');
  }
}

/**
 * Resolve the canonical file extension and ensure it agrees with the declared
 * content type. Returns a bare extension (jpg/jpeg/png/webp).
 */
function resolveExtension(extension, contentType) {
  let ext = typeof extension === 'string' ? extension.replace(/^\./, '').trim().toLowerCase() : '';
  const declared = typeof contentType === 'string' ? contentType.split(';')[0].trim().toLowerCase() : '';
  if (!ext) {
    ext = EXTENSION_BY_CONTENT_TYPE[declared] || '';
  }
  const expectedExt = EXTENSION_BY_CONTENT_TYPE[declared];
  // `.jpeg` is the same format as `.jpg`; keep the caller's spelling for the
  // stored filename but require it to agree with the declared MIME type.
  const comparableExt = ext === 'jpeg' ? 'jpg' : ext;
  if (!comparableExt || !expectedExt || comparableExt !== expectedExt) {
    throw new Error('Unsupported or invalid image extension');
  }
  return ext;
}

function parseDateString(date) {
  if (typeof date !== 'string') return null;
  const clean = date.trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) {
    return null;
  }
  return clean;
}

function validateDateString(date) {
  const clean = parseDateString(date);
  if (!clean) {
    throw new Error('Invalid date: expected a real calendar date in YYYY-MM-DD format');
  }
  return clean;
}

function normalizeAltText(alt) {
  return typeof alt === 'string' ? alt.replace(/\s+/g, ' ').trim() : '';
}

// -----------------------------------------------------------------------------
// GCS Operations with CAS (Compare-And-Swap) Retry
// -----------------------------------------------------------------------------

async function readManifestGcs(bucket) {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const manifestFile = bucket.file(MANIFEST_FILENAME);
    let metadata;
    try {
      [metadata] = await manifestFile.getMetadata();
    } catch (err) {
      if (isNotFoundError(err)) {
        return {
          manifest: createEmptyManifest(),
          generation: 0,
        };
      }
      throw err;
    }

    const generation = Number(metadata?.generation);
    if (!Number.isSafeInteger(generation) || generation <= 0) {
      throw new Error('Gallery manifest metadata is missing a valid generation');
    }

    // Pin the download to the generation we just read. Without this, a concurrent
    // writer can replace the object between getMetadata() and download(), and the
    // CAS write would then be based on bytes from a different revision.
    try {
      const [contents] = await bucket.file(MANIFEST_FILENAME, { generation }).download();

      let parsed;
      try {
        parsed = JSON.parse(contents.toString('utf8'));
      } catch {
        throw new Error('Invalid gallery manifest JSON');
      }

      return {
        manifest: normalizeManifest(parsed),
        generation,
      };
    } catch (err) {
      if (isNotFoundError(err)) {
        // The generation vanished between metadata lookup and download. Re-read
        // the current manifest; treating this as empty can hide existing photos
        // or incorrectly report that a concurrent deletion was a no-op.
        continue;
      }
      throw err;
    }
  }
  throw new Error('Gallery manifest changed repeatedly while reading');
}

async function mutateManifestGcs(bucket, mutateFn) {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const { manifest, generation } = await readManifestGcs(bucket);
    const mutation = await mutateFn(manifest);

    if (!mutation || typeof mutation !== 'object' || !mutation.updatedManifest) {
      throw new Error('Gallery manifest mutation returned an invalid result');
    }

    const { updatedManifest, result } = mutation;

    // A no-op mutation (for example, deleting an id that is not present) must
    // not rewrite the manifest: it would burn a generation and make concurrent
    // writers retry for nothing.
    if (updatedManifest === manifest) {
      return result;
    }

    try {
      await bucket.file(MANIFEST_FILENAME).save(JSON.stringify(updatedManifest, null, 2), {
        contentType: MANIFEST_CONTENT_TYPE,
        resumable: false,
        preconditionOpts: {
          ifGenerationMatch: generation,
        },
      });
      return result;
    } catch (err) {
      if (!isPreconditionFailedError(err)) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, casBackoff(attempt)));
    }
  }
  throw new Error('Failed to update gallery manifest after CAS conflict retries');
}

// -----------------------------------------------------------------------------
// Local Storage Operations
// -----------------------------------------------------------------------------

async function readLocalManifest(dataDir) {
  const manifestPath = path.join(dataDir, MANIFEST_FILENAME);
  try {
    const raw = await readFile(manifestPath, 'utf8');
    return normalizeManifest(JSON.parse(raw));
  } catch (err) {
    if (isNotFoundError(err)) {
      return createEmptyManifest();
    }
    if (err instanceof SyntaxError) {
      throw new Error('Invalid gallery manifest JSON');
    }
    throw err;
  }
}

async function writeLocalManifestAtomic(dataDir, manifest) {
  await mkdir(dataDir, { recursive: true });
  const manifestPath = path.join(dataDir, MANIFEST_FILENAME);
  const tempPath = path.join(dataDir, `${MANIFEST_FILENAME}.tmp.${randomUUID()}`);
  const payload = JSON.stringify(manifest, null, 2);

  try {
    await writeFile(tempPath, payload, 'utf8');
    await rename(tempPath, manifestPath);
  } catch (err) {
    try {
      await unlink(tempPath);
    } catch {}
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Seed Original Photos
// -----------------------------------------------------------------------------

async function listOriginalPhotos(hiddenOriginals) {
  const hiddenSet = new Set(Array.isArray(hiddenOriginals) ? hiddenOriginals : []);
  const mediaDir = path.join(process.cwd(), 'public', 'media', 'gallery');

  let entries;
  try {
    entries = await readdir(mediaDir);
  } catch (err) {
    if (isNotFoundError(err)) {
      return [];
    }
    throw err;
  }

  const originals = [];
  for (const name of entries) {
    const match = name.match(ORIGINAL_FILENAME_PATTERN);
    if (!match) continue;
    if (hiddenSet.has(name)) continue;

    const [, year, month, day] = match;
    const dateKey = `${year}-${month}-${day}`;
    if (!parseDateString(dateKey)) continue;

    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dateLabel = dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    originals.push({
      id: name,
      src: `/media/gallery/${name}`,
      alt: `Gallery photograph from ${dateLabel}`,
      date: dateKey,
    });
  }

  return originals;
}

function uploadedStem(filename) {
  return filename.slice(0, filename.lastIndexOf('.'));
}

/**
 * Compare a requested id against an uploaded manifest record without trusting
 * the record. Matches exact id, exact stored filename, or the filename stem.
 * Invalid stored filenames never match, so they can never drive a file delete.
 */
function uploadedRecordMatches(item, targetId) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id === 'string' && item.id === targetId) return true;
  const filename = sanitizeStoredFilename(item.filename);
  if (!filename) return false;
  return targetId === filename || targetId === uploadedStem(filename);
}

function findUploadedIndex(uploaded, targetId) {
  if (!Array.isArray(uploaded) || !targetId) return -1;
  for (let index = 0; index < uploaded.length; index++) {
    if (uploadedRecordMatches(uploaded[index], targetId)) return index;
  }
  return -1;
}

/**
 * Convert a raw manifest record into the public photo shape, dropping records
 * whose filename/date cannot be trusted. Uses the validated filename as the
 * source of truth, so a hand-edited manifest cannot inject an arbitrary `src`
 * or content type into the gallery.
 */
function normalizeUploadedRecord(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const filename = sanitizeStoredFilename(item.filename);
  if (!filename) return null;

  const fallbackId = uploadedStem(filename);
  const id =
    typeof item.id === 'string' && item.id.length <= MAX_ID_LENGTH && SAFE_ID_PATTERN.test(item.id)
      ? item.id
      : fallbackId;

  const date =
    parseDateString(item.date) ||
    (typeof item.createdAt === 'string' ? parseDateString(item.createdAt.slice(0, 10)) : null);
  if (!date) return null;

  return {
    id,
    filename,
    src: `/api/gallery/images/${filename}`,
    alt: normalizeAltText(item.alt),
    date,
  };
}

// -----------------------------------------------------------------------------
// Public Gallery Contract Exports
// -----------------------------------------------------------------------------

/**
 * List all gallery photos (uploaded photos + visible seed originals),
 * sorted chronologically by date descending.
 *
 * @returns {Promise<Array<{ id: string, src: string, alt: string, date: string }>>}
 */
export async function listGalleryPhotos() {
  let manifest;

  if (isProductionWithoutBucket()) {
    manifest = createEmptyManifest();
  } else {
    const bucket = getBucket();
    if (bucket) {
      const res = await readManifestGcs(bucket);
      manifest = res.manifest;
    } else {
      manifest = await readLocalManifest(getLocalDataDir());
    }
  }

  const originals = await listOriginalPhotos(manifest.hiddenOriginals);

  const uploaded = [];
  const seenIds = new Set();
  for (const item of manifest.uploaded) {
    const photo = normalizeUploadedRecord(item);
    if (!photo) continue;
    if (seenIds.has(photo.id)) continue;
    seenIds.add(photo.id);
    uploaded.push({
      id: photo.id,
      src: photo.src,
      alt: photo.alt,
      date: photo.date,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    });
  }

  const allPhotos = [...uploaded, ...originals];

  allPhotos.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    const aIsOriginal = ORIGINAL_FILENAME_PATTERN.test(a.id);
    const bIsOriginal = ORIGINAL_FILENAME_PATTERN.test(b.id);
    if (aIsOriginal !== bIsOriginal) {
      return aIsOriginal ? 1 : -1;
    }
    const aCreated = a.createdAt || '';
    const bCreated = b.createdAt || '';
    if (aCreated && bCreated && aCreated !== bCreated) {
      return bCreated.localeCompare(aCreated);
    }
    return b.id.localeCompare(a.id, undefined, { numeric: true });
  });

  return allPhotos.map(({ id, src, alt, date }) => ({ id, src, alt, date }));
}

/**
 * Add a new uploaded photograph to the gallery store.
 * Validates and writes the image bytes first, publishes metadata with CAS/lock,
 * and cleans up the uploaded file on failure.
 *
 * @param {{ buffer: Buffer | Uint8Array, contentType: string, extension: string, date: string, alt: string }} params
 * @returns {Promise<{ id: string, src: string, alt: string, date: string }>}\n */
export async function addGalleryPhoto({ buffer, contentType, extension, date, alt } = {}) {
  if (isProductionWithoutBucket()) {
    throw new Error('Gallery mutations are disabled: storage bucket is not configured in production');
  }

  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new Error('Invalid gallery photograph: image data is required');
  }
  const rawBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (rawBuffer.length === 0 || rawBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Invalid gallery photograph: image must be between 1 byte and 10 MiB');
  }

  const cleanContentType = typeof contentType === 'string' ? contentType.split(';')[0].trim().toLowerCase() : '';
  const cleanExtension = resolveExtension(extension, cleanContentType);
  const canonicalContentType = CONTENT_TYPE_BY_EXTENSION[cleanExtension];
  validateImageBuffer(rawBuffer, canonicalContentType);

  const cleanDate = validateDateString(date);
  const cleanAlt = normalizeAltText(alt);
  if (
    cleanAlt.length === 0 ||
    cleanAlt.length > MAX_ALT_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(cleanAlt)
  ) {
    throw new Error('Invalid gallery photograph: description is required and must be 300 characters or fewer');
  }

  const id = randomUUID();
  const filename = `${id}.${cleanExtension}`;
  const src = `/api/gallery/images/${filename}`;

  const record = {
    id,
    filename,
    src,
    alt: cleanAlt,
    date: cleanDate,
    contentType: canonicalContentType,
    size: rawBuffer.length,
    createdAt: new Date().toISOString(),
  };

  const photoResult = {
    id,
    src,
    alt: cleanAlt,
    date: cleanDate,
  };

  const bucket = getBucket();
  if (bucket) {
    const file = bucket.file(filename);
    await file.save(rawBuffer, {
      contentType: canonicalContentType,
      resumable: false,
      metadata: {
        cacheControl: 'no-store, max-age=0, must-revalidate',
      },
    });

    try {
      await mutateManifestGcs(bucket, (currentManifest) => {
        const uploadedList = Array.isArray(currentManifest.uploaded) ? [...currentManifest.uploaded] : [];
        uploadedList.push(record);
        return {
          updatedManifest: { ...currentManifest, uploaded: uploadedList },
          result: photoResult,
        };
      });
      return photoResult;
    } catch (err) {
      try {
        await file.delete({ ignoreNotFound: true });
      } catch {}
      throw err;
    }
  } else {
    const dataDir = getLocalDataDir();
    await mkdir(dataDir, { recursive: true });
    const targetFilePath = path.join(dataDir, filename);
    const tempFilePath = path.join(dataDir, `${filename}.tmp.${randomUUID()}`);

    // Write-then-rename keeps partially written images from ever being visible
    // under the real name. Clean up the temporary file if either step fails.
    try {
      await writeFile(tempFilePath, rawBuffer);
      await rename(tempFilePath, targetFilePath);
    } catch (err) {
      try {
        await unlink(tempFilePath);
      } catch {}
      throw err;
    }

    try {
      await withLocalLock(async () => {
        const currentManifest = await readLocalManifest(dataDir);
        const uploadedList = Array.isArray(currentManifest.uploaded) ? [...currentManifest.uploaded] : [];
        uploadedList.push(record);
        const updatedManifest = { ...currentManifest, uploaded: uploadedList };
        await writeLocalManifestAtomic(dataDir, updatedManifest);
      });
      return photoResult;
    } catch (err) {
      try {
        await unlink(targetFilePath);
      } catch {}
      throw err;
    }
  }
}

/**
 * Remove a photograph from the gallery store by ID or filename.
 * For uploaded photos: removes the record from manifest and deletes stored image bytes.
 * For seed original photos: records the filename in manifest hiddenOriginals.
 *
 * Once the manifest no longer references an image, deleting its bytes is
 * best-effort: an orphaned object is unreachable through readGalleryImage(), and
 * failing the whole request after the record was already unpublished would make
 * a retry report 404.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function removeGalleryPhoto(id) {
  if (isProductionWithoutBucket()) {
    throw new Error('Gallery mutations are disabled: storage bucket is not configured in production');
  }

  const normalizedId = normalizeImageId(id);
  if (!normalizedId) return false;

  const isOriginal =
    ORIGINAL_FILENAME_PATTERN.test(normalizedId) &&
    (await listOriginalPhotos([])).some((photo) => photo.id === normalizedId);

  const bucket = getBucket();
  if (bucket) {
    const removalResult = await mutateManifestGcs(bucket, (currentManifest) => {
      const uploadedList = Array.isArray(currentManifest.uploaded) ? currentManifest.uploaded : [];
      const matchIndex = findUploadedIndex(uploadedList, normalizedId);

      if (matchIndex !== -1) {
        const removedItem = uploadedList[matchIndex];
        const newUploaded = uploadedList.filter((_, idx) => idx !== matchIndex);
        return {
          updatedManifest: { ...currentManifest, uploaded: newUploaded },
          result: {
            type: 'uploaded',
            filename: sanitizeStoredFilename(removedItem && removedItem.filename),
          },
        };
      }

      if (isOriginal) {
        const hiddenList = Array.isArray(currentManifest.hiddenOriginals)
          ? [...currentManifest.hiddenOriginals]
          : [];
        if (!hiddenList.includes(normalizedId)) {
          hiddenList.push(normalizedId);
          return {
            updatedManifest: { ...currentManifest, hiddenOriginals: hiddenList },
            result: { type: 'original', filename: normalizedId },
          };
        }
      }

      return {
        updatedManifest: currentManifest,
        result: null,
      };
    });

    if (!removalResult) return false;

    if (removalResult.type === 'uploaded' && removalResult.filename) {
      try {
        await bucket.file(removalResult.filename).delete({ ignoreNotFound: true });
      } catch (err) {
        if (!isNotFoundError(err)) {
          console.error('Gallery: failed to delete stored image object', err);
        }
      }
    }

    return true;
  } else {
    return withLocalLock(async () => {
      const dataDir = getLocalDataDir();
      const currentManifest = await readLocalManifest(dataDir);
      const uploadedList = Array.isArray(currentManifest.uploaded) ? currentManifest.uploaded : [];
      const matchIndex = findUploadedIndex(uploadedList, normalizedId);

      if (matchIndex !== -1) {
        const removedItem = uploadedList[matchIndex];
        const removedFilename = sanitizeStoredFilename(removedItem && removedItem.filename);
        const newUploaded = uploadedList.filter((_, idx) => idx !== matchIndex);
        const updatedManifest = { ...currentManifest, uploaded: newUploaded };
        await writeLocalManifestAtomic(dataDir, updatedManifest);

        if (removedFilename) {
          try {
            await unlink(path.join(dataDir, removedFilename));
          } catch (err) {
            if (!isNotFoundError(err)) {
              console.error('Gallery: failed to delete stored image file', err);
            }
          }
        }
        return true;
      }

      if (isOriginal) {
        const hiddenList = Array.isArray(currentManifest.hiddenOriginals)
          ? [...currentManifest.hiddenOriginals]
          : [];
        if (!hiddenList.includes(normalizedId)) {
          hiddenList.push(normalizedId);
          const updatedManifest = { ...currentManifest, hiddenOriginals: hiddenList };
          await writeLocalManifestAtomic(dataDir, updatedManifest);
          return true;
        }
      }

      return false;
    });
  }
}

/**
 * Read the image bytes and MIME type for an uploaded photo.
 * Reads image only if manifest contains it (traversal-safe).
 * The returned content type is derived from the validated stored filename, so a
 * tampered manifest cannot turn this endpoint into a same-origin HTML/SVG host.
 * Returns null if not found or on 404/ENOENT.
 *
 * @param {string} id
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 */
export async function readGalleryImage(id) {
  const normalizedId = normalizeImageId(id);
  if (!normalizedId) return null;

  if (isProductionWithoutBucket()) {
    return null;
  }

  const bucket = getBucket();
  if (bucket) {
    const { manifest } = await readManifestGcs(bucket);
    const matchIndex = findUploadedIndex(manifest.uploaded, normalizedId);
    if (matchIndex === -1) return null;

    const filename = sanitizeStoredFilename(manifest.uploaded[matchIndex].filename);
    if (!filename) return null;

    try {
      const [buffer] = await bucket.file(filename).download();
      return {
        buffer,
        contentType: contentTypeForFilename(filename),
      };
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  } else {
    const dataDir = getLocalDataDir();
    const manifest = await readLocalManifest(dataDir);
    const matchIndex = findUploadedIndex(manifest.uploaded, normalizedId);
    if (matchIndex === -1) return null;

    const filename = sanitizeStoredFilename(manifest.uploaded[matchIndex].filename);
    if (!filename) return null;

    try {
      const buffer = await readFile(path.join(dataDir, filename));
      return {
        buffer,
        contentType: contentTypeForFilename(filename),
      };
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }
}
