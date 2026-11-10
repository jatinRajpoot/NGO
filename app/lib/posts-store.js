// Server-only durable store for Activity/Press Posts, News Articles, and Post Images.
// Persists JSON collections and uploaded images to GCS when GALLERY_BUCKET is configured,
// or atomically to POSTS_DATA_DIR / PORTAL_DATA_DIR / ADMIN_DATA_DIR / .data/posts locally.

import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';

export const POST_MAX_IMAGES = 5;
export const POST_MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MiB per image
export const POST_TYPES = ['press', 'activity'];
export const NEWS_STATUSES = ['active', 'draft'];

const CONTENT_TYPE_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const ALLOWED_HTML_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'ol', 'ul', 'li',
  'a', 'img', 'iframe', 'div', 'span',
]);

const SAFE_IMAGE_FILENAME = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i;

let cachedGcsClient = null;
const locks = new Map();

function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.catch(() => {}));
  return next;
}

function getDataDir() {
  const candidates = [
    process.env.POSTS_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'posts'),
    path.join(tmpdir(), 'gsdd-posts-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('posts') ? dir : path.join(dir, 'posts');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      const imgDir = path.join(target, 'images');
      if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });
      return target;
    } catch {
      // Try next candidate directory
    }
  }
  const fallback = path.join(tmpdir(), 'gsdd-posts-data');
  if (!existsSync(fallback)) mkdirSync(fallback, { recursive: true });
  return fallback;
}

function getGcsBucket() {
  const bucketName = process.env.GALLERY_BUCKET;
  if (typeof bucketName !== 'string' || bucketName.trim().length === 0) return null;
  try {
    if (!cachedGcsClient) cachedGcsClient = new Storage();
    return cachedGcsClient.bucket(bucketName.trim());
  } catch {
    return null;
  }
}

async function readJson(name, seedFn) {
  const bucket = getGcsBucket();
  if (bucket) {
    const file = bucket.file(`posts/${name}.json`);
    try {
      const [buf] = await file.download();
      return JSON.parse(buf.toString('utf8'));
    } catch (err) {
      if (err?.code === 404 || err?.status === 404 || err?.statusCode === 404) {
        const initial = seedFn();
        await writeJson(name, initial);
        return initial;
      }
      throw err;
    }
  }

  const filePath = path.join(getDataDir(), `${name}.json`);
  if (!existsSync(filePath)) {
    const initial = seedFn();
    await writeJson(name, initial);
    return initial;
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

async function writeJson(name, data) {
  const payload = JSON.stringify(data, null, 2);
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`posts/${name}.json`).save(payload, {
      contentType: 'application/json',
      resumable: false,
    });
    return;
  }

  const dir = getDataDir();
  const target = path.join(dir, `${name}.json`);
  const temp = `${target}.tmp.${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(temp, payload, 'utf8');
    renameSync(temp, target);
  } catch (err) {
    try {
      unlinkSync(temp);
    } catch {}
    throw err;
  }
}

export function detectPostImageType(buffer, filename = '', declaredMime = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { ok: false, error: 'Image file is empty or too small.' };
  }
  if (buffer.length > POST_MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Each image must be 2 MB or smaller.' };
  }

  const extMatch = String(filename || '').trim().match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  if (!CONTENT_TYPE_BY_EXT[ext]) {
    return { ok: false, error: 'Only JPG, PNG, GIF, and WebP images are supported.' };
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isGif =
    buffer.toString('ascii', 0, 6) === 'GIF87a' ||
    buffer.toString('ascii', 0, 6) === 'GIF89a';
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  let detectedExt = null;
  if (isJpeg) detectedExt = ext === 'jpeg' ? 'jpeg' : 'jpg';
  else if (isPng) detectedExt = 'png';
  else if (isGif) detectedExt = 'gif';
  else if (isWebp) detectedExt = 'webp';

  if (!detectedExt) {
    return { ok: false, error: 'File contents do not match a valid JPG, PNG, GIF, or WebP image.' };
  }

  const normExt = ext === 'jpeg' ? 'jpg' : ext;
  const normDetected = detectedExt === 'jpeg' ? 'jpg' : detectedExt;
  if (normExt !== normDetected) {
    return { ok: false, error: 'Image file extension does not match its actual image content.' };
  }

  const canonicalMime = CONTENT_TYPE_BY_EXT[detectedExt];
  const cleanDeclared = String(declaredMime || '').split(';')[0].trim().toLowerCase();
  if (cleanDeclared && cleanDeclared !== 'application/octet-stream') {
    const normalizedDeclared = cleanDeclared === 'image/jpg' ? 'image/jpeg' : cleanDeclared;
    if (normalizedDeclared !== canonicalMime) {
      return { ok: false, error: 'Declared MIME type does not match image contents.' };
    }
  }

  return { ok: true, ext: detectedExt, contentType: canonicalMime };
}

async function savePostImageBuffer({ buffer, ext, contentType, originalName }) {
  const id = `img-${randomUUID().slice(0, 12)}.${ext}`;
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`posts/images/${id}`).save(buffer, {
      contentType,
      resumable: false,
    });
  } else {
    const imgPath = path.join(getDataDir(), 'images', id);
    const temp = `${imgPath}.tmp.${randomBytes(4).toString('hex')}`;
    writeFileSync(temp, buffer);
    renameSync(temp, imgPath);
  }

  return {
    id,
    filename: id,
    originalName: String(originalName || id).slice(0, 140),
    contentType,
    size: buffer.length,
    src: `/api/posts/images/${id}`,
  };
}

async function deleteStoredImageFile(filename) {
  if (!filename || !SAFE_IMAGE_FILENAME.test(filename)) return;
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      await bucket.file(`posts/images/${filename}`).delete({ ignoreNotFound: true });
    } catch {}
    return;
  }
  const imgPath = path.join(getDataDir(), 'images', filename);
  try {
    if (existsSync(imgPath)) unlinkSync(imgPath);
  } catch {}
}

export async function readPostImage(filename) {
  const clean = String(filename || '').trim();
  if (!SAFE_IMAGE_FILENAME.test(clean)) return null;

  const ext = clean.split('.').pop().toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream';

  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const [buffer] = await bucket.file(`posts/images/${clean}`).download();
      return { buffer, contentType };
    } catch {
      return null;
    }
  }

  const imgPath = path.join(getDataDir(), 'images', clean);
  if (!existsSync(imgPath)) return null;
  return { buffer: readFileSync(imgPath), contentType };
}

function isSafeHttpOrRelativeUrl(url) {
  const clean = String(url || '').trim();
  if (!clean || /[\u0000-\u001f\u007f]/.test(clean)) return false;
  if (clean.startsWith('/') && !clean.startsWith('//')) return true;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeEmbedVideoUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'www.youtube-nocookie.com') {
      return parsed.pathname.startsWith('/embed/');
    }
    if (host === 'player.vimeo.com') {
      return parsed.pathname.startsWith('/video/');
    }
    return false;
  } catch {
    return false;
  }
}

function escapeAttr(val) {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function sanitizeRichHtml(rawHtml) {
  let html = String(rawHtml || '').trim();
  if (!html) return '';

  // Remove dangerous block tags entirely including their inner content
  html = html.replace(/<\s*(script|style|object|embed|svg|math|form|textarea|select|option|button|input)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  html = html.replace(/<\s*(script|style|object|embed|svg|math|form|input|meta|link|base)\b[^>]*\/?>/gi, '');

  // Filter every remaining tag against the allowlist and sanitize attributes
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*)>/g, (full, slash, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(tag)) return '';
    if (slash) return `</${tag}>`;

    if (tag === 'br') return '<br />';

    if (tag === 'a') {
      const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '') : '';
      if (!isSafeHttpOrRelativeUrl(rawHref)) return '<a>';
      return `<a href="${escapeAttr(rawHref)}" target="_blank" rel="noopener noreferrer">`;
    }

    if (tag === 'img') {
      const srcMatch = rawAttrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const altMatch = rawAttrs.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const rawSrc = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? '') : '';
      if (!isSafeHttpOrRelativeUrl(rawSrc)) return '';
      const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? '') : 'Post image';
      return `<img src="${escapeAttr(rawSrc)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
    }

    if (tag === 'iframe') {
      const srcMatch = rawAttrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawSrc = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? '') : '';
      if (!isSafeEmbedVideoUrl(rawSrc)) return '';
      return `<iframe src="${escapeAttr(rawSrc)}" title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    }

    if (tag === 'pre' || tag === 'code') {
      return `<${tag}>`;
    }

    return `<${tag}>`;
  });

  return html.slice(0, 25000);
}

export function stripHtmlToText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildInitialPosts() {
  return [
    {
      id: 'post-activity-2026-01',
      type: 'activity',
      title: 'Community Digital Literacy & Computer Orientation Workshop — Raniganj',
      descriptionHtml:
        '<p>Global Skills &amp; Digital Development Foundation hosted an introductory computer awareness and safe digital services workshop for youth and school students in Raniganj, Araria, Bihar.</p><ul><li>Hands-on basic typing, internet safety, and online citizen services navigation</li><li>Guidance on digital scholarships and government welfare portals</li></ul>',
      images: [
        {
          id: 'seed-computer-lab',
          filename: null,
          originalName: 'computer-lab.jpg',
          contentType: 'image/jpeg',
          size: 0,
          src: '/images/computer-lab.jpg',
        },
        {
          id: 'seed-community-learning',
          filename: null,
          originalName: 'community-learning.jpg',
          contentType: 'image/jpeg',
          size: 0,
          src: '/media/community-learning.jpg',
        },
      ],
      createdAt: '2026-03-04T10:30:00.000Z',
      updatedAt: '2026-03-04T10:30:00.000Z',
    },
    {
      id: 'post-press-2026-01',
      type: 'press',
      title: 'GSDD Foundation Announces Rural Women Skill & Health Outreach Initiative',
      descriptionHtml:
        '<h2>Strengthening Self-Reliance in Araria District</h2><p>GSDD Foundation (Section 8 Non-Profit, CIN: U88900BR2026NPL086114) outlined its community roadmap covering women’s tailoring skills, preventive health awareness, and youth education support across Raniganj and surrounding blocks.</p><blockquote>Empowering people, developing skills, and transforming communities through inclusive participation.</blockquote>',
      images: [
        {
          id: 'seed-women-workshop',
          filename: null,
          originalName: 'women-workshop.jpg',
          contentType: 'image/jpeg',
          size: 0,
          src: '/media/women-workshop.jpg',
        },
        {
          id: 'seed-health-check',
          filename: null,
          originalName: 'health-check.jpg',
          contentType: 'image/jpeg',
          size: 0,
          src: '/images/health-check.jpg',
        },
      ],
      createdAt: '2026-02-26T14:15:00.000Z',
      updatedAt: '2026-02-26T14:15:00.000Z',
    },
  ];
}

function buildInitialNews() {
  return [
    {
      id: 'news-2026-01',
      title: 'Free Digital Skills & Youth Awareness Drive Opens Registration in Raniganj',
      description:
        'Youth and community learners in Araria district can now enquire about upcoming computer basics, cyber hygiene, and career guidance workshops organized by GSDD Foundation.',
      image: {
        id: 'seed-news-1',
        filename: null,
        src: '/media/community-classroom.jpg',
      },
      status: 'active',
      createdAt: '2026-03-05T09:00:00.000Z',
      updatedAt: '2026-03-05T09:00:00.000Z',
    },
    {
      id: 'news-2026-02',
      title: 'Preventive Health & Maternal Hygiene Awareness Camp Summary',
      description:
        'Community volunteers and medical advisors conducted awareness sessions emphasizing clean drinking water, nutrition, and early screening in rural panchayats.',
      image: {
        id: 'seed-news-2',
        filename: null,
        src: '/media/community-health.jpg',
      },
      status: 'active',
      createdAt: '2026-02-20T11:30:00.000Z',
      updatedAt: '2026-02-20T11:30:00.000Z',
    },
    {
      id: 'news-2026-03-draft',
      title: 'Upcoming Women Self-Help Group Tailoring Batch (Draft)',
      description:
        'Draft circular for upcoming women livelihood training schedule and center equipment checklist.',
      image: null,
      status: 'draft',
      createdAt: '2026-03-06T08:00:00.000Z',
      updatedAt: '2026-03-06T08:00:00.000Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Posts CRUD
// ---------------------------------------------------------------------------

export async function listPosts({ filter = 'all' } = {}) {
  const posts = await readJson('posts', buildInitialPosts);
  const cleanFilter = String(filter || 'all').trim().toLowerCase();
  const filtered =
    cleanFilter === 'press' || cleanFilter === 'activity'
      ? posts.filter((p) => p.type === cleanFilter)
      : posts;
  return filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getPostById(id) {
  const posts = await readJson('posts', buildInitialPosts);
  return posts.find((p) => p.id === id) || null;
}

export async function createPost({ type, title, descriptionHtml, imageFiles = [] }) {
  const cleanType = String(type || '').trim().toLowerCase();
  if (!POST_TYPES.includes(cleanType)) {
    return { ok: false, status: 400, error: 'Post type must be Press/Media Post or Activity Post.' };
  }

  const cleanTitle = String(title || '').trim().slice(0, 200);
  if (!cleanTitle) {
    return { ok: false, status: 400, error: 'Post title is required.' };
  }

  const sanitizedHtml = sanitizeRichHtml(descriptionHtml);
  if (!stripHtmlToText(sanitizedHtml)) {
    return { ok: false, status: 400, error: 'Post description is required.' };
  }

  if (imageFiles.length > POST_MAX_IMAGES) {
    return { ok: false, status: 400, error: `Maximum ${POST_MAX_IMAGES} images are allowed per post.` };
  }

  const validated = [];
  for (const file of imageFiles) {
    const check = detectPostImageType(file.buffer, file.filename, file.contentType);
    if (!check.ok) {
      return { ok: false, status: 400, error: check.error };
    }
    validated.push({ ...file, ext: check.ext, contentType: check.contentType });
  }

  const savedImages = [];
  try {
    for (const item of validated) {
      savedImages.push(await savePostImageBuffer(item));
    }
  } catch (err) {
    for (const img of savedImages) await deleteStoredImageFile(img.filename);
    throw err;
  }

  return withLock('posts', async () => {
    const posts = await readJson('posts', buildInitialPosts);
    const now = new Date().toISOString();
    const record = {
      id: `post-${randomUUID().slice(0, 10)}`,
      type: cleanType,
      title: cleanTitle,
      descriptionHtml: sanitizedHtml,
      images: savedImages,
      createdAt: now,
      updatedAt: now,
    };
    posts.unshift(record);
    await writeJson('posts', posts);
    return { ok: true, status: 201, post: record };
  });
}

export async function updatePost(id, { type, title, descriptionHtml, deletedImageIds = [], newImageFiles = [] }) {
  const cleanType = String(type || '').trim().toLowerCase();
  if (!POST_TYPES.includes(cleanType)) {
    return { ok: false, status: 400, error: 'Post type must be Press/Media Post or Activity Post.' };
  }

  const cleanTitle = String(title || '').trim().slice(0, 200);
  if (!cleanTitle) {
    return { ok: false, status: 400, error: 'Post title is required.' };
  }

  const sanitizedHtml = sanitizeRichHtml(descriptionHtml);
  if (!stripHtmlToText(sanitizedHtml)) {
    return { ok: false, status: 400, error: 'Post description is required.' };
  }

  const validatedNew = [];
  for (const file of newImageFiles) {
    const check = detectPostImageType(file.buffer, file.filename, file.contentType);
    if (!check.ok) {
      return { ok: false, status: 400, error: check.error };
    }
    validatedNew.push({ ...file, ext: check.ext, contentType: check.contentType });
  }

  return withLock('posts', async () => {
    const posts = await readJson('posts', buildInitialPosts);
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { ok: false, status: 404, error: 'Post not found.' };
    }

    const current = posts[idx];
    const deleteSet = new Set(Array.isArray(deletedImageIds) ? deletedImageIds.map(String) : []);
    const remainingImages = (current.images || []).filter((img) => !deleteSet.has(img.id));

    if (remainingImages.length + validatedNew.length > POST_MAX_IMAGES) {
      return {
        ok: false,
        status: 400,
        error: `Maximum ${POST_MAX_IMAGES} images total allowed per post (existing + new).`,
      };
    }

    const uploadedNew = [];
    try {
      for (const item of validatedNew) {
        uploadedNew.push(await savePostImageBuffer(item));
      }
    } catch (err) {
      for (const img of uploadedNew) await deleteStoredImageFile(img.filename);
      throw err;
    }

    const removedImages = (current.images || []).filter((img) => deleteSet.has(img.id));
    for (const img of removedImages) {
      if (img.filename) await deleteStoredImageFile(img.filename);
    }

    posts[idx] = {
      ...current,
      type: cleanType,
      title: cleanTitle,
      descriptionHtml: sanitizedHtml,
      images: [...remainingImages, ...uploadedNew],
      updatedAt: new Date().toISOString(),
    };
    await writeJson('posts', posts);
    return { ok: true, status: 200, post: posts[idx] };
  });
}

export async function deletePost(id) {
  return withLock('posts', async () => {
    const posts = await readJson('posts', buildInitialPosts);
    const target = posts.find((p) => p.id === id);
    if (!target) {
      return { ok: false, status: 404, error: 'Post not found.' };
    }

    const next = posts.filter((p) => p.id !== id);
    await writeJson('posts', next);
    for (const img of target.images || []) {
      if (img.filename) await deleteStoredImageFile(img.filename);
    }
    return { ok: true, status: 200, deletedId: id };
  });
}

export async function bulkDeletePosts(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : []).map((v) => String(v || '').trim()).filter(Boolean));
  if (idSet.size === 0) {
    return { ok: false, status: 400, error: 'Select at least one post to delete.' };
  }

  return withLock('posts', async () => {
    const posts = await readJson('posts', buildInitialPosts);
    const removed = posts.filter((p) => idSet.has(p.id));
    if (removed.length === 0) {
      return { ok: false, status: 404, error: 'No matching posts found.' };
    }

    const remaining = posts.filter((p) => !idSet.has(p.id));
    await writeJson('posts', remaining);
    for (const post of removed) {
      for (const img of post.images || []) {
        if (img.filename) await deleteStoredImageFile(img.filename);
      }
    }
    return { ok: true, status: 200, deletedCount: removed.length, deletedIds: removed.map((p) => p.id) };
  });
}

// ---------------------------------------------------------------------------
// News Management CRUD
// ---------------------------------------------------------------------------

export async function listNews({ type = 'all' } = {}) {
  const items = await readJson('news', buildInitialNews);
  const cleanType = String(type || 'all').trim().toLowerCase();
  const filtered =
    cleanType === 'active' || cleanType === 'draft'
      ? items.filter((n) => n.status === cleanType)
      : items;
  return filtered.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createNewsItem({ title, description, status = 'active', imageFile = null }) {
  const cleanTitle = String(title || '').trim().slice(0, 200);
  const cleanDesc = String(description || '').trim().slice(0, 5000);
  const cleanStatus = NEWS_STATUSES.includes(String(status).toLowerCase()) ? String(status).toLowerCase() : 'active';

  if (!cleanTitle || !cleanDesc) {
    return { ok: false, status: 400, error: 'News title and description are required.' };
  }

  let savedImage = null;
  if (imageFile) {
    const check = detectPostImageType(imageFile.buffer, imageFile.filename, imageFile.contentType);
    if (!check.ok) {
      return { ok: false, status: 400, error: check.error };
    }
    savedImage = await savePostImageBuffer({ ...imageFile, ext: check.ext, contentType: check.contentType });
  }

  return withLock('news', async () => {
    const items = await readJson('news', buildInitialNews);
    const now = new Date().toISOString();
    const record = {
      id: `news-${randomUUID().slice(0, 10)}`,
      title: cleanTitle,
      description: cleanDesc,
      image: savedImage,
      status: cleanStatus,
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(record);
    await writeJson('news', items);
    return { ok: true, status: 201, news: record };
  });
}

export async function updateNewsItem(id, { title, description, status, removeImage = false, imageFile = null }) {
  return withLock('news', async () => {
    const items = await readJson('news', buildInitialNews);
    const idx = items.findIndex((n) => n.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'News article not found.' };

    const current = items[idx];
    const cleanTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : current.title;
    const cleanDesc = typeof description === 'string' && description.trim() ? description.trim().slice(0, 5000) : current.description;
    const cleanStatus =
      typeof status === 'string' && NEWS_STATUSES.includes(status.toLowerCase())
        ? status.toLowerCase()
        : current.status;

    let nextImage = current.image || null;
    if (imageFile) {
      const check = detectPostImageType(imageFile.buffer, imageFile.filename, imageFile.contentType);
      if (!check.ok) {
        return { ok: false, status: 400, error: check.error };
      }
      const uploaded = await savePostImageBuffer({ ...imageFile, ext: check.ext, contentType: check.contentType });
      if (current.image?.filename) await deleteStoredImageFile(current.image.filename);
      nextImage = uploaded;
    } else if (removeImage && current.image) {
      if (current.image.filename) await deleteStoredImageFile(current.image.filename);
      nextImage = null;
    }

    items[idx] = {
      ...current,
      title: cleanTitle,
      description: cleanDesc,
      status: cleanStatus,
      image: nextImage,
      updatedAt: new Date().toISOString(),
    };
    await writeJson('news', items);
    return { ok: true, status: 200, news: items[idx] };
  });
}

export async function deleteNewsItems(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : []).map((v) => String(v || '').trim()).filter(Boolean));
  if (idSet.size === 0) {
    return { ok: false, status: 400, error: 'Select at least one news item to delete.' };
  }

  return withLock('news', async () => {
    const items = await readJson('news', buildInitialNews);
    const removed = items.filter((n) => idSet.has(n.id));
    if (removed.length === 0) return { ok: false, status: 404, error: 'News item not found.' };

    const remaining = items.filter((n) => !idSet.has(n.id));
    await writeJson('news', remaining);
    for (const item of removed) {
      if (item.image?.filename) await deleteStoredImageFile(item.image.filename);
    }
    return { ok: true, status: 200, deletedCount: removed.length };
  });
}
