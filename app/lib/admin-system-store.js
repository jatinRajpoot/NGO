// Server-only durable store for Admin Overview metrics, Birthday Wishes,
// Letter Heads, Extended Admin Profile + Photo, and Software Update settings.

import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { cookies } from 'next/headers.js';
import { Storage } from '@google-cloud/storage';
import { listPendingReconciliations } from './portal-store';
import {
  initialCertificates,
  initialDonations,
  initialEnquiries,
  initialMembers,
  initialRecurringDonors,
} from '../admin/sections/data/mock-admin-data';
import {
  PANEL_UNLOCK_COOKIE,
  PANEL_UNLOCK_TTL_SECONDS,
  signPanelUnlockToken,
  verifyPanelUnlockToken,
} from './panel-token';

const scryptAsync = promisify(scryptCb);

export const ADMIN_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

export const SOFTWARE_SECTIONS = [
  'software-data',
  'payment-api',
  'email-data',
  'appointment-data',
  'reset-website',
  'access-settings',
  'license-data',
  'recaptcha-data',
];

const PHOTO_MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const SAFE_PHOTO_NAME = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i;

let cachedBucket = null;
const locks = new Map();

function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.catch(() => {}));
  return next;
}

function getDataDir() {
  const candidates = [
    process.env.ADMIN_SYSTEM_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    path.join(process.cwd(), '.data', 'admin-system'),
    path.join(tmpdir(), 'gsdd-admin-system'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('admin-system') ? dir : path.join(dir, 'admin-system');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      const imgDir = path.join(target, 'images');
      if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });
      return target;
    } catch {}
  }
  const fallback = path.join(tmpdir(), 'gsdd-admin-system');
  if (!existsSync(fallback)) mkdirSync(fallback, { recursive: true });
  return fallback;
}

function getGcsBucket() {
  const bucketName = process.env.GALLERY_BUCKET;
  if (typeof bucketName !== 'string' || bucketName.trim().length === 0) return null;
  try {
    if (!cachedBucket) cachedBucket = new Storage();
    return cachedBucket.bucket(bucketName.trim());
  } catch {
    return null;
  }
}

async function readJson(name, seedFn) {
  const bucket = getGcsBucket();
  if (bucket) {
    const file = bucket.file(`admin-system/${name}.json`);
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
    await bucket.file(`admin-system/${name}.json`).save(payload, {
      contentType: 'application/json',
      resumable: false,
    });
    return;
  }

  const filePath = path.join(getDataDir(), `${name}.json`);
  const temp = `${filePath}.tmp.${randomBytes(6).toString('hex')}`;
  try {
    writeFileSync(temp, payload, 'utf8');
    renameSync(temp, filePath);
  } catch (err) {
    try {
      unlinkSync(temp);
    } catch {}
    throw err;
  }
}

function getSigningSecret() {
  const fromEnv = typeof process.env.ADMIN_SESSION_SECRET === 'string'
    ? process.env.ADMIN_SESSION_SECRET.trim()
    : '';
  return fromEnv.length >= 16 ? fromEnv : null;
}

// ---------------------------------------------------------------------------
// Extended Admin Profile & Photo
// ---------------------------------------------------------------------------

function buildInitialAdminProfile() {
  return {
    name: 'Foundation Administrator',
    designation: 'Super Administrator',
    organization: 'Global Skills & Digital Development Foundation',
    email: 'foundationgsdd@gmail.com',
    phone: '+91 95467 52915',
    address: 'Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, NH 327E, Araria, Bihar',
    cin: 'U88900BR2026NPL086114',
    photoFilename: null,
    photoSrc: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function getExtendedAdminProfile() {
  return readJson('admin-profile', buildInitialAdminProfile);
}

export async function updateExtendedAdminProfile(patch = {}) {
  return withLock('admin-profile', async () => {
    const current = await readJson('admin-profile', buildInitialAdminProfile);
    const pick = (k, max = 180) =>
      typeof patch[k] === 'string' && patch[k].trim()
        ? patch[k].trim().slice(0, max)
        : current[k];

    const next = {
      ...current,
      name: pick('name', 100),
      designation: pick('designation', 100),
      organization: pick('organization', 160),
      email: pick('email', 160),
      phone: pick('phone', 40),
      address: pick('address', 300),
      cin: pick('cin', 60),
      updatedAt: new Date().toISOString(),
    };
    await writeJson('admin-profile', next);
    return next;
  });
}

export function validateAdminPhotoBuffer(buffer, filename = '', declaredMime = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { ok: false, error: 'Image file is empty or invalid.' };
  }
  if (buffer.length > ADMIN_PHOTO_MAX_BYTES) {
    return { ok: false, error: 'Profile photo must be 2 MB or smaller.' };
  }
  const extMatch = String(filename || '').trim().match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  if (!PHOTO_MIME_BY_EXT[ext]) {
    return { ok: false, error: 'Only JPG, PNG, GIF, or WebP photos are allowed.' };
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a';
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

  let detected = null;
  if (isJpeg) detected = ext === 'jpeg' ? 'jpeg' : 'jpg';
  else if (isPng) detected = 'png';
  else if (isGif) detected = 'gif';
  else if (isWebp) detected = 'webp';

  if (!detected) return { ok: false, error: 'File contents do not match a valid image.' };
  const normA = ext === 'jpeg' ? 'jpg' : ext;
  const normB = detected === 'jpeg' ? 'jpg' : detected;
  if (normA !== normB) return { ok: false, error: 'File extension does not match image contents.' };

  const contentType = PHOTO_MIME_BY_EXT[detected];
  const cleanDeclared = String(declaredMime || '').split(';')[0].trim().toLowerCase();
  if (cleanDeclared && cleanDeclared !== 'application/octet-stream') {
    const normMime = cleanDeclared === 'image/jpg' ? 'image/jpeg' : cleanDeclared;
    if (normMime !== contentType) {
      return { ok: false, error: 'Declared MIME type does not match image bytes.' };
    }
  }
  return { ok: true, ext: detected, contentType };
}

export async function saveAdminPhoto({ buffer, filename, contentType }) {
  const check = validateAdminPhotoBuffer(buffer, filename, contentType);
  if (!check.ok) return check;

  const storedName = `admin-avatar-${randomUUID().slice(0, 10)}.${check.ext}`;
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`admin-system/images/${storedName}`).save(buffer, {
      contentType: check.contentType,
      resumable: false,
    });
  } else {
    const filePath = path.join(getDataDir(), 'images', storedName);
    const temp = `${filePath}.tmp.${randomBytes(4).toString('hex')}`;
    writeFileSync(temp, buffer);
    renameSync(temp, filePath);
  }

  return withLock('admin-profile', async () => {
    const current = await readJson('admin-profile', buildInitialAdminProfile);
    if (current.photoFilename) {
      await deletePhotoObject(current.photoFilename);
    }
    const next = {
      ...current,
      photoFilename: storedName,
      photoSrc: `/api/admin/profile/photo/?file=${encodeURIComponent(storedName)}`,
      updatedAt: new Date().toISOString(),
    };
    await writeJson('admin-profile', next);
    return { ok: true, profile: next };
  });
}

async function deletePhotoObject(storedName) {
  if (!storedName || !SAFE_PHOTO_NAME.test(storedName)) return;
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      await bucket.file(`admin-system/images/${storedName}`).delete({ ignoreNotFound: true });
    } catch {}
    return;
  }
  const filePath = path.join(getDataDir(), 'images', storedName);
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch {}
}

export async function removeAdminPhoto() {
  return withLock('admin-profile', async () => {
    const current = await readJson('admin-profile', buildInitialAdminProfile);
    if (current.photoFilename) {
      await deletePhotoObject(current.photoFilename);
    }
    const next = {
      ...current,
      photoFilename: null,
      photoSrc: null,
      updatedAt: new Date().toISOString(),
    };
    await writeJson('admin-profile', next);
    return { ok: true, profile: next };
  });
}

export async function readAdminPhoto(storedName) {
  const clean = String(storedName || '').trim();
  if (!SAFE_PHOTO_NAME.test(clean)) return null;
  const ext = clean.split('.').pop().toLowerCase();
  const contentType = PHOTO_MIME_BY_EXT[ext] || 'image/png';

  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const [buffer] = await bucket.file(`admin-system/images/${clean}`).download();
      return { buffer, contentType };
    } catch {
      return null;
    }
  }
  const filePath = path.join(getDataDir(), 'images', clean);
  if (!existsSync(filePath)) return null;
  return { buffer: readFileSync(filePath), contentType };
}

// ---------------------------------------------------------------------------
// Letter Head CRUD
// ---------------------------------------------------------------------------

function buildInitialLetterHeads() {
  return [
    {
      id: 'lh-2026-001',
      refNo: 'GSDD/LH/2026/001',
      recipientName: 'District Education Officer, Araria',
      date: '2026-03-10',
      email: 'deo-araria@example.gov.in',
      subject: 'Proposal for Rural Digital Literacy & Cyber Safety Workshops in Block Schools',
      address: 'Collectorate Campus, Araria, Bihar - 854311',
      description:
        'Respected Sir/Madam,\n\nGlobal Skills & Digital Development Foundation proposes to organize free one-day Digital Literacy and Safe Internet workshops for senior secondary students across Raniganj and nearby blocks during this academic quarter.\n\nWarm regards,\nAuthorized Signatory\nGlobal Skills & Digital Development Foundation',
      createdAt: '2026-03-10T09:15:00.000Z',
      updatedAt: '2026-03-10T09:15:00.000Z',
    },
    {
      id: 'lh-2026-002',
      refNo: 'GSDD/LH/2026/002',
      recipientName: 'Chief Medical Officer, Community Health Centre Raniganj',
      date: '2026-03-18',
      email: 'chc-raniganj@example.org',
      subject: 'Coordination Request for Preventive Health & Nutrition Screening Camp',
      address: 'CHC Complex, Raniganj, Araria, Bihar - 854334',
      description:
        'Respected Sir/Madam,\n\nWe request collaborative medical supervision and ASHAs orientation support for our upcoming Preventive Health & Women Hygiene Camp scheduled in Raniganj Block.\n\nSincerely,\nGlobal Skills & Digital Development Foundation',
      createdAt: '2026-03-18T11:30:00.000Z',
      updatedAt: '2026-03-18T11:30:00.000Z',
    },
  ];
}

export async function listLetterHeads() {
  const list = await readJson('letterheads', buildInitialLetterHeads);
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createLetterHead(payload = {}) {
  const recipientName = String(payload.recipientName || '').trim().slice(0, 160);
  const date = String(payload.date || '').trim().slice(0, 20) || new Date().toISOString().slice(0, 10);
  const email = String(payload.email || '').trim().slice(0, 160);
  const subject = String(payload.subject || '').trim().slice(0, 240);
  const address = String(payload.address || '').trim().slice(0, 320);
  const description = String(payload.description || '').trim().slice(0, 6000);

  if (!recipientName || !subject || !description) {
    return { ok: false, status: 400, error: 'Recipient name, subject, and letter body are required.' };
  }

  return withLock('letterheads', async () => {
    const items = await readJson('letterheads', buildInitialLetterHeads);
    const seq = String(items.length + 1).padStart(3, '0');
    const year = date.slice(0, 4) || new Date().getFullYear();
    const now = new Date().toISOString();
    const record = {
      id: `lh-${randomUUID().slice(0, 8)}`,
      refNo: String(payload.refNo || `GSDD/LH/${year}/${seq}`).trim().slice(0, 60),
      recipientName,
      date,
      email,
      subject,
      address,
      description,
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(record);
    await writeJson('letterheads', items);
    return { ok: true, status: 201, letterhead: record };
  });
}

export async function updateLetterHead(id, payload = {}) {
  return withLock('letterheads', async () => {
    const items = await readJson('letterheads', buildInitialLetterHeads);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Letter head not found.' };

    const cur = items[idx];
    const next = {
      ...cur,
      refNo: typeof payload.refNo === 'string' && payload.refNo.trim() ? payload.refNo.trim().slice(0, 60) : cur.refNo,
      recipientName: typeof payload.recipientName === 'string' && payload.recipientName.trim()
        ? payload.recipientName.trim().slice(0, 160) : cur.recipientName,
      date: typeof payload.date === 'string' && payload.date.trim() ? payload.date.trim().slice(0, 20) : cur.date,
      email: typeof payload.email === 'string' ? payload.email.trim().slice(0, 160) : cur.email,
      subject: typeof payload.subject === 'string' && payload.subject.trim()
        ? payload.subject.trim().slice(0, 240) : cur.subject,
      address: typeof payload.address === 'string' ? payload.address.trim().slice(0, 320) : cur.address,
      description: typeof payload.description === 'string' && payload.description.trim()
        ? payload.description.trim().slice(0, 6000) : cur.description,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = next;
    await writeJson('letterheads', items);
    return { ok: true, status: 200, letterhead: next };
  });
}

export async function deleteLetterHeadIds(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (idSet.size === 0) return { ok: false, status: 400, error: 'Provide at least one letterhead id.' };

  return withLock('letterheads', async () => {
    const items = await readJson('letterheads', buildInitialLetterHeads);
    const remaining = items.filter((i) => !idSet.has(i.id));
    if (remaining.length === items.length) {
      return { ok: false, status: 404, error: 'No matching letterheads found.' };
    }
    await writeJson('letterheads', remaining);
    return { ok: true, status: 200, deletedCount: items.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Birthday Wishes
// ---------------------------------------------------------------------------

function buildInitialBirthdayRecords() {
  const now = new Date();
  const fmtMmDd = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  const in8Days = new Date(now.getTime() + 8 * 86400000);
  const in14Days = new Date(now.getTime() + 14 * 86400000);

  return [
    {
      id: 'bday-seed-today',
      memberId: 'MEM-2026-001',
      name: 'Rajeshwari Devi',
      mobile: '9835011223',
      email: 'rajeshwari@example.org',
      district: 'Araria, Bihar',
      designation: 'District Coordinator',
      dob: `1992-${fmtMmDd(now)}`,
      lastWishedAt: null,
      lastWishMessage: '',
    },
    {
      id: 'bday-seed-up-1',
      memberId: 'MEM-2026-002',
      name: 'Ankit Kumar Mishra',
      mobile: '9431223344',
      email: 'ankit@example.org',
      district: 'Purnia, Bihar',
      designation: 'Youth Wing Member',
      dob: `1996-${fmtMmDd(in3Days)}`,
      lastWishedAt: null,
      lastWishMessage: '',
    },
    {
      id: 'bday-seed-up-2',
      memberId: 'MEM-2026-003',
      name: 'Farhana Parveen',
      mobile: '9123456789',
      email: 'farhana@example.org',
      district: 'Kishanganj, Bihar',
      designation: 'Active Member',
      dob: `1994-${fmtMmDd(in8Days)}`,
      lastWishedAt: null,
      lastWishMessage: '',
    },
    {
      id: 'bday-seed-up-3',
      memberId: 'MEM-2026-004',
      name: 'Suresh Prasad Verma',
      mobile: '9988776655',
      email: 'suresh@example.org',
      district: 'Katihar, Bihar',
      designation: 'Lifetime Member',
      dob: `1989-${fmtMmDd(in14Days)}`,
      lastWishedAt: null,
      lastWishMessage: '',
    },
  ];
}

function getDaysUntilNextBirthday(dobStr, nowDate = new Date()) {
  const m = String(dobStr || '').match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);

  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  let next = new Date(nowDate.getFullYear(), month, day);
  if (next < today) {
    next = new Date(nowDate.getFullYear() + 1, month, day);
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export async function listBirthdays({ tab = 'upcoming' } = {}) {
  const items = await readJson('birthdays', buildInitialBirthdayRecords);
  const now = new Date();
  const enriched = items
    .map((item) => ({
      ...item,
      daysUntil: getDaysUntilNextBirthday(item.dob, now),
    }))
    .filter((item) => item.daysUntil !== null);

  if (String(tab).toLowerCase() === 'today') {
    return enriched.filter((i) => i.daysUntil === 0);
  }
  return enriched
    .filter((i) => i.daysUntil >= 0 && i.daysUntil <= 45)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function sendBirthdayWish({ id, message }) {
  const cleanId = String(id || '').trim();
  const cleanMsg = String(message || '').trim().slice(0, 600);
  if (!cleanId || !cleanMsg) {
    return { ok: false, status: 400, error: 'Member id and wish message are required.' };
  }

  return withLock('birthdays', async () => {
    const items = await readJson('birthdays', buildInitialBirthdayRecords);
    const idx = items.findIndex((i) => i.id === cleanId);
    if (idx === -1) return { ok: false, status: 404, error: 'Birthday record not found.' };

    items[idx] = {
      ...items[idx],
      lastWishedAt: new Date().toISOString(),
      lastWishMessage: cleanMsg,
    };
    await writeJson('birthdays', items);
    return { ok: true, status: 200, record: items[idx] };
  });
}

// ---------------------------------------------------------------------------
// Software Update Settings & Panel Password Gate
// ---------------------------------------------------------------------------

function buildInitialSoftwareSettings() {
  return {
    panelPasswordHash: null,
    'software-data': {
      orgName: 'Global Skills & Digital Development Foundation',
      shortName: 'GSDD Foundation',
      tagline: 'Empowering People. Developing Skills. Transforming Communities.',
      regNo: 'U88900BR2026NPL086114',
      panNo: 'AAMCG0000A',
      email: 'foundationgsdd@gmail.com',
      phone: '+91 95467 52915',
      websiteUrl: 'https://gsddfoundation.org',
      address: 'Dhak Bangla, Near Maa Ashawaar Mandir, Raniganj, NH 327E, Araria, Bihar - 854334',
      pan80gNote: 'Section 8 Non-Profit Company registered under Companies Act, 2013.',
      footerText: 'Copyright GSDD Foundation. All community contributions are transparently recorded.',
    },
    'payment-api': {
      activeGateway: 'phonepe',
      phonePeEnabled: true,
      phonePeMode: 'sandbox',
      phonePeMerchantId: 'GSDDSANDBOX',
      phonePeSaltIndex: '1',
      razorpayEnabled: true,
      razorpayMode: 'test',
      razorpayKeyId: 'rzp_test_gsddfoundation',
      manualUpiEnabled: true,
      upiId: 'gsddfoundation@upi',
    },
    'email-data': {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpEncryption: 'tls',
      fromName: 'GSDD Foundation Portal',
      fromEmail: 'foundationgsdd@gmail.com',
      replyTo: 'foundationgsdd@gmail.com',
      notificationsEnabled: true,
    },
    'appointment-data': {
      autoApproveLetters: false,
      defaultSignatoryName: 'Authorised Signatory',
      defaultSignatoryTitle: 'Managing Trustee & Director',
      officeLocation: 'Raniganj, Araria, Bihar',
      letterPrefix: 'GSDD/APPT/2026',
      validityMonths: '12',
    },
    'access-settings': {
      allowPublicRegistration: true,
      requireAdminApproval: true,
      allowVisitorDonations: true,
      allowMemberReferrals: true,
      maintenanceMode: false,
      defaultTheme: 'light',
    },
    'license-data': {
      licenseKey: 'NGO-SUITE-GSDD-2026-ENT',
      licenseeName: 'Global Skills & Digital Development Foundation',
      plan: 'NGO Enterprise Full Suite',
      validUntil: '2028-12-31',
      supportEmail: 'support@gsddfoundation.org',
      status: 'Active',
    },
    'recaptcha-data': {
      enabled: false,
      version: 'v3',
      siteKey: '',
      threshold: '0.5',
    },
    lastResetAt: null,
  };
}

function hashSha256(str) {
  return createHash('sha256').update(str, 'utf8').digest();
}

async function verifyScryptHash(password, hashSpec) {
  const parts = String(hashSpec || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, hex] = parts;
  if (!salt || !/^[0-9a-f]{128}$/i.test(hex)) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return expected.length === derived.length && timingSafeEqual(derived, expected);
}

export async function getPanelPasswordStatus() {
  if (typeof process.env.PANEL_PASSWORD_HASH === 'string' && process.env.PANEL_PASSWORD_HASH.includes(':')) {
    return { configured: true, source: 'env' };
  }
  if (typeof process.env.PANEL_PASSWORD === 'string' && process.env.PANEL_PASSWORD.trim().length > 0) {
    return { configured: true, source: 'env' };
  }
  const settings = await readJson('software-settings', buildInitialSoftwareSettings);
  return {
    configured: Boolean(settings.panelPasswordHash),
    source: settings.panelPasswordHash ? 'store' : 'unconfigured',
  };
}

export async function setupOrChangePanelPassword({ currentPassword, newPassword }) {
  const cleanNew = String(newPassword || '');
  if (cleanNew.length < 6 || cleanNew.length > 128) {
    return { ok: false, status: 400, error: 'Panel password must be between 6 and 128 characters.' };
  }

  if (process.env.PANEL_PASSWORD_HASH || process.env.PANEL_PASSWORD) {
    return {
      ok: false,
      status: 400,
      error: 'Panel password is managed by server environment variables.',
    };
  }

  return withLock('software-settings', async () => {
    const settings = await readJson('software-settings', buildInitialSoftwareSettings);
    if (settings.panelPasswordHash) {
      const ok = await verifyScryptHash(String(currentPassword || ''), settings.panelPasswordHash);
      if (!ok) {
        return { ok: false, status: 403, error: 'Current panel password is incorrect.' };
      }
    }
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(cleanNew, salt, 64);
    settings.panelPasswordHash = `${salt}:${derived.toString('hex')}`;
    await writeJson('software-settings', settings);
    return { ok: true, status: 200 };
  });
}

export async function verifyPanelPassword(candidate) {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 256) {
    return false;
  }

  if (typeof process.env.PANEL_PASSWORD_HASH === 'string' && process.env.PANEL_PASSWORD_HASH.includes(':')) {
    return verifyScryptHash(candidate, process.env.PANEL_PASSWORD_HASH.trim());
  }

  if (typeof process.env.PANEL_PASSWORD === 'string' && process.env.PANEL_PASSWORD.trim().length > 0) {
    const a = hashSha256(candidate);
    const b = hashSha256(process.env.PANEL_PASSWORD.trim());
    return timingSafeEqual(a, b);
  }

  const settings = await readJson('software-settings', buildInitialSoftwareSettings);
  if (!settings.panelPasswordHash) return false;
  return verifyScryptHash(candidate, settings.panelPasswordHash);
}

export async function createPanelUnlockCookieValue() {
  const secret = getSigningSecret();
  if (!secret) return null;
  return signPanelUnlockToken(secret, PANEL_UNLOCK_TTL_SECONDS);
}

export async function isPanelUnlocked(request) {
  const secret = getSigningSecret();
  if (!secret) return false;
  let token = '';
  if (request && typeof request.headers?.get === 'function') {
    const rawCookie = request.headers.get('cookie') || '';
    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${PANEL_UNLOCK_COOKIE}=([^;]+)`));
    token = match ? decodeURIComponent(match[1]) : '';
  }
  if (!token) {
    try {
      const store = await cookies();
      token = store.get(PANEL_UNLOCK_COOKIE)?.value || '';
    } catch {}
  }
  if (!token) return false;
  return verifyPanelUnlockToken(token, secret);
}

export async function getSoftwareSettings(section = null) {
  const all = await readJson('software-settings', buildInitialSoftwareSettings);
  const { panelPasswordHash: _hidden, ...publicSafe } = all;
  if (section) {
    return publicSafe[section] ?? null;
  }
  return publicSafe;
}

export async function updateSoftwareSection(section, patch = {}) {
  if (!SOFTWARE_SECTIONS.includes(section) || section === 'reset-website') {
    return { ok: false, status: 400, error: 'Unsupported software settings section.' };
  }

  return withLock('software-settings', async () => {
    const all = await readJson('software-settings', buildInitialSoftwareSettings);
    const current = all[section] || {};
    const sanitizedPatch = {};
    for (const key of Object.keys(current)) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        const val = patch[key];
        if (typeof current[key] === 'boolean') {
          sanitizedPatch[key] = Boolean(val);
        } else {
          sanitizedPatch[key] = String(val ?? '').trim().slice(0, 600);
        }
      }
    }
    all[section] = { ...current, ...sanitizedPatch };
    await writeJson('software-settings', all);
    return { ok: true, status: 200, section, data: all[section] };
  });
}

export async function resetWebsiteSystemData({ confirmationText, targets = [] }) {
  if (String(confirmationText || '').trim().toUpperCase() !== 'RESET GSDD DATA') {
    return { ok: false, status: 400, error: 'Type "RESET GSDD DATA" to confirm reset.' };
  }
  const resetSet = new Set(Array.isArray(targets) ? targets : []);
  if (resetSet.size === 0) {
    return { ok: false, status: 400, error: 'Select at least one data module to reset.' };
  }

  if (resetSet.has('letterheads')) {
    await withLock('letterheads', () => writeJson('letterheads', buildInitialLetterHeads()));
  }
  if (resetSet.has('birthdays')) {
    await withLock('birthdays', () => writeJson('birthdays', buildInitialBirthdayRecords()));
  }
  if (resetSet.has('settings')) {
    await withLock('software-settings', async () => {
      const current = await readJson('software-settings', buildInitialSoftwareSettings);
      const fresh = buildInitialSoftwareSettings();
      fresh.panelPasswordHash = current.panelPasswordHash;
      fresh.lastResetAt = new Date().toISOString();
      await writeJson('software-settings', fresh);
    });
  } else {
    await withLock('software-settings', async () => {
      const current = await readJson('software-settings', buildInitialSoftwareSettings);
      current.lastResetAt = new Date().toISOString();
      await writeJson('software-settings', current);
    });
  }

  return { ok: true, status: 200, resetTargets: Array.from(resetSet), resetAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Overview Analytics & Live Feeds Aggregator
// ---------------------------------------------------------------------------

function readOptionalPortalJson(filename) {
  const dirs = [
    process.env.PORTAL_DATA_DIR,
    path.join(process.cwd(), '.data', 'portal'),
  ].filter(Boolean);
  for (const dir of dirs) {
    try {
      const p = path.join(dir, `${filename}.json`);
      if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
    } catch {}
  }
  return null;
}

const BASELINE_CAMPAIGNS = [
  { id: 'cmp-1', title: 'Rural Digital Literacy Kits 2026', raised: 125000, status: 'Active' },
  { id: 'cmp-2', title: 'Women Self-Help Tailoring Center', raised: 84000, status: 'Active' },
  { id: 'cmp-3', title: 'Mobile Maternal & Nutrition Drive', raised: 62000, status: 'Completed' },
];

const BASELINE_EVENTS = [
  { id: 'evt-1', title: 'Computer Awareness & Youth Workshop — Raniganj', date: '2026-04-15', location: 'Raniganj, Araria', status: 'Upcoming' },
  { id: 'evt-2', title: 'Preventive Health & Hygiene Orientation', date: '2026-04-28', location: 'Araria Block', status: 'Upcoming' },
];

export async function getAdminOverviewData() {
  let pendingReconcile = { donations: [], fees: [], subscriptions: [], totalPending: 0 };
  try {
    pendingReconcile = await listPendingReconciliations();
  } catch {}

  const storedDonations = readOptionalPortalJson('donations');
  const storedMembers = readOptionalPortalJson('members');
  const storedInquiries = readOptionalPortalJson('inquiries');

  const donations = Array.isArray(storedDonations) && storedDonations.length > 0
    ? storedDonations
    : initialDonations;
  const members = Array.isArray(storedMembers) && storedMembers.length > 0
    ? storedMembers
    : initialMembers;
  const inquiries = Array.isArray(storedInquiries) && storedInquiries.length > 0
    ? storedInquiries
    : initialEnquiries;

  const isSuccessStatus = (s) => ['completed', 'paid', 'success', 'verified'].includes(String(s || '').toLowerCase());

  const paidDonations = donations.filter((d) => isSuccessStatus(d.status));
  const totalDonationAmount = paidDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const memberDonations = paidDonations.filter((d) => d.source === 'member' || d.type === 'Member');
  const visitorDonations = paidDonations.filter((d) => d.source === 'visitor' || d.type === 'Visitor');
  const crowdfundingRaised = BASELINE_CAMPAIGNS.reduce((sum, c) => sum + Number(c.raised || 0), 0);
  const membershipFeeTotal = members.reduce((sum, m) => sum + Number(m.feeAmount || m.feePaid || 500), 0);

  const onlineAmt = paidDonations
    .filter((d) => !String(d.mode || d.method || '').toLowerCase().includes('cash'))
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const cashAmt = Math.max(0, totalDonationAmount - onlineAmt);
  const totalSplit = onlineAmt + cashAmt || 1;

  const activeCampaigns = BASELINE_CAMPAIGNS.filter((c) => c.status === 'Active');
  const upcomingEvents = BASELINE_EVENTS.filter((e) => e.status === 'Upcoming');
  const openInquiries = inquiries.filter((i) => !String(i.status || '').toLowerCase().includes('resolved'));

  const monthlySeries = [
    { month: 'Jun', online: 34500, cash: 12000, total: 46500 },
    { month: 'Jul', online: 41200, cash: 14500, total: 55700 },
    { month: 'Aug', online: 38900, cash: 11200, total: 50100 },
    { month: 'Sep', online: 52400, cash: 16800, total: 69200 },
    { month: 'Oct', online: 61500, cash: 19400, total: 80900 },
    { month: 'Nov', online: Math.max(48000, onlineAmt), cash: Math.max(15000, cashAmt), total: Math.max(63000, totalDonationAmount) },
  ];

  const recentMembers = members.slice(0, 6).map((m, i) => ({
    id: m.id || `mem-${i + 1}`,
    name: m.name || m.fullName || 'Foundation Member',
    district: m.district || 'Araria, Bihar',
    status: m.status || 'Active',
    joinedAt: m.joinedAt || m.createdAt || '2026-03-01',
  }));

  const recentActivity = [
    ...paidDonations.slice(0, 3).map((d, idx) => ({
      id: `act-don-${d.id || idx}`,
      kind: 'donation',
      title: `Donation of Rs. ${Number(d.amount || 0).toLocaleString('en-IN')} received`,
      subtitle: `${d.donorName || d.donor || 'Supporter'} • ${d.mode || d.method || 'Online'}`,
      timestamp: d.date || d.createdAt || new Date().toISOString(),
    })),
    ...recentMembers.slice(0, 2).map((m, idx) => ({
      id: `act-mem-${m.id || idx}`,
      kind: 'member',
      title: `Member enrolled: ${m.name}`,
      subtitle: `${m.district} • ${m.status}`,
      timestamp: m.joinedAt,
    })),
    ...upcomingEvents.slice(0, 2).map((ev, idx) => ({
      id: `act-evt-${ev.id || idx}`,
      kind: 'event',
      title: `Upcoming Event: ${ev.title}`,
      subtitle: `${ev.date || 'Scheduled'} • ${ev.location || 'Araria, Bihar'}`,
      timestamp: ev.date || new Date().toISOString(),
    })),
  ];

  return {
    kpis: {
      totalMembers: { count: members.length, monthlyGrowth: '+14%' },
      totalDonations: { amount: totalDonationAmount, count: paidDonations.length, monthlyTotal: Math.round(totalDonationAmount * 0.38) },
      activeCampaigns: { count: activeCampaigns.length, totalRaised: crowdfundingRaised },
      upcomingEvents: { count: upcomingEvents.length },
      beneficiaries: { count: 148, activeCount: 112 },
      activeInterns: { count: 18, certificatesIssued: initialCertificates.length },
      totalMembershipFee: { amount: membershipFeeTotal },
      totalMemberDonation: { amount: memberDonations.reduce((s, d) => s + Number(d.amount || 0), 0), count: memberDonations.length },
      totalVisitorDonation: { amount: visitorDonations.reduce((s, d) => s + Number(d.amount || 0), 0), count: visitorDonations.length },
      totalCrowdfundingDonation: { amount: crowdfundingRaised },
    },
    monthlyDonations: monthlySeries,
    paymentBreakdown: {
      onlineAmount: onlineAmt,
      cashAmount: cashAmt,
      onlinePercent: Math.round((onlineAmt / totalSplit) * 100),
      cashPercent: 100 - Math.round((onlineAmt / totalSplit) * 100),
    },
    quickStats: {
      activeMembersLast30Days: Math.max(1, members.filter((m) => m.status === 'Active').length),
      approvedIds: members.filter((m) => m.status === 'Active').length,
      pendingIds: members.filter((m) => m.status !== 'Active').length,
      expenseThisMonth: 38450,
      monthlyBudget: 75000,
      activeProjects: 4,
      completedProjects: 2,
      pendingEnquiries: openInquiries.length,
      pendingComplaints: 3,
      pendingReconciliations: pendingReconcile.totalPending || initialRecurringDonors.length,
    },
    recentMembers,
    recentActivity,
  };
}
