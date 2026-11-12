// Server-only durable store for Donations, Receipts, Payment Gateway Sandbox Sessions,
// Crowdfunding Campaigns, Coordinators, Coordinator Donations, Other/Item Donations, and AutoPay Mandates.

import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { Storage } from '@google-cloud/storage';
import { CAMPAIGN_CATEGORIES, DONATION_PURPOSE_PRESETS } from './finance-constants';

export { CAMPAIGN_CATEGORIES, DONATION_PURPOSE_PRESETS };

const scryptAsync = promisify(scryptCb);

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
    process.env.FINANCE_DATA_DIR,
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'finance'),
    path.join(tmpdir(), 'gsdd-finance-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const target = dir.endsWith('finance') ? dir : path.join(dir, 'finance');
      if (!existsSync(target)) mkdirSync(target, { recursive: true });
      return target;
    } catch {}
  }
  const fallback = path.join(tmpdir(), 'gsdd-finance-data');
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
    const file = bucket.file(`finance/${name}.json`);
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
    await bucket.file(`finance/${name}.json`).save(payload, {
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

// ---------------------------------------------------------------------------
// Seed Builders
// ---------------------------------------------------------------------------

function buildInitialDonations() {
  const now = new Date();
  const dDaysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: 'don-f-101',
      receiptNo: 'GSDD-RCP-2026-0101',
      source: 'member',
      donorName: 'Rohan Kumar',
      email: 'rohan@example.org',
      phone: '9876501122',
      pan: 'ABCDE1234F',
      address: 'Raniganj, Araria, Bihar',
      amount: 2500,
      purpose: 'Education',
      method: 'Razorpay',
      status: 'Success',
      referralCode: '',
      utr: 'RZP2026030101',
      campaignId: 'cmp-digital-kits',
      createdAt: dDaysAgo(0),
    },
    {
      id: 'don-f-102',
      receiptNo: 'GSDD-RCP-2026-0102',
      source: 'visitor',
      donorName: 'Ananya Verma',
      email: 'ananya@example.org',
      phone: '9835044556',
      pan: '',
      address: 'Purnia, Bihar',
      amount: 5100,
      purpose: 'Healthcare',
      method: 'PhonePe NetBanking',
      status: 'Success',
      referralCode: 'NGO-2026-0032',
      utr: 'PPNB2026030201',
      campaignId: 'cmp-health-camp',
      createdAt: dDaysAgo(2),
    },
    {
      id: 'don-f-103',
      receiptNo: 'GSDD-RCP-2026-0103',
      source: 'receipt',
      donorName: 'Maheshwari Enterprise Trust',
      email: 'accounts@maheshwaritrust.example',
      phone: '9431209876',
      pan: 'AABTM9988K',
      address: 'Katihar, Bihar',
      amount: 15000,
      purpose: 'Women Empowerment',
      method: 'Bank Transfer',
      status: 'Success',
      referralCode: '',
      utr: 'NEFT88776655',
      campaignId: '',
      createdAt: dDaysAgo(10),
    },
    {
      id: 'don-f-104',
      receiptNo: 'GSDD-RCP-2026-0104',
      source: 'visitor',
      donorName: 'Sandeep Sinha',
      email: 'sandeep@example.org',
      phone: '9123498765',
      pan: '',
      address: 'Patna, Bihar',
      amount: 1100,
      purpose: 'Child Welfare',
      method: 'UPI',
      status: 'Pending',
      referralCode: '',
      utr: 'UPI6655443322',
      campaignId: '',
      createdAt: dDaysAgo(1),
    },
  ];
}

function buildInitialCampaigns() {
  return [
    {
      id: 'cmp-digital-kits',
      slug: 'digital-literacy-classroom-kits',
      title: 'Rural Youth Digital Literacy & Computer Kits',
      category: 'Education Support',
      goalAmount: 250000,
      raisedAmount: 132500,
      donorsCount: 42,
      status: 'Active',
      startDate: '2026-02-01',
      endDate: '2026-09-30',
      description:
        'Equipping community learning hubs in Raniganj and Araria with refurbished laptops, dual-band connectivity, and offline coding/citizen-services curriculum.',
      createdAt: '2026-02-01T08:00:00.000Z',
    },
    {
      id: 'cmp-health-camp',
      slug: 'maternal-health-preventive-camps',
      title: 'Maternal Hygiene & Preventive Screening Drives',
      category: 'Healthcare & Medical Aid',
      goalAmount: 180000,
      raisedAmount: 94100,
      donorsCount: 31,
      status: 'Active',
      startDate: '2026-02-15',
      endDate: '2026-10-31',
      description:
        'Funding community diagnostics, sanitary kit distribution, and preventive nutrition camps in underserved panchayats.',
      createdAt: '2026-02-15T09:00:00.000Z',
    },
    {
      id: 'cmp-women-tailoring',
      slug: 'women-self-help-tailoring-cooperatives',
      title: 'Women Self-Help Tailoring & Entrepreneurship Cohort',
      category: 'Women Empowerment',
      goalAmount: 120000,
      raisedAmount: 120000,
      donorsCount: 55,
      status: 'Completed',
      startDate: '2025-10-01',
      endDate: '2026-01-31',
      description:
        'Funded sewing machinery and design training for 30 rural women self-help group entrepreneurs.',
      createdAt: '2025-10-01T08:00:00.000Z',
    },
  ];
}

function buildInitialCoordinators() {
  // Note: Initial coordinator seed has no usable password until set via Admin Add/Reset Password
  return [
    {
      id: 'coord-1',
      code: 'COORD-AR-01',
      name: 'Prakash Narayan',
      email: 'prakash.coord@gsddfoundation.org',
      phone: '9835012345',
      district: 'Araria',
      state: 'Bihar',
      designation: 'District Coordinator',
      status: 'Active',
      passwordHash: null,
      joinedAt: '2026-01-15',
    },
    {
      id: 'coord-2',
      code: 'COORD-PU-02',
      name: 'Sunita Kumari',
      email: 'sunita.coord@gsddfoundation.org',
      phone: '9431098765',
      district: 'Purnia',
      state: 'Bihar',
      designation: 'Block Outreach Coordinator',
      status: 'Active',
      passwordHash: null,
      joinedAt: '2026-02-05',
    },
  ];
}

function buildInitialCoordinatorDonations() {
  const now = new Date();
  const dDaysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  return [
    {
      id: 'cdon-1',
      receiptNo: 'GSDD-CRD-2026-001',
      coordinatorId: 'coord-1',
      coordinatorName: 'Prakash Narayan',
      donorName: 'Kamleshwar Jha',
      donorPhone: '9934501122',
      amount: 3500,
      method: 'Direct QR',
      purpose: 'Education',
      proofRef: 'QR-TXN-88412099',
      proofNote: 'Verified bank credit on foundation QR statement',
      status: 'Completed',
      rejectionReason: '',
      createdAt: dDaysAgo(3),
    },
    {
      id: 'cdon-2',
      receiptNo: 'GSDD-CRD-2026-002',
      coordinatorId: 'coord-2',
      coordinatorName: 'Sunita Kumari',
      donorName: 'Meena Devi SHG',
      donorPhone: '9801234567',
      amount: 1200,
      method: 'Cash',
      purpose: 'Community Development',
      proofRef: 'RCP-BOOK-44/12',
      proofNote: 'Field receipt book page #12 signed',
      status: 'Pending',
      rejectionReason: '',
      createdAt: dDaysAgo(0),
    },
  ];
}

function buildInitialOtherDonations() {
  return [
    {
      id: 'odon-1',
      donationNo: 'GSDD-ITEM-2026-001',
      donorName: 'Araria Book Suppliers Guild',
      email: 'guild@example.org',
      category: 'Educational Books & Stationery',
      items: [
        { itemName: 'Primary Computer Workbooks', quantity: 120, unit: 'Copies' },
        { itemName: 'Geometry & Writing Kits', quantity: 80, unit: 'Sets' },
      ],
      date: '2026-03-08',
      receivedBy: 'Prakash Narayan',
      condition: 'New',
      notes: 'Distributed during Raniganj school workshop.',
      createdAt: '2026-03-08T10:00:00.000Z',
    },
    {
      id: 'odon-2',
      donationNo: 'GSDD-ITEM-2026-002',
      donorName: 'Dr. R. K. Memorial Clinic',
      email: 'clinic@example.org',
      category: 'Medical & Hygiene Supplies',
      items: [
        { itemName: 'First Aid & ORS Packs', quantity: 200, unit: 'Packs' },
      ],
      date: '2026-03-14',
      receivedBy: 'Sunita Kumari',
      condition: 'New',
      notes: 'Stocked for preventive health camp.',
      createdAt: '2026-03-14T14:00:00.000Z',
    },
  ];
}

function buildInitialAutoPayMandates() {
  return [
    {
      id: 'ap-1',
      mandateRef: 'GSDD-AP-2026-1001',
      donorName: 'Sahanur Alom',
      email: 'sahanur@example.org',
      phone: '9876543210',
      amount: 500,
      frequency: 'Monthly',
      purpose: 'Education Support',
      gateway: 'PhonePe AutoPay',
      status: 'Active',
      nextDebitDate: '2026-04-05',
      createdAt: '2026-02-05T09:00:00.000Z',
      payments: [
        { txId: 'AP-TX-9001', amount: 500, paidAt: '2026-02-05T09:05:00.000Z', status: 'Success' },
        { txId: 'AP-TX-9045', amount: 500, paidAt: '2026-03-05T09:02:00.000Z', status: 'Success' },
      ],
    },
    {
      id: 'ap-2',
      mandateRef: 'GSDD-AP-2026-1002',
      donorName: 'Neha Choudhary',
      email: 'neha.c@example.org',
      phone: '9835099887',
      amount: 1000,
      frequency: 'Monthly',
      purpose: 'Women Empowerment',
      gateway: 'Razorpay eMandate',
      status: 'Active',
      nextDebitDate: '2026-04-10',
      createdAt: '2026-03-10T11:30:00.000Z',
      payments: [
        { txId: 'AP-TX-9102', amount: 1000, paidAt: '2026-03-10T11:32:00.000Z', status: 'Success' },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Date Preset Filtering Helper
// ---------------------------------------------------------------------------

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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86400000;

  if (p === 'today') return ts >= startOfToday;
  if (p === 'yesterday') return ts >= startOfToday - dayMs && ts < startOfToday;
  if (p === 'this_week') return ts >= startOfToday - 7 * dayMs;
  if (p === 'last_2_weeks') return ts >= startOfToday - 14 * dayMs;
  if (p === 'this_month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return ts >= monthStart;
  }
  if (p === 'last_3_months') {
    return ts >= startOfToday - 90 * dayMs;
  }
  return true;
}

export function toCsv(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
}

// ---------------------------------------------------------------------------
// Donations & Receipts CRUD
// ---------------------------------------------------------------------------

export async function listFinanceDonations({
  source = 'all',
  status = 'all',
  preset = 'all',
  from = '',
  to = '',
  search = '',
} = {}) {
  const items = await readJson('donations', buildInitialDonations);
  const sSrc = String(source || 'all').toLowerCase();
  const sStat = String(status || 'all').toLowerCase();
  const q = String(search || '').trim().toLowerCase();

  return items
    .filter((d) => {
      if (sSrc !== 'all' && String(d.source || '').toLowerCase() !== sSrc) return false;
      if (sStat === 'success' || sStat === 'paid') {
        if (!['success', 'paid', 'completed'].includes(String(d.status || '').toLowerCase())) return false;
      } else if (sStat !== 'all' && String(d.status || '').toLowerCase() !== sStat) {
        return false;
      }
      if (!matchesDatePreset(d.createdAt, preset, from, to)) return false;
      if (q) {
        const hay = `${d.receiptNo} ${d.donorName} ${d.email} ${d.phone} ${d.purpose} ${d.utr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function searchPublicDonations(query = '') {
  const all = await readJson('donations', buildInitialDonations);
  const q = String(query || '').trim().toLowerCase();
  const paidOnly = all.filter((d) =>
    ['success', 'paid', 'completed'].includes(String(d.status || '').toLowerCase())
  );
  const filtered = q
    ? paidOnly.filter((d) =>
        `${d.receiptNo} ${d.donorName} ${d.purpose}`.toLowerCase().includes(q)
      )
    : paidOnly;

  return filtered.slice(0, 40).map((d) => ({
    id: d.id,
    receiptNo: d.receiptNo,
    donorName: d.donorName,
    amount: Number(d.amount || 0),
    purpose: d.purpose,
    method: d.method,
    status: d.status,
    date: String(d.createdAt || '').slice(0, 10),
  }));
}

export async function createFinanceDonation(payload = {}) {
  const amount = Number(payload.amount);
  const donorName = String(payload.donorName || '').trim().slice(0, 140);
  if (!donorName) return { ok: false, status: 400, error: 'Donor name is required.' };
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, status: 400, error: 'Donation amount must be at least Rs. 1.' };
  }

  return withLock('donations', async () => {
    const list = await readJson('donations', buildInitialDonations);
    const now = new Date().toISOString();
    const seq = String(list.length + 101).padStart(4, '0');
    const record = {
      id: `don-${randomUUID().slice(0, 8)}`,
      receiptNo: `GSDD-RCP-${new Date().getFullYear()}-${seq}`,
      source: ['member', 'visitor', 'receipt', 'campaign'].includes(String(payload.source || '').toLowerCase())
        ? String(payload.source).toLowerCase()
        : 'receipt',
      donorName,
      email: String(payload.email || '').trim().slice(0, 160),
      phone: String(payload.phone || '').trim().slice(0, 24),
      pan: String(payload.pan || '').trim().toUpperCase().slice(0, 20),
      address: String(payload.address || '').trim().slice(0, 260),
      amount: Math.round(amount),
      purpose: String(payload.purpose || 'General Fund').trim().slice(0, 120),
      method: String(payload.method || 'Cash').trim().slice(0, 60),
      status: ['Success', 'Pending', 'Failed'].includes(String(payload.status || ''))
        ? payload.status
        : 'Success',
      referralCode: String(payload.referralCode || '').trim().slice(0, 40),
      utr: String(payload.utr || `TXN-${randomBytes(4).toString('hex').toUpperCase()}`).trim().slice(0, 80),
      campaignId: String(payload.campaignId || '').trim().slice(0, 60),
      createdAt: payload.createdAt || now,
    };
    list.unshift(record);
    await writeJson('donations', list);

    if (record.campaignId && record.status === 'Success') {
      await applyDonationToCampaign(record.campaignId, record.amount);
    }
    return { ok: true, status: 201, donation: record };
  });
}

export async function updateFinanceDonation(id, patch = {}) {
  return withLock('donations', async () => {
    const list = await readJson('donations', buildInitialDonations);
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Donation record not found.' };

    const cur = list[idx];
    const next = {
      ...cur,
      donorName: typeof patch.donorName === 'string' && patch.donorName.trim()
        ? patch.donorName.trim().slice(0, 140) : cur.donorName,
      amount: Number.isFinite(Number(patch.amount)) && Number(patch.amount) >= 1
        ? Math.round(Number(patch.amount)) : cur.amount,
      purpose: typeof patch.purpose === 'string' && patch.purpose.trim()
        ? patch.purpose.trim().slice(0, 120) : cur.purpose,
      method: typeof patch.method === 'string' && patch.method.trim()
        ? patch.method.trim().slice(0, 60) : cur.method,
      status: ['Success', 'Pending', 'Failed'].includes(patch.status) ? patch.status : cur.status,
      utr: typeof patch.utr === 'string' && patch.utr.trim() ? patch.utr.trim().slice(0, 80) : cur.utr,
      pan: typeof patch.pan === 'string' ? patch.pan.trim().toUpperCase().slice(0, 20) : cur.pan,
    };
    list[idx] = next;
    await writeJson('donations', list);
    return { ok: true, status: 200, donation: next };
  });
}

export async function deleteFinanceDonations(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select at least one record.' };

  return withLock('donations', async () => {
    const list = await readJson('donations', buildInitialDonations);
    const remaining = list.filter((d) => !idSet.has(d.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'No matching donations found.' };
    await writeJson('donations', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Payment Gateway Sandbox (PhonePe NetBanking test/test & Razorpay Test)
// ---------------------------------------------------------------------------

export async function createGatewaySession(payload = {}) {
  const gateway = String(payload.gateway || 'phonepe').toLowerCase();
  if (!['phonepe', 'razorpay'].includes(gateway)) {
    return { ok: false, status: 400, error: 'Gateway must be phonepe or razorpay.' };
  }
  const amount = Number(payload.amount);
  const donorName = String(payload.donorName || '').trim().slice(0, 140);
  if (!donorName) return { ok: false, status: 400, error: 'Donor name is required.' };
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, status: 400, error: 'Minimum donation amount is Rs. 1.' };
  }

  return withLock('gateway-sessions', async () => {
    const sessions = await readJson('gateway-sessions', () => []);
    const session = {
      sessionId: `GWSESS-${randomUUID().slice(0, 10).toUpperCase()}`,
      gateway,
      mode: String(payload.mode || (gateway === 'phonepe' ? 'netbanking' : 'card')).slice(0, 40),
      source: String(payload.source || 'visitor').slice(0, 40),
      donorName,
      email: String(payload.email || '').trim().slice(0, 160),
      phone: String(payload.phone || '').trim().slice(0, 24),
      pan: String(payload.pan || '').trim().toUpperCase().slice(0, 20),
      address: String(payload.address || '').trim().slice(0, 260),
      amount: Math.round(amount),
      purpose: String(payload.purpose || 'General Fund').trim().slice(0, 120),
      campaignId: String(payload.campaignId || '').trim().slice(0, 60),
      referralCode: String(payload.referralCode || '').trim().slice(0, 40),
      frequency: String(payload.frequency || 'one-time').slice(0, 20),
      status: 'Created',
      createdAt: new Date().toISOString(),
    };
    const next = [session, ...sessions].slice(0, 200);
    await writeJson('gateway-sessions', next);
    return {
      ok: true,
      status: 201,
      session: {
        sessionId: session.sessionId,
        gateway: session.gateway,
        mode: session.mode,
        amount: session.amount,
        donorName: session.donorName,
        purpose: session.purpose,
        testHint: gateway === 'phonepe'
          ? 'PhonePe Net Banking Sandbox Test Credentials: Username "test", Password "test"'
          : 'Razorpay Test Checkout: Enter any simulated test UPI / Card reference',
      },
    };
  });
}

export async function verifyGatewaySession({ sessionId, username = '', password = '', simulatedRef = '' } = {}) {
  return withLock('gateway-sessions', async () => {
    const sessions = await readJson('gateway-sessions', () => []);
    const idx = sessions.findIndex((s) => s.sessionId === String(sessionId || '').trim());
    if (idx === -1) return { ok: false, status: 404, error: 'Payment session not found.' };

    const sess = sessions[idx];
    if (sess.status === 'Completed') {
      return { ok: false, status: 409, error: 'Payment session has already been verified.' };
    }

    if (sess.gateway === 'phonepe') {
      if (sess.mode === 'netbanking') {
        if (String(username).trim() !== 'test' || String(password) !== 'test') {
          return {
            ok: false,
            status: 401,
            error: 'Invalid PhonePe Net Banking sandbox credentials. Use username "test" and password "test".',
          };
        }
      }
    }

    const txRef = simulatedRef?.trim()
      ? String(simulatedRef).trim().slice(0, 60)
      : `${sess.gateway === 'phonepe' ? 'PPNB' : 'RZP'}-${randomBytes(4).toString('hex').toUpperCase()}`;

    sess.status = 'Completed';
    sess.txRef = txRef;
    sess.completedAt = new Date().toISOString();
    sessions[idx] = sess;
    await writeJson('gateway-sessions', sessions);

    if (sess.source === 'autopay') {
      const mandateRes = await registerAutoPayMandate({
        donorName: sess.donorName,
        email: sess.email,
        phone: sess.phone,
        amount: sess.amount,
        purpose: sess.purpose,
        gateway: sess.gateway === 'phonepe' ? 'PhonePe AutoPay' : 'Razorpay eMandate',
        initialTxId: txRef,
      });
      return { ok: true, status: 200, kind: 'autopay', txRef, mandate: mandateRes.mandate };
    }

    const donRes = await createFinanceDonation({
      source: sess.campaignId ? 'campaign' : sess.source,
      donorName: sess.donorName,
      email: sess.email,
      phone: sess.phone,
      pan: sess.pan,
      address: sess.address,
      amount: sess.amount,
      purpose: sess.purpose,
      method: sess.gateway === 'phonepe' ? 'PhonePe NetBanking' : 'Razorpay',
      status: 'Success',
      referralCode: sess.referralCode,
      utr: txRef,
      campaignId: sess.campaignId,
    });
    return { ok: true, status: 200, kind: 'donation', txRef, donation: donRes.donation };
  });
}

// ---------------------------------------------------------------------------
// Crowdfunding Campaigns CRUD
// ---------------------------------------------------------------------------

async function applyDonationToCampaign(campaignId, amount) {
  return withLock('campaigns', async () => {
    const list = await readJson('campaigns', buildInitialCampaigns);
    const idx = list.findIndex((c) => c.id === campaignId);
    if (idx === -1) return;
    list[idx].raisedAmount = Number(list[idx].raisedAmount || 0) + Number(amount || 0);
    list[idx].donorsCount = Number(list[idx].donorsCount || 0) + 1;
    if (list[idx].raisedAmount >= list[idx].goalAmount) {
      list[idx].status = 'Completed';
    }
    await writeJson('campaigns', list);
  });
}

export async function listCampaigns({ tab = 'all' } = {}) {
  const items = await readJson('campaigns', buildInitialCampaigns);
  const t = String(tab || 'all').toLowerCase();
  if (t === 'active') return items.filter((c) => c.status === 'Active');
  if (t === 'completed') return items.filter((c) => c.status === 'Completed');
  if (t === 'draft') return items.filter((c) => c.status === 'Draft');
  return items;
}

export async function createCampaign(payload = {}) {
  const title = String(payload.title || '').trim().slice(0, 180);
  const category = CAMPAIGN_CATEGORIES.includes(payload.category)
    ? payload.category
    : CAMPAIGN_CATEGORIES[0];
  const goalAmount = Number(payload.goalAmount);
  if (!title) return { ok: false, status: 400, error: 'Campaign title is required.' };
  if (!Number.isFinite(goalAmount) || goalAmount < 100) {
    return { ok: false, status: 400, error: 'Goal amount must be at least Rs. 100.' };
  }

  return withLock('campaigns', async () => {
    const list = await readJson('campaigns', buildInitialCampaigns);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}-${randomBytes(2).toString('hex')}`;
    const record = {
      id: `cmp-${randomUUID().slice(0, 8)}`,
      slug,
      title,
      category,
      goalAmount: Math.round(goalAmount),
      raisedAmount: Math.max(0, Math.round(Number(payload.raisedAmount || 0))),
      donorsCount: 0,
      status: ['Active', 'Draft', 'Completed'].includes(payload.status) ? payload.status : 'Active',
      startDate: String(payload.startDate || new Date().toISOString().slice(0, 10)),
      endDate: String(payload.endDate || '2026-12-31'),
      description: String(payload.description || '').trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };
    list.unshift(record);
    await writeJson('campaigns', list);
    return { ok: true, status: 201, campaign: record };
  });
}

export async function updateCampaign(id, patch = {}) {
  return withLock('campaigns', async () => {
    const list = await readJson('campaigns', buildInitialCampaigns);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Campaign not found.' };
    const cur = list[idx];
    list[idx] = {
      ...cur,
      title: typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim().slice(0, 180) : cur.title,
      category: CAMPAIGN_CATEGORIES.includes(patch.category) ? patch.category : cur.category,
      goalAmount: Number.isFinite(Number(patch.goalAmount)) && Number(patch.goalAmount) >= 100
        ? Math.round(Number(patch.goalAmount)) : cur.goalAmount,
      status: ['Active', 'Draft', 'Completed'].includes(patch.status) ? patch.status : cur.status,
      startDate: typeof patch.startDate === 'string' && patch.startDate ? patch.startDate : cur.startDate,
      endDate: typeof patch.endDate === 'string' && patch.endDate ? patch.endDate : cur.endDate,
      description: typeof patch.description === 'string' ? patch.description.trim().slice(0, 2000) : cur.description,
    };
    await writeJson('campaigns', list);
    return { ok: true, status: 200, campaign: list[idx] };
  });
}

export async function deleteCampaigns(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select at least one campaign.' };
  return withLock('campaigns', async () => {
    const list = await readJson('campaigns', buildInitialCampaigns);
    const remaining = list.filter((c) => !idSet.has(c.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Campaign not found.' };
    await writeJson('campaigns', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Coordinators & Coordinator Donations
// ---------------------------------------------------------------------------

function stripCoordSecret(c) {
  const { passwordHash: _pw, ...safe } = c;
  return { ...safe, hasPassword: Boolean(_pw) };
}

export async function listCoordinators({ tab = 'all' } = {}) {
  const items = await readJson('coordinators', buildInitialCoordinators);
  const filtered = String(tab).toLowerCase() === 'active'
    ? items.filter((c) => c.status === 'Active')
    : items;
  return filtered.map(stripCoordSecret);
}

export async function createCoordinator(payload = {}) {
  const name = String(payload.name || '').trim().slice(0, 120);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const phone = String(payload.phone || '').trim().slice(0, 24);
  if (!name || !email) {
    return { ok: false, status: 400, error: 'Coordinator name and email are required.' };
  }

  let passwordHash = null;
  if (typeof payload.password === 'string' && payload.password.length >= 6) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(payload.password, salt, 64);
    passwordHash = `${salt}:${derived.toString('hex')}`;
  }

  return withLock('coordinators', async () => {
    const list = await readJson('coordinators', buildInitialCoordinators);
    if (list.some((c) => c.email.toLowerCase() === email)) {
      return { ok: false, status: 409, error: 'A coordinator with this email already exists.' };
    }
    const record = {
      id: `coord-${randomUUID().slice(0, 8)}`,
      code: String(payload.code || `COORD-${String(list.length + 1).padStart(3, '0')}`).trim().slice(0, 32),
      name,
      email,
      phone,
      district: String(payload.district || 'Araria').trim().slice(0, 80),
      state: String(payload.state || 'Bihar').trim().slice(0, 80),
      designation: String(payload.designation || 'Field Coordinator').trim().slice(0, 100),
      status: ['Active', 'Inactive'].includes(payload.status) ? payload.status : 'Active',
      passwordHash,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    list.unshift(record);
    await writeJson('coordinators', list);
    return { ok: true, status: 201, coordinator: stripCoordSecret(record) };
  });
}

export async function updateCoordinator(id, patch = {}) {
  return withLock('coordinators', async () => {
    const list = await readJson('coordinators', buildInitialCoordinators);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Coordinator not found.' };
    const cur = list[idx];

    let passwordHash = cur.passwordHash;
    if (typeof patch.password === 'string' && patch.password.length >= 6) {
      const salt = randomBytes(16).toString('hex');
      const derived = await scryptAsync(patch.password, salt, 64);
      passwordHash = `${salt}:${derived.toString('hex')}`;
    }

    list[idx] = {
      ...cur,
      name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 120) : cur.name,
      phone: typeof patch.phone === 'string' ? patch.phone.trim().slice(0, 24) : cur.phone,
      district: typeof patch.district === 'string' ? patch.district.trim().slice(0, 80) : cur.district,
      state: typeof patch.state === 'string' ? patch.state.trim().slice(0, 80) : cur.state,
      designation: typeof patch.designation === 'string' && patch.designation.trim()
        ? patch.designation.trim().slice(0, 100) : cur.designation,
      status: ['Active', 'Inactive'].includes(patch.status) ? patch.status : cur.status,
      passwordHash,
    };
    await writeJson('coordinators', list);
    return { ok: true, status: 200, coordinator: stripCoordSecret(list[idx]) };
  });
}

export async function deleteCoordinators(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Provide coordinator id(s).' };
  return withLock('coordinators', async () => {
    const list = await readJson('coordinators', buildInitialCoordinators);
    const remaining = list.filter((c) => !idSet.has(c.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Coordinator not found.' };
    await writeJson('coordinators', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

export async function verifyCoordinatorCredentials(identifier, password) {
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanPw = String(password || '');
  if (!cleanId || !cleanPw) return null;

  const list = await readJson('coordinators', buildInitialCoordinators);
  const coord = list.find(
    (c) =>
      c.status === 'Active' &&
      (c.email.toLowerCase() === cleanId || c.code.toLowerCase() === cleanId)
  );
  if (!coord || !coord.passwordHash) return null;

  const [salt, hex] = coord.passwordHash.split(':');
  if (!salt || !hex) return null;
  const derived = await scryptAsync(cleanPw, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  if (expected.length !== derived.length || !timingSafeEqual(derived, expected)) {
    return null;
  }
  return stripCoordSecret(coord);
}

export async function getCoordinatorById(id) {
  const list = await readJson('coordinators', buildInitialCoordinators);
  const found = list.find((c) => c.id === id);
  return found ? stripCoordSecret(found) : null;
}

export async function listCoordinatorDonations({
  coordinatorId = 'all',
  method = 'all',
  status = 'all',
  preset = 'all',
  from = '',
  to = '',
} = {}) {
  const items = await readJson('coordinator-donations', buildInitialCoordinatorDonations);
  const sStat = String(status || 'all').toLowerCase();
  const sMeth = String(method || 'all').toLowerCase();

  return items
    .filter((d) => {
      if (coordinatorId && coordinatorId !== 'all' && d.coordinatorId !== coordinatorId) return false;
      if (sMeth !== 'all' && String(d.method || '').toLowerCase() !== sMeth) return false;
      if (sStat !== 'all' && String(d.status || '').toLowerCase() !== sStat) return false;
      if (!matchesDatePreset(d.createdAt, preset, from, to)) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createCoordinatorDonation(payload = {}) {
  const amount = Number(payload.amount);
  const donorName = String(payload.donorName || '').trim().slice(0, 140);
  const coordinatorId = String(payload.coordinatorId || '').trim();
  if (!donorName || !coordinatorId) {
    return { ok: false, status: 400, error: 'Donor name and coordinator are required.' };
  }
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, status: 400, error: 'Amount must be at least Rs. 1.' };
  }

  return withLock('coordinator-donations', async () => {
    const coords = await readJson('coordinators', buildInitialCoordinators);
    const coord = coords.find((c) => c.id === coordinatorId);
    const items = await readJson('coordinator-donations', buildInitialCoordinatorDonations);
    const seq = String(items.length + 1).padStart(3, '0');
    const record = {
      id: `cdon-${randomUUID().slice(0, 8)}`,
      receiptNo: `GSDD-CRD-${new Date().getFullYear()}-${seq}`,
      coordinatorId,
      coordinatorName: coord ? coord.name : String(payload.coordinatorName || 'Coordinator'),
      donorName,
      donorPhone: String(payload.donorPhone || '').trim().slice(0, 24),
      amount: Math.round(amount),
      method: ['Online', 'Cash', 'Direct QR'].includes(payload.method) ? payload.method : 'Direct QR',
      purpose: String(payload.purpose || 'General Fund').trim().slice(0, 120),
      proofRef: String(payload.proofRef || `REF-${randomBytes(3).toString('hex').toUpperCase()}`).trim().slice(0, 120),
      proofNote: String(payload.proofNote || '').trim().slice(0, 300),
      status: ['Completed', 'Pending', 'Rejected'].includes(payload.status) ? payload.status : 'Pending',
      rejectionReason: '',
      createdAt: new Date().toISOString(),
    };
    items.unshift(record);
    await writeJson('coordinator-donations', items);
    return { ok: true, status: 201, donation: record };
  });
}

export async function updateCoordinatorDonationStatus(id, { status, rejectionReason = '' }) {
  if (!['Completed', 'Pending', 'Rejected'].includes(status)) {
    return { ok: false, status: 400, error: 'Invalid status.' };
  }
  return withLock('coordinator-donations', async () => {
    const items = await readJson('coordinator-donations', buildInitialCoordinatorDonations);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'Coordinator donation not found.' };
    items[idx].status = status;
    items[idx].rejectionReason = status === 'Rejected' ? String(rejectionReason || 'Verification rejected').slice(0, 300) : '';
    await writeJson('coordinator-donations', items);
    return { ok: true, status: 200, donation: items[idx] };
  });
}

export async function deleteCoordinatorDonations(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select records to delete.' };
  return withLock('coordinator-donations', async () => {
    const items = await readJson('coordinator-donations', buildInitialCoordinatorDonations);
    const remaining = items.filter((i) => !idSet.has(i.id));
    if (remaining.length === items.length) return { ok: false, status: 404, error: 'Records not found.' };
    await writeJson('coordinator-donations', remaining);
    return { ok: true, status: 200, deletedCount: items.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// Other / Non-Monetary Item Donations
// ---------------------------------------------------------------------------

export async function listOtherDonations({ preset = 'all', from = '', to = '' } = {}) {
  const items = await readJson('other-donations', buildInitialOtherDonations);
  return items
    .filter((i) => matchesDatePreset(i.createdAt || i.date, preset, from, to))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function createOtherDonation(payload = {}) {
  const donorName = String(payload.donorName || '').trim().slice(0, 140);
  const category = String(payload.category || '').trim().slice(0, 120);
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const cleanItems = rawItems
    .map((it) => ({
      itemName: String(it?.itemName || '').trim().slice(0, 120),
      quantity: Math.max(1, Number(it?.quantity || 1)),
      unit: String(it?.unit || 'Units').trim().slice(0, 32),
    }))
    .filter((it) => it.itemName);

  if (!donorName || !category || cleanItems.length === 0) {
    return { ok: false, status: 400, error: 'Donor name, category, and at least one item are required.' };
  }

  return withLock('other-donations', async () => {
    const list = await readJson('other-donations', buildInitialOtherDonations);
    const seq = String(list.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const record = {
      id: `odon-${randomUUID().slice(0, 8)}`,
      donationNo: `GSDD-ITEM-${new Date().getFullYear()}-${seq}`,
      donorName,
      email: String(payload.email || '').trim().slice(0, 160),
      category,
      items: cleanItems,
      date: String(payload.date || now.slice(0, 10)),
      receivedBy: String(payload.receivedBy || 'Admin Office').trim().slice(0, 100),
      condition: ['New', 'Gently Used', 'Good'].includes(payload.condition) ? payload.condition : 'New',
      notes: String(payload.notes || '').trim().slice(0, 500),
      createdAt: now,
    };
    list.unshift(record);
    await writeJson('other-donations', list);
    return { ok: true, status: 201, donation: record };
  });
}

export async function deleteOtherDonations(ids = []) {
  const idSet = new Set((Array.isArray(ids) ? ids : [ids]).map((v) => String(v || '').trim()).filter(Boolean));
  if (!idSet.size) return { ok: false, status: 400, error: 'Select records to delete.' };
  return withLock('other-donations', async () => {
    const list = await readJson('other-donations', buildInitialOtherDonations);
    const remaining = list.filter((i) => !idSet.has(i.id));
    if (remaining.length === list.length) return { ok: false, status: 404, error: 'Records not found.' };
    await writeJson('other-donations', remaining);
    return { ok: true, status: 200, deletedCount: list.length - remaining.length };
  });
}

// ---------------------------------------------------------------------------
// AutoPay Mandates & History
// ---------------------------------------------------------------------------

export async function listAutoPayMandates({ query = '' } = {}) {
  const items = await readJson('autopay-mandates', buildInitialAutoPayMandates);
  const q = String(query || '').trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (m) =>
      m.mandateRef.toLowerCase() === q ||
      m.email.toLowerCase() === q ||
      m.phone === q
  );
}

export async function registerAutoPayMandate(payload = {}) {
  const donorName = String(payload.donorName || '').trim().slice(0, 140);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 160);
  const amount = Number(payload.amount);
  if (!donorName || !email || !Number.isFinite(amount) || amount < 50) {
    return { ok: false, status: 400, error: 'Donor name, email, and monthly amount >= Rs. 50 required.' };
  }

  return withLock('autopay-mandates', async () => {
    const list = await readJson('autopay-mandates', buildInitialAutoPayMandates);
    const seq = 1001 + list.length;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().slice(0, 10);
    const mandate = {
      id: `ap-${randomUUID().slice(0, 8)}`,
      mandateRef: `GSDD-AP-${now.getFullYear()}-${seq}`,
      donorName,
      email,
      phone: String(payload.phone || '').trim().slice(0, 24),
      amount: Math.round(amount),
      frequency: 'Monthly',
      purpose: String(payload.purpose || 'General Fund').trim().slice(0, 120),
      gateway: String(payload.gateway || 'PhonePe AutoPay').slice(0, 40),
      status: 'Active',
      nextDebitDate: nextMonth,
      createdAt: now.toISOString(),
      payments: [
        {
          txId: payload.initialTxId || `AP-TX-${randomBytes(3).toString('hex').toUpperCase()}`,
          amount: Math.round(amount),
          paidAt: now.toISOString(),
          status: 'Success',
        },
      ],
    };
    list.unshift(mandate);
    await writeJson('autopay-mandates', list);
    return { ok: true, status: 201, mandate };
  });
}

export async function updateAutoPayMandateStatus(id, { status, triggerDebit = false }) {
  return withLock('autopay-mandates', async () => {
    const list = await readJson('autopay-mandates', buildInitialAutoPayMandates);
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return { ok: false, status: 404, error: 'AutoPay mandate not found.' };

    if (triggerDebit) {
      if (list[idx].status !== 'Active') {
        return { ok: false, status: 400, error: 'Only Active mandates can process recurring debit.' };
      }
      list[idx].payments.unshift({
        txId: `AP-TX-${randomBytes(3).toString('hex').toUpperCase()}`,
        amount: list[idx].amount,
        paidAt: new Date().toISOString(),
        status: 'Success',
      });
    } else if (['Active', 'Paused', 'Cancelled'].includes(status)) {
      list[idx].status = status;
    } else {
      return { ok: false, status: 400, error: 'Invalid AutoPay status.' };
    }

    await writeJson('autopay-mandates', list);
    return { ok: true, status: 200, mandate: list[idx] };
  });
}

export function digestSessionSecret(rawSecret) {
  return createHash('sha256').update(`coord:${rawSecret}`).digest('hex');
}
