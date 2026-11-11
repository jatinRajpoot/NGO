// Server-only durable store for Operations modules:
// Videos, Events & Applicants, Internships & Apps & Certificates, Expenses & Attachments,
// Jobs & Career Applications, and Projects & Expense Tracking.

import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';
import {
  EVENT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_MODES,
  INTERNSHIP_TYPES,
  PROJECT_CATEGORIES,
} from './operations-constants';

export {
  EVENT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_MODES,
  INTERNSHIP_TYPES,
  PROJECT_CATEGORIES,
};

export const EXPENSE_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024;
const SAFE_ATTACHMENT_NAME = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|pdf)$/i;
const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

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
    process.env.OPERATIONS_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'operations'),
    path.join(tmpdir(), 'gsdd-operations-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('operations') ? dir : path.join(dir, 'operations');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      const attDir = path.join(target, 'attachments');
      if (!existsSync(attDir)) mkdirSync(attDir, { recursive: true });
      return target;
    } catch {}
  }
  const fallback = path.join(tmpdir(), 'gsdd-operations-data');
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
    const file = bucket.file(`operations/${name}.json`);
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
    await bucket.file(`operations/${name}.json`).save(payload, {
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

function normalizeVideoEmbedUrl(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:') return '';
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'www.youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) return clean;
      const vid = parsed.searchParams.get('v');
      return vid ? `https://www.youtube.com/embed/${vid}` : '';
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : '';
    }
    if (host === 'player.vimeo.com' && parsed.pathname.startsWith('/video/')) {
      return clean;
    }
    return '';
  } catch {
    return '';
  }
}

function matchesDatePreset(isoDate, preset, fromDate, toDate) {
  const ts = Date.parse(isoDate || '');
  if (!Number.isFinite(ts)) return true;

  if (fromDate) {
    const startTs = Date.parse(`${fromDate}T00:00:00.000Z`);
    if (Number.isFinite(startTs) && ts < startTs) return false;
  }
  if (toDate) {
    const endTs = Date.parse(`${toDate}T23:59:59.999Z`);
    if (Number.isFinite(endTs) && ts > endTs) return false;
  }

  const p = String(preset || '').trim().toLowerCase();
  if (!p || p === 'all') return true;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  if (p === 'today') return ts >= startToday;
  if (p === 'yesterday') return ts >= startToday - day && ts < startToday;
  if (p === 'this_week') return ts >= startToday - 7 * day;
  if (p === 'last_2_weeks') return ts >= startToday - 14 * day;
  if (p === 'this_month') return ts >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (p === 'last_3_months') return ts >= startToday - 90 * day;
  return true;
}

export function toCsv(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
}

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

function buildInitialVideos() {
  return [
    {
      id: 'vid-1',
      title: 'Raniganj Community Computer Literacy Orientation Highlights',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'Digital Literacy',
      description: 'Overview of student digital citizenship and cyber awareness modules in Araria district.',
      status: 'Active',
      createdAt: '2026-03-02T10:00:00.000Z',
    },
  ];
}

function buildInitialEvents() {
  return [
    {
      id: 'evt-2026-01',
      title: 'Youth Digital Skills & Citizen Portal Workshop',
      eventType: 'Workshops',
      date: '2026-05-18',
      time: '10:30 AM - 01:30 PM',
      venue: 'GSDD Community Learning Center, Raniganj, Araria',
      capacity: 60,
      fee: 0,
      status: 'Active',
      description: 'Practical orientation on cyber hygiene, digital scholarships, and online public welfare forms.',
      createdAt: '2026-03-05T09:00:00.000Z',
    },
    {
      id: 'evt-2026-02',
      title: 'Rural Women Entrepreneurship & Self-Help Seminar',
      eventType: 'Seminars',
      date: '2026-05-29',
      time: '11:00 AM - 03:00 PM',
      venue: 'Panchayat Bhawan Hall, Araria, Bihar',
      capacity: 80,
      fee: 0,
      status: 'Active',
      description: 'Workshop on micro-credit bookkeeping, tailoring cooperatives, and market linkages.',
      createdAt: '2026-03-10T10:00:00.000Z',
    },
    {
      id: 'evt-2026-03',
      title: 'Community Hygiene & Safe Drinking Water Camp',
      eventType: 'Community Gatherings',
      date: '2026-02-14',
      time: '09:30 AM - 02:00 PM',
      venue: 'Ward 4 School Campus, Raniganj',
      capacity: 100,
      fee: 0,
      status: 'Completed',
      description: 'Completed community health screening and clean water orientation camp.',
      createdAt: '2026-02-01T08:00:00.000Z',
    },
  ];
}

function buildInitialEventApplicants() {
  return [
    {
      id: 'evapp-1',
      eventId: 'evt-2026-01',
      eventTitle: 'Youth Digital Skills & Citizen Portal Workshop',
      name: 'Ritu Kumari',
      email: 'ritu@example.org',
      phone: '9835011220',
      city: 'Raniganj',
      status: 'Confirmed',
      appliedAt: '2026-03-12T10:30:00.000Z',
    },
  ];
}

function buildInitialInternships() {
  return [
    {
      id: 'int-2026-01',
      title: 'Community Digital Literacy Field Intern',
      type: 'Offline',
      country: 'India',
      state: 'Bihar',
      city: 'Araria / Raniganj',
      duration: '8 Weeks',
      fee: 0,
      seats: 15,
      stipend: 'No',
      minQualification: '12th Pass / Undergraduate',
      language: 'Hindi / English',
      status: 'Active',
      description: 'Assist instructors during rural computer orientation sessions and document trainee progress.',
      createdAt: '2026-03-01T09:00:00.000Z',
    },
    {
      id: 'int-2026-02',
      title: 'NGO Research, Fundraising & Impact Documentation Intern',
      type: 'Hybrid',
      country: 'India',
      state: 'Bihar',
      city: 'Patna / Remote',
      duration: '12 Weeks',
      fee: 0,
      seats: 10,
      stipend: 'Yes',
      minQualification: 'Graduate / Social Work Student',
      language: 'English / Hindi',
      status: 'Ongoing',
      description: 'Compile field impact reports, donor briefs, and programme case studies.',
      createdAt: '2026-02-20T09:00:00.000Z',
    },
  ];
}

function buildInitialInternshipApps() {
  return [
    {
      id: 'intapp-1',
      internshipId: 'int-2026-01',
      internshipTitle: 'Community Digital Literacy Field Intern',
      applicantName: 'Amandeep Verma',
      email: 'aman.v@example.org',
      phone: '9876509988',
      qualification: 'B.C.A. 2nd Year',
      city: 'Araria',
      status: 'Approved',
      certificateId: 'GSDD-INT-2026-001',
      issuedAt: '2026-03-15',
      appliedAt: '2026-03-04T11:00:00.000Z',
    },
  ];
}

function buildInitialExpenses() {
  return [
    {
      id: 'exp-1',
      title: 'Workshop Learning Workbooks & Flyers',
      category: 'Stationery & Printing',
      amount: 4250,
      paymentMode: 'UPI',
      payee: 'Araria Press Graphics',
      projectTitle: 'Digital Literacy and Cyber Awareness',
      date: new Date().toISOString().slice(0, 10),
      attachmentFilename: null,
      attachmentSrc: null,
      notes: 'Printed 150 student handouts for Raniganj drive.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      title: 'Health Camp Hygiene & First-Aid Kits',
      category: 'Medical Camp',
      amount: 7800,
      paymentMode: 'Bank Transfer',
      payee: 'Bihar Pharma Distributors',
      projectTitle: 'Health and Hygiene Awareness',
      date: '2026-03-10',
      attachmentFilename: null,
      attachmentSrc: null,
      notes: 'Sanitary & ORS supplies.',
      createdAt: '2026-03-10T12:00:00.000Z',
    },
  ];
}

function buildInitialJobs() {
  return [
    {
      id: 'job-2026-01',
      title: 'District Programme Coordinator — Digital Skills',
      jobType: 'Full-Time',
      experience: '1–3 Years',
      location: 'Araria, Bihar',
      fee: 0,
      status: 'Active',
      description: 'Lead block-level computer awareness workshops, school coordination, and volunteer onboarding.',
      createdAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'job-2026-02',
      title: 'Community Health Mobilizer',
      jobType: 'Contract',
      experience: '0–2 Years',
      location: 'Raniganj Block, Araria',
      fee: 0,
      status: 'Active',
      description: 'Coordinate preventive health outreach sessions and beneficiary intake verification.',
      createdAt: '2026-03-08T09:00:00.000Z',
    },
    {
      id: 'job-2026-03',
      title: 'Office Accounts Executive (Closed Cohort)',
      jobType: 'Part-Time',
      experience: '2+ Years',
      location: 'Patna, Bihar',
      fee: 0,
      status: 'Inactive',
      description: 'Compliance voucher reconciliation and Section 8 audit documentation.',
      createdAt: '2026-01-15T08:00:00.000Z',
    },
  ];
}

function buildInitialJobApps() {
  return [];
}

function buildInitialProjects() {
  return [
    {
      id: 'prj-1',
      title: 'Digital Literacy and Cyber Awareness',
      category: 'Education',
      goalAmount: 300000,
      spentAmount: 112500,
      status: 'Active',
      location: 'Raniganj & Araria Blocks',
      description: 'Equipping rural youth with practical computer literacy, cyber safety, and digital public service skills.',
      createdAt: '2026-01-20T08:00:00.000Z',
    },
    {
      id: 'prj-2',
      title: 'Health and Hygiene Awareness Camps',
      category: 'Health',
      goalAmount: 180000,
      spentAmount: 84000,
      status: 'Active',
      location: 'Araria District Panchayats',
      description: 'Preventive nutrition, maternal hygiene, and clean water awareness camps.',
      createdAt: '2026-02-01T08:00:00.000Z',
    },
    {
      id: 'prj-3',
      title: 'Women Tailoring Self-Help Cooperative Phase I',
      category: 'Women Empowerment',
      goalAmount: 150000,
      spentAmount: 150000,
      status: 'Completed',
      location: 'Raniganj, Bihar',
      description: 'Completed sewing machine distribution and self-employment mentorship for 25 women.',
      createdAt: '2025-11-10T08:00:00.000Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Video Management CRUD
// ---------------------------------------------------------------------------

export async function listVideos({ status = 'all', search = '' } = {}) {
  const list = await readJson('videos', buildInitialVideos);
  const q = String(search || '').trim().toLowerCase();
  const s = String(status || 'all').toLowerCase();
  return list
    .filter((v) => {
      if (s !== 'all' && String(v.status || '').toLowerCase() !== s) return false;
      if (q && !`${v.title} ${v.description} ${v.videoUrl} ${v.category}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createVideo(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const videoUrl = String(payload.videoUrl || '').trim().slice(0, 400);
  const embedUrl = normalizeVideoEmbedUrl(videoUrl);
  if (!title || !embedUrl) {
    return { ok: false, status: 400, error: 'Valid title and HTTPS YouTube/Vimeo video URL are required.' };
  }
  return withLock('videos', async () => {
    const list = await readJson('videos', buildInitialVideos);
    const rec = {
      id: `vid-${randomUUID().slice(0, 8)}`,
      title,
      videoUrl,
      embedUrl,
      category: String(payload.category || 'General').trim().slice(0, 80),
      description: String(payload.description || '').trim().slice(0, 1000),
      status: payload.status === 'Draft' ? 'Draft' : 'Active',
      createdAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('videos', list);
    return { ok: true, status: 201, video: rec };
  });
}

export async function deleteVideos(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide video id(s).' };
  return withLock('videos', async () => {
    const list = await readJson('videos', buildInitialVideos);
    const remaining = list.filter((v) => !idSet.has(v.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Video not found.' };
    await writeJson('videos', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Events & Event Applicants CRUD
// ---------------------------------------------------------------------------

export async function listEvents({ tab = 'all', publicOnly = false } = {}) {
  const items = await readJson('events', buildInitialEvents);
  const t = String(tab || 'all').toLowerCase();
  return items.filter((e) => {
    if (publicOnly && e.status === 'Draft') return false;
    if (t === 'active') return e.status === 'Active';
    if (t === 'completed') return e.status === 'Completed';
    return true;
  });
}

export async function createEvent(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const venue = String(payload.venue || '').trim().slice(0, 200);
  const date = String(payload.date || '').trim().slice(0, 30);
  if (!title || !venue || !date) {
    return { ok: false, status: 400, error: 'Event title, date, and venue are required.' };
  }
  return withLock('events', async () => {
    const list = await readJson('events', buildInitialEvents);
    const rec = {
      id: `evt-${randomUUID().slice(0, 8)}`,
      title,
      eventType: EVENT_TYPES.includes(payload.eventType) ? payload.eventType : EVENT_TYPES[0],
      date,
      time: String(payload.time || '10:00 AM').trim().slice(0, 60),
      venue,
      capacity: Math.max(1, Number(payload.capacity || 50)),
      fee: Math.max(0, Number(payload.fee || 0)),
      status: ['Active', 'Completed', 'Draft'].includes(payload.status) ? payload.status : 'Active',
      description: String(payload.description || '').trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('events', list);
    return { ok: true, status: 201, event: rec };
  });
}

export async function updateEvent(id, patch = {}) {
  return withLock('events', async () => {
    const list = await readJson('events', buildInitialEvents);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Event not found.' };
    const cur = list[idx];
    list[idx] = {
      ...cur,
      title: typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim().slice(0, 180) : cur.title,
      eventType: EVENT_TYPES.includes(patch.eventType) ? patch.eventType : cur.eventType,
      date: typeof patch.date === 'string' && patch.date ? patch.date.slice(0, 30) : cur.date,
      time: typeof patch.time === 'string' ? patch.time.slice(0, 60) : cur.time,
      venue: typeof patch.venue === 'string' && patch.venue.trim() ? patch.venue.trim().slice(0, 200) : cur.venue,
      capacity: Number.isFinite(Number(patch.capacity)) ? Math.max(1, Number(patch.capacity)) : cur.capacity,
      fee: Number.isFinite(Number(patch.fee)) ? Math.max(0, Number(patch.fee)) : cur.fee,
      status: ['Active', 'Completed', 'Draft'].includes(patch.status) ? patch.status : cur.status,
      description: typeof patch.description === 'string' ? patch.description.trim().slice(0, 2000) : cur.description,
    };
    await writeJson('events', list);
    return { ok: true, status: 200, event: list[idx] };
  });
}

export async function deleteEvents(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide event id(s).' };
  return withLock('events', async () => {
    const list = await readJson('events', buildInitialEvents);
    const remaining = list.filter((e) => !idSet.has(e.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Event not found.' };
    await writeJson('events', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

export async function listEventApplicants() {
  return readJson('event-applicants', buildInitialEventApplicants);
}

export async function registerEventApplicant(payload = {}) {
  const eventId = String(payload.eventId || '').trim();
  const name = String(payload.name || '').trim().slice(0, 120);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const phone = String(payload.phone || '').trim().slice(0, 24);
  if (!eventId || !name || !email || !phone) {
    return { ok: false, status: 400, error: 'Event, full name, email, and mobile are required.' };
  }
  const events = await readJson('events', buildInitialEvents);
  const evt = events.find((e) => e.id === eventId && e.status === 'Active');
  if (!evt) return { ok: false, status: 404, error: 'Active event not found.' };

  return withLock('event-applicants', async () => {
    const apps = await readJson('event-applicants', buildInitialEventApplicants);
    const rec = {
      id: `evapp-${randomUUID().slice(0, 8)}`,
      eventId: evt.id,
      eventTitle: evt.title,
      name,
      email,
      phone,
      city: String(payload.city || '').trim().slice(0, 80),
      status: 'Confirmed',
      appliedAt: new Date().toISOString(),
    };
    apps.unshift(rec);
    await writeJson('event-applicants', apps);
    return { ok: true, status: 201, applicant: rec };
  });
}

// ---------------------------------------------------------------------------
// Internships, Applications & Certificate Verification
// ---------------------------------------------------------------------------

export async function listInternships({ tab = 'all', publicOnly = false } = {}) {
  const items = await readJson('internships', buildInitialInternships);
  const t = String(tab || 'all').toLowerCase();
  return items.filter((i) => {
    if (publicOnly && !['Active', 'Ongoing'].includes(i.status)) return false;
    if (t === 'active') return i.status === 'Active';
    if (t === 'ongoing') return i.status === 'Ongoing';
    if (t === 'completed') return i.status === 'Completed';
    return true;
  });
}

export async function createInternship(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const duration = String(payload.duration || '').trim().slice(0, 60);
  if (!title || !duration) {
    return { ok: false, status: 400, error: 'Internship title and duration are required.' };
  }
  return withLock('internships', async () => {
    const list = await readJson('internships', buildInitialInternships);
    const rec = {
      id: `int-${randomUUID().slice(0, 8)}`,
      title,
      type: INTERNSHIP_TYPES.includes(payload.type) ? payload.type : 'Offline',
      country: String(payload.country || 'India').trim().slice(0, 80),
      state: String(payload.state || 'Bihar').trim().slice(0, 80),
      city: String(payload.city || 'Araria').trim().slice(0, 80),
      duration,
      fee: Math.max(0, Number(payload.fee || 0)),
      seats: Math.max(1, Number(payload.seats || 10)),
      stipend: payload.stipend === 'Yes' ? 'Yes' : 'No',
      minQualification: String(payload.minQualification || 'Graduate / Pursuing').trim().slice(0, 120),
      language: String(payload.language || 'Hindi / English').trim().slice(0, 80),
      status: ['Active', 'Ongoing', 'Completed'].includes(payload.status) ? payload.status : 'Active',
      description: String(payload.description || '').trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('internships', list);
    return { ok: true, status: 201, internship: rec };
  });
}

export async function deleteInternships(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide internship id(s).' };
  return withLock('internships', async () => {
    const list = await readJson('internships', buildInitialInternships);
    const remaining = list.filter((i) => !idSet.has(i.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Internship not found.' };
    await writeJson('internships', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

export async function listInternshipApps() {
  return readJson('internship-apps', buildInitialInternshipApps);
}

export async function applyForInternship(payload = {}) {
  const internshipId = String(payload.internshipId || '').trim();
  const applicantName = String(payload.applicantName || payload.name || '').trim().slice(0, 120);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const phone = String(payload.phone || '').trim().slice(0, 24);
  if (!internshipId || !applicantName || !email || !phone) {
    return { ok: false, status: 400, error: 'Internship track, full name, email, and mobile are required.' };
  }
  const internships = await readJson('internships', buildInitialInternships);
  const track = internships.find((i) => i.id === internshipId);
  if (!track) return { ok: false, status: 404, error: 'Internship not found.' };

  return withLock('internship-apps', async () => {
    const apps = await readJson('internship-apps', buildInitialInternshipApps);
    const rec = {
      id: `intapp-${randomUUID().slice(0, 8)}`,
      internshipId: track.id,
      internshipTitle: track.title,
      applicantName,
      email,
      phone,
      qualification: String(payload.qualification || '').trim().slice(0, 120),
      city: String(payload.city || '').trim().slice(0, 80),
      status: 'Pending',
      certificateId: null,
      issuedAt: null,
      appliedAt: new Date().toISOString(),
    };
    apps.unshift(rec);
    await writeJson('internship-apps', apps);
    return { ok: true, status: 201, application: rec };
  });
}

export async function issueInternshipCertificate(appId, status = 'Approved') {
  return withLock('internship-apps', async () => {
    const apps = await readJson('internship-apps', buildInitialInternshipApps);
    const idx = apps.findIndex((a) => a.id === appId);
    if (idx === -1) return { ok: false, status: 404, error: 'Application not found.' };
    apps[idx].status = status;
    if (status === 'Approved' && !apps[idx].certificateId) {
      const seq = String(apps.filter((a) => a.certificateId).length + 1).padStart(3, '0');
      apps[idx].certificateId = `GSDD-INT-${new Date().getFullYear()}-${seq}`;
      apps[idx].issuedAt = new Date().toISOString().slice(0, 10);
    }
    await writeJson('internship-apps', apps);
    return { ok: true, status: 200, application: apps[idx] };
  });
}

export async function verifyInternshipCertificate(code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return { found: false };
  const apps = await readJson('internship-apps', buildInitialInternshipApps);
  const match = apps.find((a) => a.certificateId && a.certificateId.toUpperCase() === clean);
  if (!match) return { found: false };
  return {
    found: true,
    certificate: {
      certificateId: match.certificateId,
      internName: match.applicantName,
      internshipTitle: match.internshipTitle,
      qualification: match.qualification,
      issuedAt: match.issuedAt,
      status: match.status,
    },
  };
}

// ---------------------------------------------------------------------------
// Expenses & Attachments
// ---------------------------------------------------------------------------

function validateExpenseAttachment(buffer, filename = '', declaredMime = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return { ok: false, error: 'Attachment file is invalid or empty.' };
  }
  if (buffer.length > EXPENSE_ATTACHMENT_MAX_BYTES) {
    return { ok: false, error: 'Attachment must be 2 MB or smaller.' };
  }
  const m = String(filename || '').trim().match(/\.([a-z0-9]+)$/i);
  const ext = m ? m[1].toLowerCase() : '';
  if (!MIME_BY_EXT[ext]) return { ok: false, error: 'Attachment must be JPG, PNG, or PDF.' };

  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isPdf = buffer.toString('ascii', 0, 5) === '%PDF-';

  let detected = null;
  if (isJpg) detected = ext === 'jpeg' ? 'jpeg' : 'jpg';
  else if (isPng) detected = 'png';
  else if (isPdf) detected = 'pdf';

  if (!detected) return { ok: false, error: 'Attachment file bytes do not match JPG, PNG, or PDF.' };
  const norm = (x) => (x === 'jpeg' ? 'jpg' : x);
  if (norm(ext) !== norm(detected)) return { ok: false, error: 'Attachment extension mismatches file contents.' };

  const contentType = MIME_BY_EXT[detected];
  const cleanMime = String(declaredMime || '').split(';')[0].trim().toLowerCase();
  if (cleanMime && cleanMime !== 'application/octet-stream') {
    const normMime = cleanMime === 'image/jpg' ? 'image/jpeg' : cleanMime;
    if (normMime !== contentType) return { ok: false, error: 'Declared MIME type mismatches content.' };
  }
  return { ok: true, ext: detected, contentType };
}

async function saveAttachmentBuffer({ buffer, ext, contentType }) {
  const filename = `exp-att-${randomUUID().slice(0, 10)}.${ext}`;
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`operations/attachments/${filename}`).save(buffer, { contentType, resumable: false });
  } else {
    const target = path.join(getDataDir(), 'attachments', filename);
    const temp = `${target}.tmp.${randomBytes(4).toString('hex')}`;
    writeFileSync(temp, buffer);
    renameSync(temp, target);
  }
  return filename;
}

export async function readExpenseAttachment(filename) {
  const clean = String(filename || '').trim();
  if (!SAFE_ATTACHMENT_NAME.test(clean)) return null;
  const ext = clean.split('.').pop().toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
  const bucket = getGcsBucket();
  if (bucket) {
    try {
      const [buffer] = await bucket.file(`operations/attachments/${clean}`).download();
      return { buffer, contentType };
    } catch {
      return null;
    }
  }
  const target = path.join(getDataDir(), 'attachments', clean);
  if (!existsSync(target)) return null;
  return { buffer: readFileSync(target), contentType };
}

export async function listExpenses({ category = 'all', preset = 'all', from = '', to = '' } = {}) {
  const list = await readJson('expenses', buildInitialExpenses);
  return list
    .filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!matchesDatePreset(e.createdAt || e.date, preset, from, to)) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createExpense({ title, category, amount, paymentMode, payee, projectTitle, date, notes, attachmentFile }) {
  const cleanTitle = String(title || '').trim().slice(0, 180);
  const numAmt = Number(amount);
  if (!cleanTitle || !Number.isFinite(numAmt) || numAmt <= 0) {
    return { ok: false, status: 400, error: 'Expense title and amount > 0 are required.' };
  }

  let attName = null;
  if (attachmentFile) {
    const check = validateExpenseAttachment(attachmentFile.buffer, attachmentFile.filename, attachmentFile.contentType);
    if (!check.ok) return { ok: false, status: 400, error: check.error };
    attName = await saveAttachmentBuffer({ ...attachmentFile, ext: check.ext, contentType: check.contentType });
  }

  return withLock('expenses', async () => {
    const list = await readJson('expenses', buildInitialExpenses);
    const now = new Date().toISOString();
    const rec = {
      id: `exp-${randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      category: EXPENSE_CATEGORIES.includes(category) ? category : EXPENSE_CATEGORIES[0],
      amount: Math.round(numAmt),
      paymentMode: EXPENSE_PAYMENT_MODES.includes(paymentMode) ? paymentMode : 'Cash',
      payee: String(payee || '').trim().slice(0, 120),
      projectTitle: String(projectTitle || '').trim().slice(0, 160),
      date: String(date || now.slice(0, 10)),
      attachmentFilename: attName,
      attachmentSrc: attName ? `/api/admin/expenses/attachment/${attName}/` : null,
      notes: String(notes || '').trim().slice(0, 800),
      createdAt: now,
    };
    list.unshift(rec);
    await writeJson('expenses', list);
    return { ok: true, status: 201, expense: rec };
  });
}

export async function deleteExpenses(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide expense id(s).' };
  return withLock('expenses', async () => {
    const list = await readJson('expenses', buildInitialExpenses);
    const remaining = list.filter((e) => !idSet.has(e.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Expense not found.' };
    await writeJson('expenses', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Job Management & Careers Applications
// ---------------------------------------------------------------------------

export async function listJobs({ tab = 'all', publicOnly = false } = {}) {
  const jobs = await readJson('jobs', buildInitialJobs);
  const apps = await readJson('job-apps', buildInitialJobApps);
  const countByJob = new Map();
  for (const a of apps) countByJob.set(a.jobId, (countByJob.get(a.jobId) || 0) + 1);

  const t = String(tab || 'all').toLowerCase();
  return jobs
    .filter((j) => {
      if (publicOnly) return j.status === 'Active';
      if (t === 'active') return j.status === 'Active';
      if (t === 'inactive') return j.status === 'Inactive';
      return true;
    })
    .map((j) => ({ ...j, applicationsCount: countByJob.get(j.id) || 0 }));
}

export async function createJob(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const location = String(payload.location || '').trim().slice(0, 120);
  if (!title || !location) return { ok: false, status: 400, error: 'Job title and location are required.' };
  return withLock('jobs', async () => {
    const list = await readJson('jobs', buildInitialJobs);
    const rec = {
      id: `job-${randomUUID().slice(0, 8)}`,
      title,
      jobType: String(payload.jobType || 'Full-Time').trim().slice(0, 60),
      experience: String(payload.experience || '0–2 Years').trim().slice(0, 60),
      location,
      fee: Math.max(0, Number(payload.fee || 0)),
      status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
      description: String(payload.description || '').trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('jobs', list);
    return { ok: true, status: 201, job: { ...rec, applicationsCount: 0 } };
  });
}

export async function deleteJobs(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide job id(s).' };
  return withLock('jobs', async () => {
    const list = await readJson('jobs', buildInitialJobs);
    const remaining = list.filter((j) => !idSet.has(j.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Job not found.' };
    await writeJson('jobs', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

export async function listJobApplications() {
  return readJson('job-apps', buildInitialJobApps);
}

export async function applyForJob(payload = {}) {
  const jobId = String(payload.jobId || '').trim();
  const name = String(payload.name || '').trim().slice(0, 120);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const phone = String(payload.phone || '').trim().slice(0, 24);
  if (!jobId || !name || !email || !phone) {
    return { ok: false, status: 400, error: 'Job opening, name, email, and mobile are required.' };
  }
  const jobs = await readJson('jobs', buildInitialJobs);
  const job = jobs.find((j) => j.id === jobId && j.status === 'Active');
  if (!job) return { ok: false, status: 404, error: 'Active job opening not found.' };

  return withLock('job-apps', async () => {
    const apps = await readJson('job-apps', buildInitialJobApps);
    const rec = {
      id: `jobapp-${randomUUID().slice(0, 8)}`,
      jobId: job.id,
      jobTitle: job.title,
      name,
      email,
      phone,
      experience: String(payload.experience || '').trim().slice(0, 80),
      coverNote: String(payload.coverNote || '').trim().slice(0, 1000),
      appliedAt: new Date().toISOString(),
    };
    apps.unshift(rec);
    await writeJson('job-apps', apps);
    return { ok: true, status: 201, application: rec };
  });
}

// ---------------------------------------------------------------------------
// Project Management CRUD
// ---------------------------------------------------------------------------

export async function listProjects({ tab = 'all', category = 'all' } = {}) {
  const items = await readJson('projects', buildInitialProjects);
  const t = String(tab || 'all').toLowerCase();
  return items
    .filter((p) => {
      if (t === 'active' && p.status !== 'Active') return false;
      if (t === 'completed' && p.status !== 'Completed') return false;
      if (category !== 'all' && p.category !== category) return false;
      return true;
    })
    .map((p) => ({
      ...p,
      progressPercent: Math.min(100, Math.round((Number(p.spentAmount || 0) / Math.max(1, Number(p.goalAmount || 1))) * 100)),
    }));
}

export async function createProject(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const goalAmount = Number(payload.goalAmount);
  if (!title || !Number.isFinite(goalAmount) || goalAmount < 100) {
    return { ok: false, status: 400, error: 'Project title and goal amount >= Rs. 100 required.' };
  }
  return withLock('projects', async () => {
    const list = await readJson('projects', buildInitialProjects);
    const spentAmount = Math.max(0, Math.round(Number(payload.spentAmount || 0)));
    const rec = {
      id: `prj-${randomUUID().slice(0, 8)}`,
      title,
      category: PROJECT_CATEGORIES.includes(payload.category) ? payload.category : 'Other',
      goalAmount: Math.round(goalAmount),
      spentAmount,
      status: payload.status === 'Completed' ? 'Completed' : 'Active',
      location: String(payload.location || 'Araria, Bihar').trim().slice(0, 120),
      description: String(payload.description || '').trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    list.unshift(rec);
    await writeJson('projects', list);
    return { ok: true, status: 201, project: rec };
  });
}

export async function updateProject(id, patch = {}) {
  return withLock('projects', async () => {
    const list = await readJson('projects', buildInitialProjects);
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Project not found.' };
    const cur = list[idx];
    list[idx] = {
      ...cur,
      title: typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim().slice(0, 180) : cur.title,
      category: PROJECT_CATEGORIES.includes(patch.category) ? patch.category : cur.category,
      goalAmount: Number.isFinite(Number(patch.goalAmount)) ? Math.round(Number(patch.goalAmount)) : cur.goalAmount,
      spentAmount: Number.isFinite(Number(patch.spentAmount)) ? Math.max(0, Math.round(Number(patch.spentAmount))) : cur.spentAmount,
      status: patch.status === 'Completed' ? 'Completed' : patch.status === 'Active' ? 'Active' : cur.status,
      location: typeof patch.location === 'string' ? patch.location.trim().slice(0, 120) : cur.location,
      description: typeof patch.description === 'string' ? patch.description.trim().slice(0, 2000) : cur.description,
    };
    await writeJson('projects', list);
    return { ok: true, status: 200, project: list[idx] };
  });
}

export async function deleteProjects(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide project id(s).' };
  return withLock('projects', async () => {
    const list = await readJson('projects', buildInitialProjects);
    const remaining = list.filter((p) => !idSet.has(p.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Project not found.' };
    await writeJson('projects', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}
