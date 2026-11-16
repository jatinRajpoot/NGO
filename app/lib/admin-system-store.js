import { createJsonStore } from './json-store';
// Server-only durable store for Admin Overview metrics, Birthday Wishes,
// Letter Heads, Extended Admin Profile + Photo, and Software Update settings.

import { createHash, randomBytes, randomUUID, timingSafeEqual, scrypt as scryptCb } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { cookies } from 'next/headers.js';
import { Storage } from '@google-cloud/storage';
import { listPendingReconciliations, memberAccountStore, readPortalRecords } from './portal-store';
import { listFinanceDonations, listCampaigns } from './finance-store';
import { listBeneficiaries, listComplaints, listEnquiries } from './support-store';
import { listEvents, listInternshipApps, listExpenses, listProjects } from './operations-store';

import { PANEL_UNLOCK_COOKIE, PANEL_UNLOCK_TTL_SECONDS, signPanelUnlockToken, verifyPanelUnlockToken } from './panel-token';

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
const collectionStore = createJsonStore({ prefix: 'admin-system', getBucket: getGcsBucket, getDirectory: getDataDir });
const withLock = collectionStore.run;

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

const readJson = collectionStore.read;
const writeJson = collectionStore.write;

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

export async function getAdminOverviewData() {
  const [allMembers, allDonations, campaigns, events, beneficiaries, interns, expenses, projects, inquiries, complaints, fees, pending] = await Promise.all([
    memberAccountStore.read(), listFinanceDonations(), listCampaigns(), listEvents(), listBeneficiaries(), listInternshipApps(),
    listExpenses(), listProjects(), listEnquiries(), listComplaints(), readPortalRecords('fee-payments'), listPendingReconciliations(),
  ]);
  const members = allMembers.filter(m => !m.isDemoAccount && !m.isDemoRecord);
  const donations = allDonations.filter(d => !d.isSandbox && !d.isDemoRecord && !d.isDemoSample && ['success', 'verified', 'paid', 'completed'].includes(String(d.status).toLowerCase()));
  const sum = rows => rows.reduce((total, row) => total + Number(row.amount || 0), 0);
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const timestamp = row => Date.parse(row.createdAt || row.joinedAt || row.joinDate || row.date || '');
  const isCash = row => String(row.method || row.mode || '').toLowerCase().includes('cash');
  const monthlyDonations = Array.from({ length: 6 }, (_, index) => {
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1);
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 4 + index, 1);
    const rows = donations.filter(d => timestamp(d) >= start && timestamp(d) < end);
    const cash = sum(rows.filter(isCash));
    const total = sum(rows);
    return { month: new Date(start).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), online: total - cash, cash, total };
  });
  const total = sum(donations);
  const cash = sum(donations.filter(isCash));
  const online = total - cash;
  const activeCampaigns = campaigns.filter(c => c.status === 'Active');
  const raised = campaigns.reduce((total, c) => total + Number(c.raisedAmount || 0), 0);
  const upcoming = events.filter(e => ['Upcoming', 'Active'].includes(e.status) && Date.parse(e.date || e.startDate) >= now.getTime());
  const memberDonations = donations.filter(d => d.source === 'member');
  const visitorDonations = donations.filter(d => ['visitor', 'donor'].includes(d.source));
  const previousMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  const joinedThisMonth = members.filter(m => timestamp(m) >= monthStart).length;
  const joinedPreviously = members.filter(m => timestamp(m) >= previousMonth && timestamp(m) < monthStart).length;
  const recentMembers = [...members].sort((a, b) => timestamp(b) - timestamp(a)).slice(0, 6).map(m => ({ id: m.id, name: m.name, district: m.district || '', status: m.accountStatus || m.status, joinedAt: m.joinedAt || m.joinDate || m.createdAt }));
  const recentActivity = [
    ...donations.map(d => ({ id: `don-${d.id}`, kind: 'donation', title: `Donation of Rs. ${Number(d.amount).toLocaleString('en-IN')} received`, subtitle: d.donorName, timestamp: d.createdAt || d.date })),
    ...recentMembers.map(m => ({ id: `mem-${m.id}`, kind: 'member', title: `Member enrolled: ${m.name}`, subtitle: m.district, timestamp: m.joinedAt })),
  ].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 7);
  return {
    kpis: {
      totalMembers: { count: members.length, monthlyGrowth: joinedPreviously ? `${Math.round((joinedThisMonth - joinedPreviously) / joinedPreviously * 100)}%` : 'No prior month' },
      totalDonations: { amount: total, count: donations.length, monthlyTotal: sum(donations.filter(d => timestamp(d) >= monthStart)) },
      activeCampaigns: { count: activeCampaigns.length, totalRaised: raised }, upcomingEvents: { count: upcoming.length },
      beneficiaries: { count: beneficiaries.length, activeCount: beneficiaries.filter(b => b.status === 'Active').length },
      activeInterns: { count: interns.filter(i => i.status === 'Approved').length, certificatesIssued: interns.filter(i => i.status === 'Approved' && i.certificateId).length },
      totalMembershipFee: { amount: sum(fees.filter(f => f.status === 'Verified')) },
      totalMemberDonation: { amount: sum(memberDonations), count: memberDonations.length },
      totalVisitorDonation: { amount: sum(visitorDonations), count: visitorDonations.length },
      totalCrowdfundingDonation: { amount: sum(donations.filter(d => d.source === 'campaign' || d.campaignId)) },
    },
    monthlyDonations,
    paymentBreakdown: { onlineAmount: online, cashAmount: cash, onlinePercent: total ? Math.round(online / total * 100) : 0, cashPercent: total ? 100 - Math.round(online / total * 100) : 0 },
    quickStats: {
      activeMembersLast30Days: members.filter(m => m.status === 'Active' && timestamp(m) >= now.getTime() - 30 * 86400000).length,
      approvedIds: members.filter(m => m.status === 'Active').length, pendingIds: members.filter(m => m.status !== 'Active').length,
      expenseThisMonth: sum(expenses.filter(e => timestamp(e) >= monthStart)), monthlyBudget: projects.reduce((s, p) => s + Number(p.goalAmount || 0), 0),
      activeProjects: projects.filter(p => p.status === 'Active').length, completedProjects: projects.filter(p => p.status === 'Completed').length,
      pendingEnquiries: inquiries.filter(i => i.status === 'new').length, pendingComplaints: complaints.filter(c => !['Resolved', 'Rejected'].includes(c.status)).length,
      pendingReconciliations: pending.pendingDonations.length + pending.pendingFeePayments.length + pending.pendingCertificates.length,
    }, recentMembers, recentActivity,
  };
}
