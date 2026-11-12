// Server-only durable store for Extended Membership Management, Designations,
// Multi-select Notices, Certificates + Templates, Management Body, Member Portal Extensions,
// and Public Directories / Forgot Password.

import { randomBytes, randomUUID, scrypt as scryptCb } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { Storage } from '@google-cloud/storage';

const scryptAsync = promisify(scryptCb);

export const MEMBER_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const SAFE_PHOTO_NAME = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i;
const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

export const CERTIFICATE_DESIGNS = [
  'Classic Navy Emblem',
  'Royal Gold Seal',
  'Modern Minimal Crest',
];

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
    process.env.MEMBERSHIP_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'membership-suite'),
    path.join(tmpdir(), 'gsdd-membership-suite'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('membership-suite') ? dir : path.join(dir, 'membership-suite');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      const photoDir = path.join(target, 'photos');
      if (!existsSync(photoDir)) mkdirSync(photoDir, { recursive: true });
      return target;
    } catch {}
  }
  const fallback = path.join(tmpdir(), 'gsdd-membership-suite');
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
    const file = bucket.file(`membership-suite/${name}.json`);
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
    await bucket.file(`membership-suite/${name}.json`).save(payload, {
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

export function toCsv(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
}

function maskAadhaar(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 4) return '';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function validatePhotoBuffer(buffer, filename = '', declaredMime = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return { ok: false, error: 'Empty or invalid photo.' };
  if (buffer.length > MEMBER_PHOTO_MAX_BYTES) return { ok: false, error: 'Profile photo must be 2 MB or smaller.' };

  const m = String(filename || '').trim().match(/\.([a-z0-9]+)$/i);
  const ext = m ? m[1].toLowerCase() : '';
  if (!MIME_BY_EXT[ext]) return { ok: false, error: 'Only JPG, PNG, GIF, or WebP photos allowed.' };

  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a';
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

  let detected = null;
  if (isJpg) detected = ext === 'jpeg' ? 'jpeg' : 'jpg';
  else if (isPng) detected = 'png';
  else if (isGif) detected = 'gif';
  else if (isWebp) detected = 'webp';

  if (!detected) return { ok: false, error: 'File contents do not match an image.' };
  const norm = (x) => (x === 'jpeg' ? 'jpg' : x);
  if (norm(ext) !== norm(detected)) return { ok: false, error: 'Extension does not match image content.' };

  const contentType = MIME_BY_EXT[detected];
  const cleanMime = String(declaredMime || '').split(';')[0].trim().toLowerCase();
  if (cleanMime && cleanMime !== 'application/octet-stream') {
    const normMime = cleanMime === 'image/jpg' ? 'image/jpeg' : cleanMime;
    if (normMime !== contentType) return { ok: false, error: 'Declared MIME mismatches bytes.' };
  }
  return { ok: true, ext: detected, contentType };
}

export async function saveMemberPhoto({ buffer, filename, contentType }) {
  const check = validatePhotoBuffer(buffer, filename, contentType);
  if (!check.ok) return check;
  const stored = `mem-photo-${randomUUID().slice(0, 10)}.${check.ext}`;
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`membership-suite/photos/${stored}`).save(buffer, { contentType: check.contentType, resumable: false });
  } else {
    const filePath = path.join(getDataDir(), 'photos', stored);
    const temp = `${filePath}.tmp.${randomBytes(4).toString('hex')}`;
    writeFileSync(temp, buffer);
    renameSync(temp, filePath);
  }
  return { ok: true, filename: stored, src: `/api/members/photo/${stored}/` };
}

export async function readMemberPhoto(filename) {
  const clean = String(filename || '').trim();
  if (!SAFE_PHOTO_NAME.test(clean)) return null;
  const ext = clean.split('.').pop().toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'image/png';
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const [buffer] = await bucket.file(`membership-suite/photos/${clean}`).download();
      return { buffer, contentType };
    } catch {
      return null;
    }
  }
  const filePath = path.join(getDataDir(), 'photos', clean);
  if (!existsSync(filePath)) return null;
  return { buffer: readFileSync(filePath), contentType };
}

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

function buildInitialMembersExt() {
  return [
    {
      id: 'ext-mem-001',
      regNo: 'NGO-2026-0032',
      name: 'Sahanur Alom',
      email: 'sahanur@example.org',
      mobile: '9835011221',
      gender: 'Male',
      maritalStatus: 'Married',
      bloodGroup: 'O+',
      category: 'General',
      occupation: 'Social Educator',
      aadhaarMasked: 'XXXX-XXXX-4411',
      state: 'Bihar',
      district: 'Araria',
      address: 'Raniganj Bazar, Araria, Bihar',
      designation: 'Active Member',
      addedBy: 'Self Registration',
      membershipFee: 500,
      paymentMode: 'Online Payment Gateway',
      paymentStatus: 'Paid',
      accountStatus: 'Active',
      verified: true,
      referralCode: 'NGO-2026-0032',
      referredByCode: '',
      referredDonationsTotal: 4500,
      photoSrc: null,
      joinedAt: '2026-01-20',
      receiptNo: 'GSDD-MEM-RCP-0032',
    },
    {
      id: 'ext-mem-002',
      regNo: 'NGO-2026-0033',
      name: 'Neha Kumari',
      email: 'neha.k@example.org',
      mobile: '9431209988',
      gender: 'Female',
      maritalStatus: 'Single',
      bloodGroup: 'A+',
      category: 'OBC',
      occupation: 'Trainer',
      aadhaarMasked: 'XXXX-XXXX-8892',
      state: 'Bihar',
      district: 'Purnia',
      address: 'Kasba Block, Purnia',
      designation: 'Youth Coordinator',
      addedBy: 'NGO-2026-0032',
      membershipFee: 500,
      paymentMode: 'Cash/UPI Received by Admin',
      paymentStatus: 'Paid',
      accountStatus: 'Active',
      verified: true,
      referralCode: 'NGO-2026-0033',
      referredByCode: 'NGO-2026-0032',
      referredDonationsTotal: 1500,
      photoSrc: null,
      joinedAt: '2026-02-05',
      receiptNo: 'GSDD-MEM-RCP-0033',
    },
    {
      id: 'ext-mem-003',
      regNo: 'NGO-2026-0034',
      name: 'Vikram Singh',
      email: 'vikram.s@example.org',
      mobile: '9123498711',
      gender: 'Male',
      maritalStatus: 'Single',
      bloodGroup: 'B+',
      category: 'General',
      occupation: 'Student',
      aadhaarMasked: 'XXXX-XXXX-2219',
      state: 'Bihar',
      district: 'Katihar',
      address: 'Barsoi, Katihar',
      designation: 'General Member',
      addedBy: 'NGO-2026-0032',
      membershipFee: 500,
      paymentMode: 'Online Payment Gateway',
      paymentStatus: 'Pending',
      accountStatus: 'Pending',
      verified: false,
      referralCode: 'NGO-2026-0034',
      referredByCode: 'NGO-2026-0032',
      referredDonationsTotal: 0,
      photoSrc: null,
      joinedAt: '2026-03-14',
      receiptNo: 'GSDD-MEM-RCP-0034',
    },
  ];
}

function buildInitialDesignations() {
  return [
    {
      id: 'des-1',
      title: 'General Member',
      feeRs: 500,
      validityYears: 1,
      renewalFeeRs: 300,
      benefitsSummary: 'Digital ID Card, Membership Certificate & Portal Access',
      status: 1,
    },
    {
      id: 'des-2',
      title: 'Lifetime Patron',
      feeRs: 11000,
      validityYears: 99,
      renewalFeeRs: 0,
      benefitsSummary: 'Lifetime Certificate, Patron Recognition & AGM Invite',
      status: 1,
    },
    {
      id: 'des-3',
      title: 'District Coordinator',
      feeRs: 2500,
      validityYears: 2,
      renewalFeeRs: 1500,
      benefitsSummary: 'Appointment Letter, Coordinator Collection Portal & Event Authority',
      status: 1,
    },
    {
      id: 'des-4',
      title: 'Legacy Associate (Archived)',
      feeRs: 250,
      validityYears: 1,
      renewalFeeRs: 250,
      benefitsSummary: 'Archived tier',
      status: 0,
    },
  ];
}

function buildInitialNotices() {
  return [
    {
      id: 'not-101',
      title: 'Q2 Community Digital Literacy Volunteer Briefing',
      message: 'All active district members are requested to review workshop schedules before April 10.',
      recipientIds: ['all'],
      recipientNames: ['All Members'],
      sentAt: '2026-03-12T10:00:00.000Z',
    },
    {
      id: 'not-102',
      title: 'ID Card & Appointment Letter Renewal Reminder',
      message: 'Members whose 1-year validity completes soon may renew under My Profile.',
      recipientIds: ['ext-mem-001', 'ext-mem-002'],
      recipientNames: ['Sahanur Alom', 'Neha Kumari'],
      sentAt: '2026-03-15T14:30:00.000Z',
    },
  ];
}

function buildInitialCertificatesExt() {
  return [
    {
      id: 'cert-ext-1',
      certNo: 'GSDD-CERT-2026-001',
      kind: 'Member',
      recipientName: 'Sahanur Alom',
      memberRegNo: 'NGO-2026-0032',
      program: 'Active Foundation Membership',
      design: 'Classic Navy Emblem',
      issuedBy: 'Rajkumar Maurya (Admin)',
      status: 'Active',
      issuedDate: '2026-01-22',
    },
    {
      id: 'cert-ext-2',
      certNo: 'GSDD-VIS-2026-010',
      kind: 'Visitor',
      recipientName: 'Dr. Kavita Roy',
      memberRegNo: '',
      program: 'Digital Literacy Seminar Appreciation',
      design: 'Royal Gold Seal',
      issuedBy: 'Foundation Secretary',
      status: 'Active',
      issuedDate: '2026-03-04',
    },
  ];
}

function buildInitialManagementBody() {
  return [
    {
      id: 'mgmt-1',
      name: 'Rajkumar Maurya',
      designation: 'Director & Managing Trustee',
      about: 'Oversees foundation governance, rural skill labs, and transparency compliance across Bihar.',
      displayOrder: 1,
      status: 'Active',
    },
    {
      id: 'mgmt-2',
      name: 'Sunita Devi',
      designation: 'Vice President (Women Empowerment)',
      about: 'Leads rural SHG tailoring initiatives and maternal health awareness workshops.',
      displayOrder: 2,
      status: 'Active',
    },
    {
      id: 'mgmt-3',
      name: 'Dr. Ramesh Kumar Sharma',
      designation: 'Chief Medical Patron',
      about: 'Provides advisory guidance for preventive health camps and nutrition drives.',
      displayOrder: 3,
      status: 'Active',
    },
  ];
}

// ---------------------------------------------------------------------------
// Extended Members CRUD
// ---------------------------------------------------------------------------

function enrichMemberReferrals(items) {
  const refCountMap = new Map();
  for (const m of items) {
    const ref = String(m.referredByCode || '').trim().toUpperCase();
    if (ref) refCountMap.set(ref, (refCountMap.get(ref) || 0) + 1);
  }
  return items.map((m) => ({
    ...m,
    referredCount: refCountMap.get(String(m.referralCode || m.regNo || '').toUpperCase()) || 0,
  }));
}

export async function listExtendedMembers({ tab = 'all', search = '' } = {}) {
  const raw = await readJson('members-ext', buildInitialMembersExt);
  const items = enrichMemberReferrals(raw);
  const t = String(tab || 'all').toLowerCase();
  const q = String(search || '').trim().toLowerCase();

  return items.filter((m) => {
    if (t === 'inactive' && m.accountStatus !== 'Pending') return false;
    if (t === 'active' && m.accountStatus !== 'Active') return false;
    if (t === 'blocked' && m.accountStatus !== 'Blocked') return false;
    if (q) {
      const hay = `${m.regNo} ${m.name} ${m.email} ${m.mobile} ${m.district} ${m.designation}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getPublicGeneralMembers({ q = '', verify = '' } = {}) {
  const raw = await readJson('members-ext', buildInitialMembersExt);
  const activeOnly = raw.filter((m) => m.accountStatus === 'Active');

  if (verify.trim()) {
    const clean = verify.trim().toLowerCase();
    const hit = activeOnly.find(
      (m) => m.regNo.toLowerCase() === clean || m.name.toLowerCase() === clean
    );
    return hit
      ? {
          found: true,
          member: {
            regNo: hit.regNo,
            name: hit.name,
            designation: hit.designation,
            district: hit.district,
            state: hit.state,
            status: hit.accountStatus,
            verified: Boolean(hit.verified),
            joinedAt: hit.joinedAt,
            photoSrc: hit.photoSrc,
          },
        }
      : { found: false };
  }

  const s = String(q || '').trim().toLowerCase();
  return activeOnly
    .filter((m) => !s || `${m.regNo} ${m.name} ${m.district} ${m.state} ${m.designation}`.toLowerCase().includes(s))
    .map((m) => ({
      id: m.id,
      regNo: m.regNo,
      name: m.name,
      designation: m.designation,
      district: m.district,
      state: m.state,
      joinedAt: m.joinedAt,
      photoSrc: m.photoSrc,
    }));
}

export async function createExtendedMember(payload = {}, { isPublicApply = false, photoFile = null } = {}) {
  const name = String(payload.name || '').trim().slice(0, 140);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const mobile = String(payload.mobile || payload.phone || '').trim().slice(0, 24);
  if (!name || !email || !mobile) {
    return { ok: false, status: 400, error: 'Name, email, and mobile number are required.' };
  }

  let photoSrc = null;
  if (photoFile) {
    const saved = await saveMemberPhoto(photoFile);
    if (!saved.ok) return { ok: false, status: 400, error: saved.error };
    photoSrc = saved.src;
  }

  let passwordHash = null;
  if (typeof payload.password === 'string' && payload.password.length >= 6) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(payload.password, salt, 64);
    passwordHash = `${salt}:${derived.toString('hex')}`;
  }

  return withLock('members-ext', async () => {
    const list = await readJson('members-ext', buildInitialMembersExt);
    if (list.some((m) => m.email.toLowerCase() === email)) {
      return { ok: false, status: 409, error: 'A member with this email already exists.' };
    }
    const seq = String(32 + list.length).padStart(4, '0');
    const regNo = `NGO-${new Date().getFullYear()}-${seq}`;
    const refBy = String(payload.referredByCode || payload.referralCode || '').trim().toUpperCase().slice(0, 32);

    const rec = {
      id: `ext-mem-${randomUUID().slice(0, 8)}`,
      regNo,
      name,
      email,
      mobile,
      gender: String(payload.gender || 'Male').trim().slice(0, 24),
      maritalStatus: String(payload.maritalStatus || 'Single').trim().slice(0, 24),
      bloodGroup: String(payload.bloodGroup || '').trim().slice(0, 12),
      category: String(payload.category || 'General').trim().slice(0, 40),
      occupation: String(payload.occupation || '').trim().slice(0, 80),
      aadhaarMasked: maskAadhaar(payload.aadhaar || payload.aadhaarNumber || ''),
      state: String(payload.state || 'Bihar').trim().slice(0, 80),
      district: String(payload.district || 'Araria').trim().slice(0, 80),
      address: String(payload.address || '').trim().slice(0, 260),
      designation: String(payload.designation || 'General Member').trim().slice(0, 100),
      addedBy: refBy || (isPublicApply ? 'Self Application' : 'Admin Office'),
      membershipFee: Math.max(0, Number(payload.membershipFee ?? 500)),
      paymentMode: String(payload.paymentMode || 'Online Payment Gateway').slice(0, 60),
      paymentStatus: payload.paymentMode === 'Free Membership' ? 'Free' : payload.paymentStatus || (isPublicApply ? 'Pending' : 'Paid'),
      accountStatus: isPublicApply
        ? 'Pending'
        : ['Pending', 'Active', 'Blocked'].includes(payload.accountStatus)
        ? payload.accountStatus
        : 'Active',
      verified: !isPublicApply,
      referralCode: regNo,
      referredByCode: refBy,
      referredDonationsTotal: 0,
      photoSrc,
      joinedAt: new Date().toISOString().slice(0, 10),
      receiptNo: `GSDD-MEM-RCP-${seq}`,
      passwordHash,
    };
    list.unshift(rec);
    await writeJson('members-ext', list);
    const { passwordHash: _pw, ...safe } = rec;
    return { ok: true, status: 201, member: safe };
  });
}

export async function updateExtendedMember(id, patch = {}) {
  return withLock('members-ext', async () => {
    const list = await readJson('members-ext', buildInitialMembersExt);
    const idx = list.findIndex((m) => m.id === id || m.regNo === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Member not found.' };
    const cur = list[idx];

    list[idx] = {
      ...cur,
      name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 140) : cur.name,
      gender: typeof patch.gender === 'string' ? patch.gender.slice(0, 24) : cur.gender,
      maritalStatus: typeof patch.maritalStatus === 'string' ? patch.maritalStatus.slice(0, 24) : cur.maritalStatus,
      bloodGroup: typeof patch.bloodGroup === 'string' ? patch.bloodGroup.slice(0, 12) : cur.bloodGroup,
      category: typeof patch.category === 'string' ? patch.category.slice(0, 40) : cur.category,
      occupation: typeof patch.occupation === 'string' ? patch.occupation.slice(0, 80) : cur.occupation,
      state: typeof patch.state === 'string' ? patch.state.slice(0, 80) : cur.state,
      district: typeof patch.district === 'string' ? patch.district.slice(0, 80) : cur.district,
      designation: typeof patch.designation === 'string' && patch.designation.trim() ? patch.designation.trim().slice(0, 100) : cur.designation,
      paymentMode: typeof patch.paymentMode === 'string' && patch.paymentMode ? patch.paymentMode : cur.paymentMode,
      paymentStatus: typeof patch.paymentStatus === 'string' && patch.paymentStatus ? patch.paymentStatus : cur.paymentStatus,
      accountStatus: ['Pending', 'Active', 'Blocked'].includes(patch.accountStatus) ? patch.accountStatus : cur.accountStatus,
      verified: typeof patch.verified === 'boolean' ? patch.verified : cur.verified,
    };
    await writeJson('members-ext', list);
    const { passwordHash: _pw, ...safe } = list[idx];
    return { ok: true, status: 200, member: safe };
  });
}

export async function deleteExtendedMembers(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select member(s) to delete.' };
  return withLock('members-ext', async () => {
    const list = await readJson('members-ext', buildInitialMembersExt);
    const remaining = list.filter((m) => !idSet.has(m.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Member not found.' };
    await writeJson('members-ext', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Designations CRUD
// ---------------------------------------------------------------------------

export async function listDesignations({ status = 'all' } = {}) {
  const items = await readJson('designations', buildInitialDesignations);
  if (String(status) === '1' || String(status).toLowerCase() === 'active') return items.filter((d) => Number(d.status) === 1);
  if (String(status) === '0' || String(status).toLowerCase() === 'inactive') return items.filter((d) => Number(d.status) === 0);
  return items;
}

export async function upsertDesignation(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 100);
  if (!title) return { ok: false, status: 400, error: 'Designation title is required.' };
  return withLock('designations', async () => {
    const list = await readJson('designations', buildInitialDesignations);
    const rec = {
      id: payload.id || `des-${randomUUID().slice(0, 8)}`,
      title,
      feeRs: Math.max(0, Number(payload.feeRs ?? 0)),
      validityYears: Math.max(1, Number(payload.validityYears ?? 1)),
      renewalFeeRs: Math.max(0, Number(payload.renewalFeeRs ?? 0)),
      benefitsSummary: String(payload.benefitsSummary || '').trim().slice(0, 400),
      status: Number(payload.status) === 0 ? 0 : 1,
    };
    const idx = payload.id ? list.findIndex((d) => d.id === payload.id) : -1;
    if (idx >= 0) list[idx] = rec;
    else list.unshift(rec);
    await writeJson('designations', list);
    return { ok: true, status: idx >= 0 ? 200 : 201, designation: rec };
  });
}

export async function deleteDesignations(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select designation(s) to delete.' };
  return withLock('designations', async () => {
    const list = await readJson('designations', buildInitialDesignations);
    const remaining = list.filter((d) => !idSet.has(d.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Designation not found.' };
    await writeJson('designations', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Multi-Select Notices CRUD
// ---------------------------------------------------------------------------

export async function listNotices({ memberId = null } = {}) {
  const list = await readJson('notices', buildInitialNotices);
  const sorted = list.sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
  if (!memberId) return sorted;
  return sorted.filter(
    (n) => (n.recipientIds || []).includes('all') || (n.recipientIds || []).includes(memberId)
  );
}

export async function createNotice({ title, message, recipientIds = [], recipientNames = [] }) {
  const cleanTitle = String(title || '').trim().slice(0, 180);
  const cleanMsg = String(message || '').trim().slice(0, 3000);
  if (!cleanTitle || !cleanMsg) return { ok: false, status: 400, error: 'Notice title and message are required.' };

  const cleanIds = Array.isArray(recipientIds) && recipientIds.length > 0 ? recipientIds : ['all'];
  const cleanNames = Array.isArray(recipientNames) && recipientNames.length > 0 ? recipientNames : ['All Members'];

  return withLock('notices', async () => {
    const list = await readJson('notices', buildInitialNotices);
    const rec = {
      id: `not-${randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      message: cleanMsg,
      recipientIds: cleanIds,
      recipientNames: cleanNames,
      sentAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('notices', list);
    return { ok: true, status: 201, notice: rec };
  });
}

export async function deleteNotices(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select notice(s) to delete.' };
  return withLock('notices', async () => {
    const list = await readJson('notices', buildInitialNotices);
    const remaining = list.filter((n) => !idSet.has(n.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Notice not found.' };
    await writeJson('notices', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Extended Certificates & Design Templates (Member & Visitor)
// ---------------------------------------------------------------------------

export async function listCertificatesExt({ kind = 'all', status = 'all' } = {}) {
  const list = await readJson('certificates-ext', buildInitialCertificatesExt);
  return list.filter((c) => {
    if (kind !== 'all' && String(c.kind).toLowerCase() !== String(kind).toLowerCase()) return false;
    if (status !== 'all' && String(c.status).toLowerCase() !== String(status).toLowerCase()) return false;
    return true;
  });
}

export async function issueCertificateExt(payload = {}) {
  const recipientName = String(payload.recipientName || '').trim().slice(0, 140);
  const program = String(payload.program || 'Community Participation').trim().slice(0, 180);
  if (!recipientName) return { ok: false, status: 400, error: 'Recipient name is required.' };

  return withLock('certificates-ext', async () => {
    const list = await readJson('certificates-ext', buildInitialCertificatesExt);
    const kind = payload.kind === 'Visitor' ? 'Visitor' : 'Member';
    const seq = String(list.length + 1).padStart(3, '0');
    const rec = {
      id: `cert-ext-${randomUUID().slice(0, 8)}`,
      certNo: `GSDD-${kind === 'Visitor' ? 'VIS' : 'CERT'}-${new Date().getFullYear()}-${seq}`,
      kind,
      recipientName,
      memberRegNo: String(payload.memberRegNo || '').trim().slice(0, 40),
      program,
      design: CERTIFICATE_DESIGNS.includes(payload.design) ? payload.design : CERTIFICATE_DESIGNS[0],
      issuedBy: String(payload.issuedBy || 'Foundation Administrator').trim().slice(0, 120),
      status: 'Active',
      issuedDate: new Date().toISOString().slice(0, 10),
    };
    list.unshift(rec);
    await writeJson('certificates-ext', list);
    return { ok: true, status: 201, certificate: rec };
  });
}

export async function deleteCertificatesExt(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select certificate(s) to delete.' };
  return withLock('certificates-ext', async () => {
    const list = await readJson('certificates-ext', buildInitialCertificatesExt);
    const remaining = list.filter((c) => !idSet.has(c.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Certificate not found.' };
    await writeJson('certificates-ext', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Management Body CRUD
// ---------------------------------------------------------------------------

export async function listManagementBody({ tab = 'all', publicOnly = false } = {}) {
  const items = await readJson('management-body', buildInitialManagementBody);
  const t = String(tab || 'all').toLowerCase();
  return items
    .filter((m) => {
      if (publicOnly) return m.status === 'Active';
      if (t === 'active') return m.status === 'Active';
      if (t === 'inactive') return m.status === 'Inactive';
      return true;
    })
    .sort((a, b) => Number(a.displayOrder || 99) - Number(b.displayOrder || 99));
}

export async function upsertManagementBody(payload = {}) {
  const name = String(payload.name || '').trim().slice(0, 140);
  const designation = String(payload.designation || '').trim().slice(0, 120);
  if (!name || !designation) return { ok: false, status: 400, error: 'Name and designation are required.' };

  return withLock('management-body', async () => {
    const list = await readJson('management-body', buildInitialManagementBody);
    const rec = {
      id: payload.id || `mgmt-${randomUUID().slice(0, 8)}`,
      name,
      designation,
      about: String(payload.about || '').trim().slice(0, 1000),
      displayOrder: Math.max(1, Number(payload.displayOrder || 1)),
      status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
    };
    const idx = payload.id ? list.findIndex((m) => m.id === payload.id) : -1;
    if (idx >= 0) list[idx] = rec;
    else list.unshift(rec);
    await writeJson('management-body', list);
    return { ok: true, status: idx >= 0 ? 200 : 201, member: rec };
  });
}

export async function deleteManagementBody(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select member(s) to delete.' };
  return withLock('management-body', async () => {
    const list = await readJson('management-body', buildInitialManagementBody);
    const remaining = list.filter((m) => !idSet.has(m.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Member not found.' };
    await writeJson('management-body', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Member Referral Data + Forgot Password Reset
// ---------------------------------------------------------------------------

export async function getMemberExtensionsSnapshot(member) {
  const regNo = String(member?.regNo || member?.membershipId || member?.id || '').toUpperCase();
  const extList = await listExtendedMembers();
  const referrals = extList.filter(
    (m) => String(m.referredByCode || '').toUpperCase() === regNo
  );
  const notices = await listNotices({ memberId: member?.id || null });
  return {
    referrals,
    activeReferrals: referrals.filter((r) => r.accountStatus === 'Active'),
    inactiveReferrals: referrals.filter((r) => r.accountStatus !== 'Active'),
    notices,
  };
}

export async function resetMemberPasswordByEmailAndPhone({ email, phone, newPassword }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  const cleanPw = String(newPassword || '');
  if (!cleanEmail || cleanPhone.length < 4 || cleanPw.length < 6) {
    return { ok: false, status: 400, error: 'Valid email, registered mobile number, and 6+ char password required.' };
  }

  return withLock('members-ext', async () => {
    const list = await readJson('members-ext', buildInitialMembersExt);
    const idx = list.findIndex(
      (m) =>
        m.email.toLowerCase() === cleanEmail &&
        String(m.mobile || '').replace(/\D/g, '').endsWith(cleanPhone)
    );
    if (idx === -1) {
      return { ok: false, status: 400, error: 'Verification failed: check email and registered mobile number.' };
    }
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(cleanPw, salt, 64);
    list[idx].passwordHash = `${salt}:${derived.toString('hex')}`;
    await writeJson('members-ext', list);
    return { ok: true, status: 200 };
  });
}
