// Server-only durable store for Beneficiaries (+ Benefits Provided & Direct Requests),
// Complaints (+ Admin Remarks & Status Tracking), and Enquiries Management.

import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';

export const BENEFICIARY_CATEGORIES = [
  'Education Support',
  'Healthcare Aid',
  'Women Livelihood',
  'Senior Citizen Care',
  'Child Nutrition',
  'Disaster Relief',
];

export const COMPLAINT_STATUSES = ['Pending', 'Active', 'Rejected', 'Resolved'];

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
    process.env.SUPPORT_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'support'),
    path.join(tmpdir(), 'gsdd-support-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('support') ? dir : path.join(dir, 'support');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      return target;
    } catch {}
  }
  const fallback = path.join(tmpdir(), 'gsdd-support-data');
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
    const file = bucket.file(`support/${name}.json`);
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
    await bucket.file(`support/${name}.json`).save(payload, { contentType: 'application/json', resumable: false });
    return;
  }
  const filePath = path.join(getDataDir(), `${name}.json`);
  const temp = `${filePath}.tmp.${Math.random().toString(16).slice(2, 8)}`;
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

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

function buildInitialBeneficiaries() {
  return [
    {
      id: 'ben-101',
      trackingCode: 'GSDD-BEN-2026-101',
      name: 'Rekha Devi',
      age: 34,
      gender: 'Female',
      phone: '9835011101',
      email: 'rekha.d@example.org',
      category: 'Women Livelihood',
      district: 'Araria',
      state: 'Bihar',
      address: 'Ward 5, Raniganj, Araria',
      idDocType1: 'Aadhaar',
      idDocNo1: 'XXXX-XXXX-4421',
      idDocType2: 'Ration Card',
      idDocNo2: 'BR-AR-99012',
      status: 'Active',
      needSummary: 'Tailoring machine support & SHG linkage',
      benefits: [
        {
          id: 'bf-1',
          benefitTitle: 'Sewing Machine & Tailoring Kit Delivered',
          benefitValue: 'Rs. 8,500',
          date: '2026-03-04',
          notes: 'Handed over at Raniganj center.',
        },
      ],
      createdAt: '2026-03-01T09:00:00.000Z',
    },
    {
      id: 'ben-102',
      trackingCode: 'GSDD-BEN-2026-102',
      name: 'Md. Imran Ansari',
      age: 19,
      gender: 'Male',
      phone: '9431205544',
      email: 'imran.a@example.org',
      category: 'Education Support',
      district: 'Purnia',
      state: 'Bihar',
      address: 'Kasba Block, Purnia',
      idDocType1: 'Aadhaar',
      idDocNo1: 'XXXX-XXXX-7789',
      idDocType2: 'Student ID',
      idDocNo2: 'PU-2026-884',
      status: 'Direct Request',
      needSummary: 'Scholarship & digital literacy tuition waiver request',
      benefits: [],
      createdAt: '2026-03-14T11:30:00.000Z',
    },
  ];
}

function buildInitialComplaints() {
  return [
    {
      id: 'cmp-101',
      ticketNo: 'GSDD-CMP-2026-001',
      complainantName: 'Manoj Kumar Sah',
      email: 'manoj.s@example.org',
      phone: '9801122334',
      category: 'Certificate / ID Delay',
      subject: 'Pending Member ID Card Print Verification',
      description: 'Submitted membership approval fee on March 2; requesting confirmation on ID download.',
      status: 'Active',
      adminRemark: 'Verified payment ledger; Member ID activated for portal download.',
      createdAt: '2026-03-05T10:15:00.000Z',
      updatedAt: '2026-03-06T09:00:00.000Z',
    },
    {
      id: 'cmp-102',
      ticketNo: 'GSDD-CMP-2026-002',
      complainantName: 'Savitri Kumari',
      email: 'savitri@example.org',
      phone: '9123409876',
      category: 'Event Registration',
      subject: 'Workshop Venue Confirmation Needed',
      description: 'Requested Raniganj workshop timing SMS update.',
      status: 'Pending',
      adminRemark: '',
      createdAt: '2026-03-16T14:20:00.000Z',
      updatedAt: '2026-03-16T14:20:00.000Z',
    },
  ];
}

function buildInitialEnquiries() {
  return [
    {
      id: 'enq-101',
      name: 'Rakesh Tiwari',
      email: 'rakesh.t@example.org',
      phone: '9876504433',
      subject: 'CSR Volunteering Partnership Inquiry',
      message: 'Our local IT alumni circle wants to donate 5 laptops for the Raniganj learning hub.',
      status: 'new',
      adminReply: '',
      repliedAt: null,
      createdAt: '2026-03-17T08:45:00.000Z',
    },
    {
      id: 'enq-102',
      name: 'Pallavi Verma',
      email: 'pallavi@example.org',
      phone: '9431012345',
      subject: 'Internship Eligibility Question',
      message: 'Can final year B.A. students apply for the summer hybrid internship?',
      status: 'replied',
      adminReply: 'Yes! Final year students are welcome to apply via /internships.',
      repliedAt: '2026-03-15T12:00:00.000Z',
      createdAt: '2026-03-15T10:00:00.000Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Beneficiaries & Direct Requests CRUD
// ---------------------------------------------------------------------------

export async function listBeneficiaries({ tab = 'all', search = '', publicOnly = false } = {}) {
  const items = await readJson('beneficiaries', buildInitialBeneficiaries);
  const t = String(tab || 'all').toLowerCase();
  const q = String(search || '').trim().toLowerCase();

  return items
    .filter((b) => {
      if (publicOnly && !['Active', 'Completed'].includes(b.status)) return false;
      if (t === 'active' && b.status !== 'Active') return false;
      if (t === 'inactive' && b.status !== 'Inactive') return false;
      if (t === 'direct_request' && b.status !== 'Direct Request') return false;
      if (t === 'completed' && b.status !== 'Completed') return false;
      if (q) {
        const hay = `${b.trackingCode} ${b.name} ${b.category} ${b.district} ${b.state}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((b) =>
      publicOnly
        ? {
            id: b.id,
            trackingCode: b.trackingCode,
            name: b.name,
            category: b.category,
            district: b.district,
            state: b.state,
            status: b.status,
            needSummary: b.needSummary,
            benefitsCount: (b.benefits || []).length,
            benefits: (b.benefits || []).map((bf) => ({
              benefitTitle: bf.benefitTitle,
              date: bf.date,
            })),
          }
        : b
    )
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function createBeneficiary(payload = {}, { isDirectPublicRequest = false } = {}) {
  const name = String(payload.name || '').trim().slice(0, 140);
  const phone = String(payload.phone || '').trim().slice(0, 24);
  const district = String(payload.district || '').trim().slice(0, 80);
  if (!name || !phone || !district) {
    return { ok: false, status: 400, error: 'Name, mobile number, and district are required.' };
  }

  return withLock('beneficiaries', async () => {
    const list = await readJson('beneficiaries', buildInitialBeneficiaries);
    const seq = String(101 + list.length).padStart(3, '0');
    const now = new Date().toISOString();
    const record = {
      id: `ben-${randomUUID().slice(0, 8)}`,
      trackingCode: `GSDD-BEN-${new Date().getFullYear()}-${seq}`,
      name,
      age: Number(payload.age || 0) || '',
      gender: String(payload.gender || '').trim().slice(0, 24),
      phone,
      email: String(payload.email || '').trim().toLowerCase().slice(0, 160),
      category: BENEFICIARY_CATEGORIES.includes(payload.category)
        ? payload.category
        : BENEFICIARY_CATEGORIES[0],
      district,
      state: String(payload.state || 'Bihar').trim().slice(0, 80),
      address: String(payload.address || '').trim().slice(0, 260),
      idDocType1: String(payload.idDocType1 || 'Aadhaar').trim().slice(0, 40),
      idDocNo1: String(payload.idDocNo1 || '').trim().slice(0, 60),
      idDocType2: String(payload.idDocType2 || '').trim().slice(0, 40),
      idDocNo2: String(payload.idDocNo2 || '').trim().slice(0, 60),
      status: isDirectPublicRequest
        ? 'Direct Request'
        : ['Active', 'Inactive', 'Direct Request', 'Completed'].includes(payload.status)
        ? payload.status
        : 'Active',
      needSummary: String(payload.needSummary || payload.reason || '').trim().slice(0, 1000),
      benefits: [],
      createdAt: now,
    };
    list.unshift(record);
    await writeJson('beneficiaries', list);
    return { ok: true, status: 201, beneficiary: record };
  });
}

export async function updateBeneficiary(id, patch = {}) {
  return withLock('beneficiaries', async () => {
    const list = await readJson('beneficiaries', buildInitialBeneficiaries);
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Beneficiary not found.' };
    const cur = list[idx];

    if (patch.addBenefit && typeof patch.addBenefit === 'object') {
      const benefitTitle = String(patch.addBenefit.benefitTitle || '').trim().slice(0, 180);
      if (!benefitTitle) return { ok: false, status: 400, error: 'Benefit title is required.' };
      cur.benefits = Array.isArray(cur.benefits) ? cur.benefits : [];
      cur.benefits.unshift({
        id: `bf-${randomUUID().slice(0, 6)}`,
        benefitTitle,
        benefitValue: String(patch.addBenefit.benefitValue || '').trim().slice(0, 60),
        date: String(patch.addBenefit.date || new Date().toISOString().slice(0, 10)),
        notes: String(patch.addBenefit.notes || '').trim().slice(0, 400),
      });
    }

    list[idx] = {
      ...cur,
      name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 140) : cur.name,
      category: BENEFICIARY_CATEGORIES.includes(patch.category) ? patch.category : cur.category,
      district: typeof patch.district === 'string' && patch.district.trim() ? patch.district.trim().slice(0, 80) : cur.district,
      state: typeof patch.state === 'string' && patch.state.trim() ? patch.state.trim().slice(0, 80) : cur.state,
      status: ['Active', 'Inactive', 'Direct Request', 'Completed'].includes(patch.status)
        ? patch.status
        : cur.status,
      needSummary: typeof patch.needSummary === 'string' ? patch.needSummary.trim().slice(0, 1000) : cur.needSummary,
    };
    await writeJson('beneficiaries', list);
    return { ok: true, status: 200, beneficiary: list[idx] };
  });
}

export async function deleteBeneficiaries(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select beneficiary record(s).' };
  return withLock('beneficiaries', async () => {
    const list = await readJson('beneficiaries', buildInitialBeneficiaries);
    const remaining = list.filter((b) => !idSet.has(b.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Beneficiary not found.' };
    await writeJson('beneficiaries', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Complaints Management & Status Lookup
// ---------------------------------------------------------------------------

export async function listComplaints({ status = 'all', search = '' } = {}) {
  const items = await readJson('complaints', buildInitialComplaints);
  const s = String(status || 'all').toLowerCase();
  const q = String(search || '').trim().toLowerCase();
  return items
    .filter((c) => {
      if (s !== 'all' && String(c.status || '').toLowerCase() !== s) return false;
      if (q && !`${c.ticketNo} ${c.complainantName} ${c.subject} ${c.email}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function submitComplaint(payload = {}) {
  const complainantName = String(payload.complainantName || payload.name || payload.fullName || '').trim().slice(0, 140);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const subject = String(payload.subject || payload.category || '').trim().slice(0, 200);
  const description = String(payload.description || payload.message || payload.details || '').trim().slice(0, 3000);
  if (!complainantName || !subject || !description) {
    return { ok: false, status: 400, error: 'Full name, subject/category, and complaint description are required.' };
  }

  return withLock('complaints', async () => {
    const list = await readJson('complaints', buildInitialComplaints);
    const seq = String(list.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const record = {
      id: `cmp-${randomUUID().slice(0, 8)}`,
      ticketNo: `GSDD-CMP-${new Date().getFullYear()}-${seq}`,
      complainantName,
      email,
      phone: String(payload.phone || '').trim().slice(0, 24),
      category: String(payload.category || 'General Grievance').trim().slice(0, 80),
      subject,
      description,
      status: 'Pending',
      adminRemark: '',
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(record);
    await writeJson('complaints', list);
    return { ok: true, status: 201, complaint: record };
  });
}

export async function updateComplaint(id, { status, adminRemark }) {
  return withLock('complaints', async () => {
    const list = await readJson('complaints', buildInitialComplaints);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Complaint not found.' };
    if (status && COMPLAINT_STATUSES.includes(status)) {
      list[idx].status = status;
    }
    if (typeof adminRemark === 'string') {
      list[idx].adminRemark = adminRemark.trim().slice(0, 1000);
    }
    list[idx].updatedAt = new Date().toISOString();
    await writeJson('complaints', list);
    return { ok: true, status: 200, complaint: list[idx] };
  });
}

export async function deleteComplaints(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select complaint(s) to delete.' };
  return withLock('complaints', async () => {
    const list = await readJson('complaints', buildInitialComplaints);
    const remaining = list.filter((c) => !idSet.has(c.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Complaints not found.' };
    await writeJson('complaints', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

export async function lookupComplaintStatus(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const list = await readJson('complaints', buildInitialComplaints);
  return list
    .filter((c) => c.ticketNo.toLowerCase() === q || (c.email && c.email.toLowerCase() === q))
    .map((c) => ({
      ticketNo: c.ticketNo,
      complainantName: c.complainantName,
      category: c.category,
      subject: c.subject,
      status: c.status,
      adminRemark: c.adminRemark,
      createdAt: String(c.createdAt || '').slice(0, 10),
      updatedAt: String(c.updatedAt || '').slice(0, 10),
    }));
}

// ---------------------------------------------------------------------------
// Enquiries Management
// ---------------------------------------------------------------------------

export async function listEnquiries({ status = 'all' } = {}) {
  const items = await readJson('enquiries', buildInitialEnquiries);
  const s = String(status || 'all').toLowerCase();
  return items
    .filter((e) => (s === 'all' ? true : String(e.status || 'new').toLowerCase() === s))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function replyToEnquiry(id, { adminReply, status = 'replied' }) {
  const cleanReply = String(adminReply || '').trim().slice(0, 2000);
  if (!cleanReply) return { ok: false, status: 400, error: 'Reply message is required.' };
  return withLock('enquiries', async () => {
    const list = await readJson('enquiries', buildInitialEnquiries);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Enquiry not found.' };
    list[idx].adminReply = cleanReply;
    list[idx].status = ['new', 'replied', 'closed'].includes(status) ? status : 'replied';
    list[idx].repliedAt = new Date().toISOString();
    await writeJson('enquiries', list);
    return { ok: true, status: 200, enquiry: list[idx] };
  });
}

export async function deleteEnquiries(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select enquiry record(s) to delete.' };
  return withLock('enquiries', async () => {
    const list = await readJson('enquiries', buildInitialEnquiries);
    const remaining = list.filter((e) => !idSet.has(e.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Enquiries not found.' };
    await writeJson('enquiries', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}
