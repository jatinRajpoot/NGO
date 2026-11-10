// Server-only durable portal store for Visitor, Member, and Donor workflows.
// Persists JSON collections to GCS when GALLERY_BUCKET is configured, or atomically
// to PORTAL_DATA_DIR / ADMIN_DATA_DIR / .data/portal locally.

import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';
import { organization } from '../data/site-data';
import { hashPassword, verifyPassword } from './portal-auth';
import { dispatchNotification } from './notifier';

let cachedGcsClient = null;
const collectionLocks = new Map();

function withLock(name, fn) {
  const prev = collectionLocks.get(name) || Promise.resolve();
  const next = prev.then(fn, fn);
  collectionLocks.set(name, next.catch(() => {}));
  return next;
}

function getDataDir() {
  const candidates = [
    process.env.PORTAL_DATA_DIR,
    process.env.ADMIN_DATA_DIR,
    path.join(process.cwd(), '.data', 'portal'),
    path.join(tmpdir(), 'gsdd-portal-data'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // Try next directory
    }
  }
  return path.join(tmpdir(), 'gsdd-portal-data');
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

async function readCollection(name, createInitialFn) {
  const bucket = getGcsBucket();
  if (bucket) {
    const file = bucket.file(`portal/${name}.json`);
    try {
      const [contents] = await file.download();
      return JSON.parse(contents.toString('utf8'));
    } catch (err) {
      if (err?.code === 404 || err?.status === 404 || err?.statusCode === 404) {
        const initial = await createInitialFn();
        await writeCollection(name, initial);
        return initial;
      }
      throw err;
    }
  }

  const filePath = path.join(getDataDir(), `${name}.json`);
  if (!existsSync(filePath)) {
    const initial = await createInitialFn();
    await writeCollection(name, initial);
    return initial;
  }
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeCollection(name, data) {
  const payload = JSON.stringify(data, null, 2);
  const bucket = getGcsBucket();
  if (bucket) {
    await bucket.file(`portal/${name}.json`).save(payload, {
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

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function sanitizeMember(member) {
  if (!member) return null;
  const { passwordHash, ...safe } = member;
  return safe;
}

function sanitizeDonor(donor) {
  if (!donor) return null;
  const { passwordHash, ...safe } = donor;
  return safe;
}

function normalizePhoneDigits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function normalizeUtr(value) {
  return String(value || '').trim().toUpperCase();
}

function computeDonorTier(totalVerified) {
  if (totalVerified >= 50000) return 'Platinum Benefactor';
  if (totalVerified >= 25000) return 'Gold Patron';
  return 'Silver Donor';
}

// ---------------------------------------------------------------------------
// Initial Seed Factories (server-hashed passwords, official identifiers)
// ---------------------------------------------------------------------------

async function buildInitialMembers() {
  const demoHash1 = await hashPassword('password123');
  const demoHash2 = await hashPassword('password123');
  return [
    {
      id: 'GSDD-M-2026-001',
      name: 'Dr. Ramesh Kumar Sharma',
      fatherSpouse: 'Late K. N. Sharma',
      phone: '+91 98350 12345',
      email: 'ramesh.sharma@example.com',
      passwordHash: demoHash1,
      tokenVersion: 1,
      isDemoAccount: true,
      address: 'Raniganj Bazar, Araria, Bihar - 854334',
      designation: 'Patron',
      category: 'Life Member',
      feeType: 'Life (₹11,000)',
      feeAmount: 11000,
      feeStatus: 'Paid',
      status: 'Active',
      joinDate: '2026-01-10',
      validTill: 'Lifetime',
      bloodGroup: 'O+',
      avatar: '',
      bio: 'Senior medical advisor, patron and honorary founder trustee.',
      referralCode: 'RAMESH2026',
      referralCount: 14,
      activities: [
        { id: 'act-1', title: 'Raniganj Free Health Camp Screening', date: '2026-02-18', role: 'Lead Medical Advisor', status: 'Completed' },
        { id: 'act-2', title: 'Annual General Meeting 2026', date: '2026-01-25', role: 'Patron Speaker', status: 'Attended' },
        { id: 'act-3', title: 'Community Digital Health Orientation', date: '2026-03-01', role: 'Advisor', status: 'Completed' },
      ],
      certificates: [
        { id: 'cert-1', certNo: 'GSDD-M-2026-001', title: 'Official Life Membership Certificate', type: 'Membership Certificate', date: '2026-01-10', authority: 'Executive Body, GSDD' },
        { id: 'cert-2', certNo: 'GSDD-APT-2026-001', title: 'Appointment Letter - Chief Patron & Medical Advisor', type: 'Appointment Letter', date: '2026-01-15', authority: 'President, GSDD' },
        { id: 'cert-3', certNo: 'GSDD-ACH-2026-081', title: 'Certificate of Excellence & Humanitarian Service', type: 'Achievement Certificate', date: '2026-02-28', authority: 'President, GSDD' },
      ],
      notifications: {
        emailUpdates: true,
        whatsappUpdates: true,
        meetingAlerts: true,
        donationReceipts: true,
      },
      messages: [
        { id: 'msg-1', sender: 'Admin Office', text: 'Welcome Dr. Sharma to the GSDD Executive Board portal.', date: '2026-01-11', unread: false, deliveryStatus: 'delivered' },
        { id: 'msg-2', sender: 'General Secretary', text: 'Your quarterly healthcare initiative agenda has been approved.', date: '2026-02-20', unread: false, deliveryStatus: 'delivered' },
      ],
    },
    {
      id: 'GSDD-M-2026-002',
      name: 'Sunita Devi',
      fatherSpouse: 'Manoj Mandal',
      phone: '+91 94312 98765',
      email: 'sunita.devi@example.com',
      passwordHash: demoHash2,
      tokenVersion: 1,
      isDemoAccount: true,
      address: 'Ward No 4, Raniganj, Araria, Bihar - 854334',
      designation: 'Vice President',
      category: 'Executive Member',
      feeType: 'Annual (₹1,200)',
      feeAmount: 1200,
      feeStatus: 'Paid',
      status: 'Active',
      joinDate: '2026-01-15',
      validTill: '2027-01-14',
      bloodGroup: 'B+',
      avatar: '',
      bio: 'Leads grassroots women self-help groups and vocational training workshops.',
      referralCode: 'SUNITA2026',
      referralCount: 8,
      activities: [
        { id: 'act-1', title: 'Women Tailoring & Handicrafts Exhibition', date: '2026-02-22', role: 'Organizing Head', status: 'Completed' },
        { id: 'act-2', title: 'Self-Help Group Financial Literacy Drive', date: '2026-02-05', role: 'Trainer', status: 'Completed' },
      ],
      certificates: [
        { id: 'cert-1', certNo: 'GSDD-M-2026-002', title: 'Official Executive Membership Certificate', type: 'Membership Certificate', date: '2026-01-15', authority: 'Executive Body, GSDD' },
        { id: 'cert-2', certNo: 'GSDD-APT-2026-004', title: 'Appointment Letter - Vice President (Women Empowerment)', type: 'Appointment Letter', date: '2026-01-18', authority: 'President, GSDD' },
        { id: 'cert-3', certNo: 'GSDD-ACH-2026-082', title: 'Excellence Award in Community Mobilization', type: 'Achievement Certificate', date: '2026-03-02', authority: 'President, GSDD' },
      ],
      notifications: {
        emailUpdates: true,
        whatsappUpdates: true,
        meetingAlerts: true,
        donationReceipts: true,
      },
      messages: [
        { id: 'msg-1', sender: 'President', text: 'Thank you for successfully leading the Raniganj women workshop.', date: '2026-02-23', unread: false, deliveryStatus: 'delivered' },
      ],
    },
  ];
}

async function buildInitialDonors() {
  const demoHash1 = await hashPassword('password123');
  const demoHash2 = await hashPassword('password123');
  return [
    {
      id: 'GSDD-D-2026-101',
      name: 'Rajesh Patel',
      email: 'rajesh.patel@example.com',
      passwordHash: demoHash1,
      tokenVersion: 1,
      isDemoAccount: true,
      phone: '+91 98765 43210',
      pan: 'ABCDE1234F',
      city: 'Kolkata',
      state: 'West Bengal',
      pin: '700001',
      address: '42 Park Street, 3rd Floor, Kolkata',
      tier: 'Gold Patron',
      totalDonated: 38500,
      donationCount: 6,
      joinDate: '15 Jan 2025',
      profileBio: 'Passionate advocate for rural youth education, hygiene camps, and vocational skilling in Eastern India.',
      notifications: {
        emailReceipts: true,
        whatsappAlerts: true,
        monthlyReminders: true,
        quarterlyReports: true,
      },
      dispatchLog: [],
      certificates: [
        {
          id: 'GSDD-CERT-DONOR-2026-089',
          title: 'Patron Philanthropist Affiliation Certificate',
          category: 'Gold Category Benefactor',
          issueDate: '26 January 2026',
          authorizedBy: 'Executive Governing Board, GSDD Foundation',
          signatoryTitle: 'General Secretary & Founder Director',
          description: 'Sample recognition entry for demo donor profile.',
          isDemoSample: true,
        },
      ],
    },
    {
      id: 'GSDD-D-2026-102',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      passwordHash: demoHash2,
      tokenVersion: 1,
      isDemoAccount: true,
      phone: '+91 94340 12345',
      pan: 'PQRSX9876K',
      city: 'Asansol',
      state: 'West Bengal',
      pin: '713301',
      address: '18 Station Road, Ushagram, Asansol',
      tier: 'Silver Donor',
      totalDonated: 12000,
      donationCount: 3,
      joinDate: '10 Feb 2026',
      profileBio: 'Dedicated to girls education, STEM learning scholarships, and skill building for marginalized children.',
      notifications: {
        emailReceipts: true,
        whatsappAlerts: true,
        monthlyReminders: false,
        quarterlyReports: true,
      },
      dispatchLog: [],
      certificates: [
        {
          id: 'GSDD-CERT-DONOR-2026-092',
          title: 'Community Builder Donor Certificate',
          category: 'Silver Benefactor',
          issueDate: '15 February 2026',
          authorizedBy: 'Board of Trustees, GSDD Foundation',
          signatoryTitle: 'President & Founder Director',
          description: 'Sample recognition entry for demo donor profile.',
          isDemoSample: true,
        },
      ],
    },
  ];
}

async function buildInitialDonations() {
  return [
    {
      id: 'don-seed-1042',
      trackingId: 'TRK-GSDD-1042',
      receiptNo: 'GSDD-REC-2026-1042',
      source: 'member',
      memberId: 'GSDD-M-2026-001',
      donorId: null,
      donorName: 'Dr. Ramesh Kumar Sharma',
      email: 'ramesh.sharma@example.com',
      pan: 'ABCPS1234D',
      amount: 25000,
      date: '2026-03-02',
      program: 'Rural Health & Medicine Fund',
      method: 'UPI',
      utr: 'UPI/60411299841',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-1015',
      trackingId: 'TRK-GSDD-1015',
      receiptNo: 'GSDD-REC-2026-1015',
      source: 'member',
      memberId: 'GSDD-M-2026-001',
      donorId: null,
      donorName: 'Dr. Ramesh Kumar Sharma',
      email: 'ramesh.sharma@example.com',
      pan: 'ABCPS1234D',
      amount: 11000,
      date: '2026-01-10',
      program: 'Life Patron Corpus Fund',
      method: 'NEFT',
      utr: 'NEFT/SBI1094821',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-1033',
      trackingId: 'TRK-GSDD-1033',
      receiptNo: 'GSDD-REC-2026-1033',
      source: 'member',
      memberId: 'GSDD-M-2026-002',
      donorId: null,
      donorName: 'Sunita Devi',
      email: 'sunita.devi@example.com',
      pan: '',
      amount: 5000,
      date: '2026-02-14',
      program: 'Women Livelihood Equipment',
      method: 'UPI',
      utr: 'UPI/604558912',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-4401',
      trackingId: 'TRK-GSDD-4401',
      receiptNo: 'GSDD-REC-2026-4401',
      source: 'donor',
      memberId: null,
      donorId: 'GSDD-D-2026-101',
      donorName: 'Rajesh Patel',
      email: 'rajesh.patel@example.com',
      pan: 'ABCDE1234F',
      amount: 2500,
      date: '2026-03-01',
      program: 'Rural Healthcare & Mobile Health Units',
      method: 'UPI',
      utr: 'UPI/384910294821',
      frequency: 'monthly',
      type: 'Recurring Monthly',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-3982',
      trackingId: 'TRK-GSDD-3982',
      receiptNo: 'GSDD-REC-2026-3982',
      source: 'donor',
      memberId: null,
      donorId: 'GSDD-D-2026-101',
      donorName: 'Rajesh Patel',
      email: 'rajesh.patel@example.com',
      pan: 'ABCDE1234F',
      amount: 2500,
      date: '2026-02-01',
      program: 'Rural Healthcare & Mobile Health Units',
      method: 'UPI',
      utr: 'UPI/375820194820',
      frequency: 'monthly',
      type: 'Recurring Monthly',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-3105',
      trackingId: 'TRK-GSDD-3105',
      receiptNo: 'GSDD-REC-2026-3105',
      source: 'donor',
      memberId: null,
      donorId: 'GSDD-D-2026-101',
      donorName: 'Rajesh Patel',
      email: 'rajesh.patel@example.com',
      pan: 'ABCDE1234F',
      amount: 15000,
      date: '2026-01-12',
      program: 'Child Education & Digital Literacy',
      method: 'Bank Transfer (NEFT)',
      utr: 'NEFT/SBIN26011299834',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-4120',
      trackingId: 'TRK-GSDD-4120',
      receiptNo: 'GSDD-REC-2026-4120',
      source: 'donor',
      memberId: null,
      donorId: 'GSDD-D-2026-102',
      donorName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      pan: 'PQRSX9876K',
      amount: 5000,
      date: '2026-02-14',
      program: 'Child Education & Digital Literacy',
      method: 'UPI',
      utr: 'UPI/382910482019',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
    {
      id: 'don-seed-1041',
      trackingId: 'TRK-GSDD-1041',
      receiptNo: 'GSDD-REC-2026-1041',
      source: 'visitor',
      memberId: null,
      donorId: null,
      donorName: 'Meera Textiles Foundation',
      email: 'csr@meerafoundation.example',
      pan: 'AABCM9876E',
      amount: 100000,
      date: '2026-02-26',
      program: 'Skill Development & Digital Labs',
      method: 'Bank Transfer (NEFT)',
      utr: 'NEFT/HDFC26022601928',
      frequency: 'one-time',
      type: 'One-Time Donation',
      status: 'Verified',
      receipt80gIssued: true,
      taxDeductible: true,
      isDemoSample: true,
    },
  ];
}

async function buildInitialSubscriptions() {
  return [
    {
      id: 'GSDD-SUB-8812',
      donorId: 'GSDD-D-2026-101',
      program: 'Rural Healthcare & Mobile Health Units',
      amount: 2500,
      billingDay: '1st of every month',
      nextDeduction: '2026-04-01',
      paymentMethod: 'Demo Mandate (UPI Autopay Simulation)',
      status: 'Active',
      startDate: '2026-02-01',
      durationMonths: 12,
      completedDeductions: 2,
      totalRecurringPaid: 5000,
      isDemoMandate: true,
      deductionCycles: [],
    },
  ];
}

async function buildInitialCertificates() {
  return [
    {
      id: 'GSDD-ACH-2026-081',
      type: 'Certificate of Excellence & Achievement',
      recipient: 'Kavita Kumari (Volunteer Instructor)',
      email: 'kavita.kumari@example.com',
      organization: 'GSDD Foundation Volunteer Cohort',
      date: '2026-02-28',
      purpose: 'Outstanding contribution in conducting 60 days of free digital literacy workshops for rural girls in Raniganj.',
      authority: 'Manoj Kumar Bishwas (Founder / CEO), GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-081',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
    {
      id: 'GSDD-ACH-2026-082',
      type: 'Certificate of Community Impact',
      recipient: 'Manoj Kumar Mandal (Community Organizer)',
      email: 'manoj.mandal@example.com',
      organization: 'GSDD Foundation Health Outreach',
      date: '2026-03-02',
      purpose: 'Exemplary leadership in mobilizing 350+ villagers for blood donation and health screening camps.',
      authority: 'Arvind Kumar (Founder / MD), GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-082',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
    {
      id: 'GSDD-VIS-2026-015',
      type: 'Visitor Certificate of Honor & Appreciation',
      recipient: 'Shri Anand Prakash IAS (Retd.)',
      email: 'anand.prakash@example.com',
      organization: 'Policy Advisory Delegate',
      date: '2026-02-15',
      purpose: 'Chief Guest at Annual Skill Development Conclave 2026, Raniganj.',
      authority: 'Governing Board, GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-VIS-015',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
    {
      id: 'GSDD-VIS-2026-016',
      type: 'Distinguished Visitor Certificate',
      recipient: 'Dr. Neha Srivastava (CSR Delegate)',
      email: 'neha.srivastava@example.com',
      organization: 'CSR Assessment Panel',
      date: '2026-02-20',
      purpose: 'Field assessment visit to Raniganj Community Skill Centers.',
      authority: 'Governing Board, GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-VIS-016',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
    {
      id: 'GSDD-APT-2026-001',
      type: 'Official Foundation Appointment Letter',
      recipient: 'Rajesh Verma (Block Education Officer, Raniganj)',
      email: 'rajesh.verma@example.com',
      organization: 'GSDD Foundation District Committee',
      date: '2026-03-05',
      purpose: 'Discussion on digital literacy batch expansion across 5 government schools in Raniganj block.',
      authority: 'Governing Council, GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-APT-001',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
    {
      id: 'GSDD-APT-2026-002',
      type: 'Official Foundation Appointment Letter',
      recipient: 'Priya Darshini (CSR Lead, TechCare Solutions)',
      email: 'priya.darshini@example.com',
      organization: 'TechCare Solutions',
      date: '2026-03-08',
      purpose: 'Corporate Social Responsibility partnership for solar-powered computer labs in rural centers.',
      authority: 'Governing Council, GSDD Foundation',
      verificationCode: 'VERIFIED-GSDD-SEC8-APT-002',
      status: 'Verified',
      isVerifiedOfficial: true,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
    },
  ];
}

// ---------------------------------------------------------------------------
// Member Operations
// ---------------------------------------------------------------------------

export async function registerMemberAccount(input) {
  const name = String(input?.name || '').trim();
  const fatherSpouse = String(input?.fatherSpouse || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  const phone = String(input?.phone || '').trim();
  const password = String(input?.password || '');
  const category = String(input?.category || 'Executive Member').trim();
  const designation = String(input?.designation || 'Executive Member').trim();
  const bloodGroup = String(input?.bloodGroup || 'O+').trim();
  const gender = String(input?.gender || 'Male').trim();
  const address = String(input?.address || '').trim();

  if (!name || !email || !phone || !address) {
    return { ok: false, status: 400, error: 'Name, email, phone, and address are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Enter a valid email address.' };
  }
  if (password.length < 8 || password.length > 1024) {
    return { ok: false, status: 400, error: 'Password must be at least 8 characters long.' };
  }

  const passwordHash = await hashPassword(password);

  return withLock('members', async () => {
    const members = await readCollection('members', buildInitialMembers);
    if (members.some((m) => m.email.toLowerCase() === email)) {
      return { ok: false, status: 409, error: 'An account with this email is already registered.' };
    }

    const newId = `GSDD-M-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
    const feeAmount = category === 'Life Member' ? 11000 : 1200;
    const feeType = category === 'Life Member' ? 'Life (₹11,000)' : 'Annual (₹1,200)';
    const firstWord = (name.split(/\s+/)[0] || 'MEMBER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'MEMBER';

    const newMember = {
      id: newId,
      name,
      fatherSpouse,
      phone,
      email,
      passwordHash,
      tokenVersion: 1,
      isDemoAccount: false,
      address,
      designation,
      category,
      feeType,
      feeAmount,
      feeStatus: 'Pending',
      status: 'Active',
      joinDate: todayIso(),
      validTill: category === 'Life Member' ? 'Lifetime' : '2027-01-15',
      bloodGroup,
      gender,
      avatar: '',
      bio: `Registered ${designation} of GSDD Foundation.`,
      referralCode: `${firstWord}2026`,
      referralCount: 0,
      activities: [
        { id: `act-${randomUUID().slice(0, 8)}`, title: 'Foundation Membership Registration', date: todayIso(), role: designation, status: 'Registered' },
      ],
      certificates: [],
      notifications: {
        emailUpdates: true,
        whatsappUpdates: true,
        meetingAlerts: true,
        donationReceipts: true,
      },
      messages: [
        {
          id: `msg-${randomUUID().slice(0, 8)}`,
          sender: 'Welcome Desk',
          text: 'Welcome to GSDD Foundation! Your membership account is registered. Complete fee reconciliation to unlock official certificates and fee receipts.',
          date: todayIso(),
          unread: true,
          deliveryStatus: 'delivered',
        },
      ],
    };

    members.push(newMember);
    await writeCollection('members', members);
    return { ok: true, status: 201, member: sanitizeMember(newMember) };
  });
}

export async function authenticateMemberAccount(identifier, password) {
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanDigits = normalizePhoneDigits(identifier);
  if (!cleanId || typeof password !== 'string' || !password) {
    await verifyPassword(password || 'dummy', '');
    return null;
  }

  const members = await readCollection('members', buildInitialMembers);
  const found = members.find((m) => {
    const emailMatch = (m.email || '').toLowerCase() === cleanId;
    const idMatch = (m.id || '').toLowerCase() === cleanId;
    const phoneMatch = cleanDigits.length >= 8 && normalizePhoneDigits(m.phone) === cleanDigits;
    return emailMatch || idMatch || phoneMatch;
  });

  const valid = await verifyPassword(password, found ? found.passwordHash : '');
  if (!found || !valid) return null;
  return sanitizeMember(found);
}

export async function getMemberWorkspace(memberId) {
  const members = await readCollection('members', buildInitialMembers);
  const found = members.find((m) => m.id === memberId);
  if (!found) return null;

  const donations = await readCollection('donations', buildInitialDonations);
  const feePayments = await readCollection('fee-payments', async () => []);

  const memberDonations = donations.filter(
    (d) => d.memberId === memberId || (d.source === 'member' && d.email.toLowerCase() === found.email.toLowerCase())
  );
  const memberFees = feePayments.filter((p) => p.memberId === memberId);

  return {
    ...sanitizeMember(found),
    donations: memberDonations,
    feePayments: memberFees,
  };
}

export async function updateMemberProfile(memberId, patch) {
  return withLock('members', async () => {
    const members = await readCollection('members', buildInitialMembers);
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) return { ok: false, status: 404, error: 'Member not found' };

    const current = members[idx];
    const name = typeof patch?.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 120) : current.name;
    const phone = typeof patch?.phone === 'string' && patch.phone.trim() ? patch.phone.trim().slice(0, 30) : current.phone;
    const address = typeof patch?.address === 'string' ? patch.address.trim().slice(0, 300) : current.address;
    const bio = typeof patch?.bio === 'string' ? patch.bio.trim().slice(0, 500) : current.bio;

    members[idx] = { ...current, name, phone, address, bio };
    await writeCollection('members', members);
    return { ok: true, status: 200, member: await getMemberWorkspace(memberId) };
  });
}

export async function changeMemberPassword(memberId, currentPassword, newPassword) {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return { ok: false, status: 400, error: 'Current password is required.' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 1024) {
    return { ok: false, status: 400, error: 'New password must be at least 8 characters long.' };
  }
  if (newPassword === currentPassword) {
    return { ok: false, status: 400, error: 'New password must differ from current password.' };
  }

  return withLock('members', async () => {
    const members = await readCollection('members', buildInitialMembers);
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) return { ok: false, status: 404, error: 'Member not found' };

    const valid = await verifyPassword(currentPassword, members[idx].passwordHash);
    if (!valid) {
      return { ok: false, status: 401, error: 'Current password does not match our records.' };
    }

    const newHash = await hashPassword(newPassword);
    members[idx] = {
      ...members[idx],
      passwordHash: newHash,
      tokenVersion: (members[idx].tokenVersion || 1) + 1,
    };
    await writeCollection('members', members);
    return { ok: true, status: 200, tokenVersion: members[idx].tokenVersion };
  });
}

export async function updateMemberNotifications(memberId, prefs) {
  return withLock('members', async () => {
    const members = await readCollection('members', buildInitialMembers);
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) return { ok: false, status: 404, error: 'Member not found' };

    const notifications = {
      emailUpdates: Boolean(prefs?.emailUpdates),
      whatsappUpdates: Boolean(prefs?.whatsappUpdates),
      meetingAlerts: Boolean(prefs?.meetingAlerts),
      donationReceipts: Boolean(prefs?.donationReceipts),
    };
    members[idx] = { ...members[idx], notifications };
    await writeCollection('members', members);
    return { ok: true, status: 200, notifications };
  });
}

export async function addMemberMessage(memberId, input) {
  const department = String(input?.department || 'General Admin Office').trim().slice(0, 120);
  const subject = String(input?.subject || '').trim().slice(0, 200);
  const text = String(input?.text || '').trim().slice(0, 2000);
  if (!subject || !text) {
    return { ok: false, status: 400, error: 'Subject and message content are required.' };
  }

  return withLock('members', async () => {
    const members = await readCollection('members', buildInitialMembers);
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) return { ok: false, status: 404, error: 'Member not found' };

    const delivery = await dispatchNotification({
      channel: 'email',
      recipient: organization.email,
      subject: `[Member Message: ${department}] ${subject}`,
      text: `From: ${members[idx].name} (${members[idx].id}, ${members[idx].email})\n\n${text}`,
      metadata: { memberId, department },
    });

    const newMsg = {
      id: `msg-${randomUUID().slice(0, 8)}`,
      sender: `You (To: ${department})`,
      department,
      subject,
      text,
      date: todayIso(),
      unread: false,
      deliveryStatus: delivery.status,
      deliveryDetail: delivery.detail,
    };

    members[idx] = {
      ...members[idx],
      messages: [newMsg, ...(members[idx].messages || [])],
    };
    await writeCollection('members', members);
    return { ok: true, status: 201, message: newMsg, delivery };
  });
}

export async function submitMemberFeePayment(memberId, input) {
  const utr = normalizeUtr(input?.utr);
  const paymentMode = String(input?.paymentMode || 'UPI').trim().slice(0, 40);
  if (utr.length < 6 || utr.length > 80) {
    return { ok: false, status: 400, error: 'Enter a valid bank or UPI UTR reference (at least 6 characters).' };
  }

  const members = await readCollection('members', buildInitialMembers);
  const member = members.find((m) => m.id === memberId);
  if (!member) return { ok: false, status: 404, error: 'Member not found' };

  return withLock('fee-payments', async () => {
    const payments = await readCollection('fee-payments', async () => []);
    if (payments.some((p) => normalizeUtr(p.utr) === utr && p.status !== 'Rejected')) {
      return { ok: false, status: 409, error: 'This UTR / transaction reference has already been submitted.' };
    }

    const payment = {
      id: `FEE-${randomBytes(4).toString('hex').toUpperCase()}`,
      memberId: member.id,
      memberName: member.name,
      amount: Number(member.feeAmount || 1200),
      paymentMode,
      utr,
      status: 'Pending Verification',
      receiptIssued: false,
      receiptNo: null,
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
    };
    payments.unshift(payment);
    await writeCollection('fee-payments', payments);

    await withLock('members', async () => {
      const mList = await readCollection('members', buildInitialMembers);
      const mIdx = mList.findIndex((m) => m.id === memberId);
      if (mIdx !== -1 && mList[mIdx].feeStatus !== 'Paid') {
        mList[mIdx] = { ...mList[mIdx], feeStatus: 'Pending Verification' };
        await writeCollection('members', mList);
      }
    });

    return { ok: true, status: 201, payment };
  });
}

// ---------------------------------------------------------------------------
// Donor Operations
// ---------------------------------------------------------------------------

export async function registerDonorAccount(input) {
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  const phone = String(input?.phone || '').trim();
  const password = String(input?.password || '');
  const pan = String(input?.pan || '').trim().toUpperCase();
  const donorType = String(input?.donorType || 'Individual Donor').trim();
  const preferredProgram = String(input?.preferredProgram || 'Child Education & Digital Literacy').trim();
  const city = String(input?.city || '').trim();
  const state = String(input?.state || '').trim();
  const pin = String(input?.pin || '').trim();
  const address = String(input?.address || '').trim();
  const whatsappConsent = Boolean(input?.whatsappConsent);

  if (!name || !email || !phone || !address) {
    return { ok: false, status: 400, error: 'Name, email, phone, and address are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Enter a valid email address.' };
  }
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { ok: false, status: 400, error: 'Please provide a valid 10-character PAN (e.g. ABCDE1234F).' };
  }
  if (password.length < 8 || password.length > 1024) {
    return { ok: false, status: 400, error: 'Password must be at least 8 characters long.' };
  }

  const passwordHash = await hashPassword(password);

  return withLock('donors', async () => {
    const donors = await readCollection('donors', buildInitialDonors);
    if (donors.some((d) => d.email.toLowerCase() === email)) {
      return { ok: false, status: 409, error: 'A donor account with this email is already registered.' };
    }

    const newId = `GSDD-D-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
    const newDonor = {
      id: newId,
      name,
      email,
      passwordHash,
      tokenVersion: 1,
      isDemoAccount: false,
      phone,
      pan,
      donorType,
      preferredProgram,
      city,
      state,
      pin,
      address: `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${pin ? ` - ${pin}` : ''}`,
      tier: 'Silver Donor',
      totalDonated: 0,
      donationCount: 0,
      joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      profileBio: `Dedicated philanthropist supporting ${preferredProgram}.`,
      notifications: {
        emailReceipts: true,
        whatsappAlerts: whatsappConsent,
        monthlyReminders: true,
        quarterlyReports: true,
      },
      dispatchLog: [],
      certificates: [],
    };

    donors.push(newDonor);
    await writeCollection('donors', donors);
    return { ok: true, status: 201, donor: sanitizeDonor(newDonor) };
  });
}

export async function authenticateDonorAccount(identifier, password) {
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanDigits = normalizePhoneDigits(identifier);
  if (!cleanId || typeof password !== 'string' || !password) {
    await verifyPassword(password || 'dummy', '');
    return null;
  }

  const donors = await readCollection('donors', buildInitialDonors);
  const found = donors.find((d) => {
    const emailMatch = (d.email || '').toLowerCase() === cleanId;
    const idMatch = (d.id || '').toLowerCase() === cleanId;
    const phoneMatch = cleanDigits.length >= 8 && normalizePhoneDigits(d.phone) === cleanDigits;
    return emailMatch || idMatch || phoneMatch;
  });

  const valid = await verifyPassword(password, found ? found.passwordHash : '');
  if (!found || !valid) return null;
  return sanitizeDonor(found);
}

export async function getDonorWorkspace(donorId) {
  const donors = await readCollection('donors', buildInitialDonors);
  const found = donors.find((d) => d.id === donorId);
  if (!found) return null;

  const donations = await readCollection('donations', buildInitialDonations);
  const subscriptions = await readCollection('subscriptions', buildInitialSubscriptions);

  const donorDonations = donations.filter(
    (d) => d.donorId === donorId || (d.source === 'donor' && d.email.toLowerCase() === found.email.toLowerCase())
  );
  const donorSubs = subscriptions.filter((s) => s.donorId === donorId);
  const verifiedDonations = donorDonations.filter((d) => d.status === 'Verified');
  const verifiedTotal = verifiedDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

  return {
    ...sanitizeDonor(found),
    totalDonated: verifiedTotal,
    donationCount: verifiedDonations.length,
    tier: computeDonorTier(verifiedTotal),
    activeSubscriptions: donorSubs.filter((s) => s.status === 'Active').length,
    donations: donorDonations,
    subscriptions: donorSubs,
  };
}

export async function updateDonorProfile(donorId, patch) {
  const pan = typeof patch?.pan === 'string' ? patch.pan.trim().toUpperCase() : undefined;
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { ok: false, status: 400, error: 'Enter a valid 10-character PAN number.' };
  }

  return withLock('donors', async () => {
    const donors = await readCollection('donors', buildInitialDonors);
    const idx = donors.findIndex((d) => d.id === donorId);
    if (idx === -1) return { ok: false, status: 404, error: 'Donor not found' };

    const current = donors[idx];
    donors[idx] = {
      ...current,
      name: typeof patch?.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 120) : current.name,
      phone: typeof patch?.phone === 'string' && patch.phone.trim() ? patch.phone.trim().slice(0, 30) : current.phone,
      pan: pan !== undefined ? pan : current.pan,
      address: typeof patch?.address === 'string' ? patch.address.trim().slice(0, 300) : current.address,
      city: typeof patch?.city === 'string' ? patch.city.trim().slice(0, 80) : current.city,
      state: typeof patch?.state === 'string' ? patch.state.trim().slice(0, 80) : current.state,
      pin: typeof patch?.pin === 'string' ? patch.pin.trim().slice(0, 12) : current.pin,
      profileBio: typeof patch?.profileBio === 'string' ? patch.profileBio.trim().slice(0, 500) : current.profileBio,
    };
    await writeCollection('donors', donors);
    return { ok: true, status: 200, donor: await getDonorWorkspace(donorId) };
  });
}

export async function changeDonorPassword(donorId, currentPassword, newPassword) {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return { ok: false, status: 400, error: 'Current password is required.' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 1024) {
    return { ok: false, status: 400, error: 'New password must be at least 8 characters long.' };
  }
  if (newPassword === currentPassword) {
    return { ok: false, status: 400, error: 'New password must differ from current password.' };
  }

  return withLock('donors', async () => {
    const donors = await readCollection('donors', buildInitialDonors);
    const idx = donors.findIndex((d) => d.id === donorId);
    if (idx === -1) return { ok: false, status: 404, error: 'Donor not found' };

    const valid = await verifyPassword(currentPassword, donors[idx].passwordHash);
    if (!valid) {
      return { ok: false, status: 401, error: 'Current password does not match our records.' };
    }

    const newHash = await hashPassword(newPassword);
    donors[idx] = {
      ...donors[idx],
      passwordHash: newHash,
      tokenVersion: (donors[idx].tokenVersion || 1) + 1,
    };
    await writeCollection('donors', donors);
    return { ok: true, status: 200, tokenVersion: donors[idx].tokenVersion };
  });
}

export async function createDonorSubscription(donorId, input) {
  const program = String(input?.program || 'Rural Healthcare & Mobile Health Units').trim().slice(0, 160);
  const amount = Number(input?.amount);
  const billingDay = String(input?.billingDay || '1st of every month').trim().slice(0, 60);
  const paymentMethod = String(input?.paymentMethod || 'Demo Mandate (UPI Autopay Simulation)').trim().slice(0, 80);

  if (!Number.isFinite(amount) || amount < 500 || amount > 10000000) {
    return { ok: false, status: 400, error: 'Monthly pledge amount must be at least ₹500.' };
  }

  return withLock('subscriptions', async () => {
    const subs = await readCollection('subscriptions', buildInitialSubscriptions);
    const sub = {
      id: `GSDD-SUB-${randomBytes(3).toString('hex').toUpperCase()}`,
      donorId,
      program,
      amount: Math.round(amount),
      billingDay,
      nextDeduction: '2026-04-01',
      paymentMethod,
      status: 'Active',
      startDate: todayIso(),
      durationMonths: 12,
      completedDeductions: 0,
      totalRecurringPaid: 0,
      isDemoMandate: true,
      deductionCycles: [],
    };
    subs.unshift(sub);
    await writeCollection('subscriptions', subs);
    return { ok: true, status: 201, subscription: sub };
  });
}

export async function updateDonorSubscriptionStatus(donorId, subscriptionId, input) {
  const targetStatus = String(input?.status || '').trim();
  const reason = String(input?.reason || '').trim().slice(0, 300);
  if (!['Active', 'Paused', 'Cancelled'].includes(targetStatus)) {
    return { ok: false, status: 400, error: 'Status must be Active, Paused, or Cancelled.' };
  }

  return withLock('subscriptions', async () => {
    const subs = await readCollection('subscriptions', buildInitialSubscriptions);
    const idx = subs.findIndex((s) => s.id === subscriptionId && s.donorId === donorId);
    if (idx === -1) return { ok: false, status: 404, error: 'Subscription mandate not found.' };

    const current = subs[idx];
    if (current.status === 'Cancelled' && targetStatus !== 'Cancelled') {
      return { ok: false, status: 409, error: 'Cancelled mandates cannot be reactivated; create a new mandate instead.' };
    }

    subs[idx] = {
      ...current,
      status: targetStatus,
      cancelReason: targetStatus === 'Cancelled' ? reason || 'Cancelled by donor' : current.cancelReason,
      updatedAt: new Date().toISOString(),
    };
    await writeCollection('subscriptions', subs);
    return { ok: true, status: 200, subscription: subs[idx] };
  });
}

export async function processSubscriptionCycleDeduction(donorId, subscriptionId, idempotencyKey) {
  const cleanKey = String(idempotencyKey || '').trim().slice(0, 128);
  if (!cleanKey) {
    return { ok: false, status: 400, error: 'idempotencyKey is required for cycle deduction.' };
  }

  return withLock('subscriptions', async () => {
    const subs = await readCollection('subscriptions', buildInitialSubscriptions);
    const idx = subs.findIndex((s) => s.id === subscriptionId && s.donorId === donorId);
    if (idx === -1) return { ok: false, status: 404, error: 'Subscription mandate not found.' };

    const sub = subs[idx];
    if (sub.status !== 'Active') {
      return { ok: false, status: 409, error: `Cannot process deduction when mandate status is ${sub.status}.` };
    }

    const existingCycle = (sub.deductionCycles || []).find((c) => c.idempotencyKey === cleanKey);
    if (existingCycle) {
      return { ok: true, status: 200, idempotentReplay: true, cycle: existingCycle, subscription: sub };
    }

    const donors = await readCollection('donors', buildInitialDonors);
    const donor = donors.find((d) => d.id === donorId);
    if (!donor) return { ok: false, status: 404, error: 'Donor not found.' };

    const trackingId = `TRK-CYCLE-${randomBytes(4).toString('hex').toUpperCase()}`;
    const cycleNumber = (sub.deductionCycles || []).length + 1;
    const cycleRecord = {
      cycleNumber,
      idempotencyKey: cleanKey,
      trackingId,
      amount: sub.amount,
      status: 'Pending Settlement',
      createdAt: new Date().toISOString(),
    };

    const updatedSub = {
      ...sub,
      deductionCycles: [cycleRecord, ...(sub.deductionCycles || [])],
    };
    subs[idx] = updatedSub;
    await writeCollection('subscriptions', subs);

    await withLock('donations', async () => {
      const donations = await readCollection('donations', buildInitialDonations);
      donations.unshift({
        id: `don-${randomUUID().slice(0, 8)}`,
        trackingId,
        receiptNo: null,
        source: 'donor_recurring_demo',
        memberId: null,
        donorId: donor.id,
        donorName: donor.name,
        email: donor.email,
        pan: donor.pan || '',
        amount: sub.amount,
        date: todayIso(),
        program: sub.program,
        method: sub.paymentMethod,
        utr: `DEMO-CYCLE-${trackingId}`,
        frequency: 'monthly',
        type: 'Demo Mandate Cycle (Pending Settlement)',
        status: 'Pending Settlement',
        receipt80gIssued: false,
        taxDeductible: false,
        isDemoSample: true,
        subscriptionId: sub.id,
      });
      await writeCollection('donations', donations);
    });

    return { ok: true, status: 201, idempotentReplay: false, cycle: cycleRecord, subscription: updatedSub };
  });
}

export async function updateDonorNotificationsAndDispatch(donorId, input) {
  return withLock('donors', async () => {
    const donors = await readCollection('donors', buildInitialDonors);
    const idx = donors.findIndex((d) => d.id === donorId);
    if (idx === -1) return { ok: false, status: 404, error: 'Donor not found' };

    const current = donors[idx];
    if (input?.action === 'test_dispatch') {
      const channel = input?.channel === 'whatsapp' ? 'whatsapp' : 'email';
      const delivery = await dispatchNotification({
        channel,
        recipient: channel === 'email' ? current.email : current.phone,
        subject: 'GSDD Foundation Donor Notification Test',
        text: `Notification channel verification for ${current.name} (${current.id}).`,
        metadata: { donorId: current.id },
      });

      const logEntry = {
        id: `LOG-${randomBytes(3).toString('hex').toUpperCase()}`,
        channel: channel === 'email' ? 'Email' : 'WhatsApp',
        recipient: channel === 'email' ? current.email : current.phone,
        status: delivery.status,
        delivered: delivery.delivered,
        detail: delivery.detail,
        timestamp: delivery.timestamp,
      };

      const dispatchLog = [logEntry, ...(current.dispatchLog || [])].slice(0, 25);
      donors[idx] = { ...current, dispatchLog };
      await writeCollection('donors', donors);
      return { ok: true, status: 200, delivery, logEntry, dispatchLog };
    }

    const notifications = {
      emailReceipts: Boolean(input?.emailReceipts),
      whatsappAlerts: Boolean(input?.whatsappAlerts),
      monthlyReminders: Boolean(input?.monthlyReminders),
      quarterlyReports: Boolean(input?.quarterlyReports),
    };
    donors[idx] = { ...current, notifications };
    await writeCollection('donors', donors);
    return { ok: true, status: 200, notifications };
  });
}

// ---------------------------------------------------------------------------
// Donations (Visitor, Member, Donor)
// ---------------------------------------------------------------------------

export async function createPendingDonation(input) {
  const source = String(input?.source || 'visitor').trim();
  const memberId = input?.memberId || null;
  const donorId = input?.donorId || null;
  const donorName = String(input?.donorName || '').trim().slice(0, 140);
  const email = String(input?.email || '').trim().toLowerCase().slice(0, 254);
  const phone = String(input?.phone || '').trim().slice(0, 30);
  const pan = String(input?.pan || '').trim().toUpperCase().slice(0, 10);
  const amount = Number(input?.amount);
  const frequency = input?.frequency === 'monthly' ? 'monthly' : 'one-time';
  const program = String(input?.program || input?.purpose || 'General Welfare').trim().slice(0, 160);
  const method = String(input?.method || input?.paymentMode || 'UPI').trim().slice(0, 60);
  const rawUtr = normalizeUtr(input?.utr);
  const cashNote = String(input?.cashNote || '').trim().slice(0, 200);

  if (!donorName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Donor name and a valid email address are required.' };
  }
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000000) {
    return { ok: false, status: 400, error: 'Donation amount must be at least ₹100.' };
  }
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return { ok: false, status: 400, error: 'PAN must be 10 characters (e.g. ABCDE1234F).' };
  }

  const isCash = method.toLowerCase().includes('cash');
  if (!isCash && (rawUtr.length < 6 || rawUtr.length > 80)) {
    return { ok: false, status: 400, error: 'Please enter a valid UPI / Bank / Card transaction reference (minimum 6 characters).' };
  }
  if (isCash && !cashNote) {
    return { ok: false, status: 400, error: 'Please enter the office counter or executive name for cash deposit verification.' };
  }

  return withLock('donations', async () => {
    const donations = await readCollection('donations', buildInitialDonations);
    if (!isCash && donations.some((d) => normalizeUtr(d.utr) === rawUtr && d.status !== 'Rejected')) {
      return { ok: false, status: 409, error: 'This transaction UTR/reference has already been submitted.' };
    }

    const trackingId = `TRK-GSDD-${randomBytes(4).toString('hex').toUpperCase()}`;
    const record = {
      id: `don-${randomUUID().slice(0, 8)}`,
      trackingId,
      receiptNo: null,
      source,
      memberId,
      donorId,
      donorName,
      email,
      phone,
      pan,
      amount: Math.round(amount),
      date: todayIso(),
      program,
      method,
      utr: isCash ? `CASH-PLEDGE-${trackingId}` : rawUtr,
      cashNote: isCash ? cashNote : '',
      frequency,
      type: isCash ? 'Cash Pledge (Pending Counter Verification)' : frequency === 'monthly' ? 'Recurring Pledge' : 'One-Time Donation',
      status: 'Pending Verification',
      receipt80gIssued: false,
      taxDeductible: false,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
    };

    donations.unshift(record);
    await writeCollection('donations', donations);
    return { ok: true, status: 201, donation: record };
  });
}

export async function lookupDonationStatus(trackingIdOrReceipt) {
  const q = String(trackingIdOrReceipt || '').trim().toUpperCase();
  if (!q) return null;
  const donations = await readCollection('donations', buildInitialDonations);
  const found = donations.find(
    (d) => (d.trackingId && d.trackingId.toUpperCase() === q) || (d.receiptNo && d.receiptNo.toUpperCase() === q)
  );
  if (!found) return null;
  return {
    trackingId: found.trackingId,
    receiptNo: found.receiptNo,
    donorName: found.donorName,
    amount: found.amount,
    program: found.program,
    method: found.method,
    utr: found.utr,
    date: found.date,
    status: found.status,
    receipt80gIssued: Boolean(found.receipt80gIssued),
    taxExemption: found.receipt80gIssued ? organization.tax80g : null,
  };
}

// ---------------------------------------------------------------------------
// Certificates, Inquiries & Membership Applications
// ---------------------------------------------------------------------------

export async function requestVisitorCertificate(input) {
  const recipient = String(input?.name || '').trim().slice(0, 120);
  const orgName = String(input?.organization || '').trim().slice(0, 120) || 'Independent Visitor';
  const email = String(input?.email || '').trim().toLowerCase().slice(0, 254);
  const phone = String(input?.phone || '').trim().slice(0, 30);
  const purpose = String(input?.purpose || '').trim().slice(0, 240);
  const visitDate = String(input?.date || '').trim().slice(0, 20);
  const comments = String(input?.comments || '').trim().slice(0, 300);

  if (!recipient || !purpose || !visitDate) {
    return { ok: false, status: 400, error: 'Full name, visit purpose, and date are required.' };
  }

  return withLock('certificates', async () => {
    const certs = await readCollection('certificates', buildInitialCertificates);
    const requestId = `GSDD-REQ-2026-${randomBytes(3).toString('hex').toUpperCase()}`;

    const record = {
      id: requestId,
      type: 'Visitor Certificate Request (Pending Staff Issuance)',
      recipient,
      email,
      phone,
      organization: orgName,
      date: visitDate,
      purpose,
      comments,
      authority: 'Pending GSDD Foundation Verification',
      verificationCode: null,
      status: 'Pending Staff Approval',
      isVerifiedOfficial: false,
      cin: organization.cin,
      darpan: organization.darpan,
      tax80g: organization.tax80g,
      createdAt: new Date().toISOString(),
    };

    certs.unshift(record);
    await writeCollection('certificates', certs);
    return { ok: true, status: 201, certificate: record };
  });
}

export async function verifyDocumentCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase().slice(0, 100);
  if (!code) return { found: false, verified: false };

  const certs = await readCollection('certificates', buildInitialCertificates);
  const cert = certs.find(
    (c) =>
      (c.id && c.id.toUpperCase() === code) ||
      (c.requestId && c.requestId.toUpperCase() === code) ||
      (c.verificationCode && c.verificationCode.toUpperCase() === code)
  );
  if (cert) {
    return {
      found: true,
      verified: Boolean(cert.isVerifiedOfficial && cert.status === 'Verified'),
      status: cert.status,
      document: {
        code: cert.id,
        type: cert.type,
        recipient: cert.recipient,
        date: cert.date,
        purpose: cert.purpose,
        authority: cert.authority,
        status: cert.status,
        isVerifiedOfficial: Boolean(cert.isVerifiedOfficial),
      },
    };
  }

  const donations = await readCollection('donations', buildInitialDonations);
  const donation = donations.find(
    (d) => (d.receiptNo && d.receiptNo.toUpperCase() === code) || (d.trackingId && d.trackingId.toUpperCase() === code)
  );
  if (donation) {
    const verified = donation.status === 'Verified' && Boolean(donation.receipt80gIssued);
    return {
      found: true,
      verified,
      status: donation.status,
      document: {
        code: donation.receiptNo || donation.trackingId,
        type: verified ? 'Official 80G Donation Receipt' : 'Donation Submission (Unverified)',
        recipient: `${donation.donorName}${donation.pan ? ` (PAN: ${donation.pan})` : ''}`,
        date: donation.date,
        purpose: `${donation.program} • Amount: ₹${Number(donation.amount).toLocaleString('en-IN')} • Status: ${donation.status}`,
        authority: organization.legalName,
        status: donation.status,
        isVerifiedOfficial: verified,
      },
    };
  }

  const members = await readCollection('members', buildInitialMembers);
  const member = members.find((m) => m.id.toUpperCase() === code);
  if (member) {
    const verified = member.status === 'Active' && member.feeStatus === 'Paid';
    return {
      found: true,
      verified,
      status: verified ? 'Verified' : `Member Status: ${member.status} (Fee: ${member.feeStatus})`,
      document: {
        code: member.id,
        type: 'Foundation Member ID',
        recipient: `${member.name} (${member.designation})`,
        date: member.joinDate,
        purpose: `${member.category} • Fee Status: ${member.feeStatus}`,
        authority: 'Executive Body, GSDD Foundation',
        status: member.status,
        isVerifiedOfficial: verified,
      },
    };
  }

  return { found: false, verified: false };
}

export async function createInquiryTicket(input) {
  const name = String(input?.name || '').trim().slice(0, 120);
  const email = String(input?.email || '').trim().toLowerCase().slice(0, 254);
  const phone = String(input?.phone || '').trim().slice(0, 30);
  const topic = String(input?.topic || 'General enquiry').trim().slice(0, 100);
  const message = String(input?.message || '').trim().slice(0, 2000);

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return { ok: false, status: 400, error: 'Name, valid email, and message are required.' };
  }

  return withLock('inquiries', async () => {
    const inquiries = await readCollection('inquiries', async () => []);
    const ticketId = `GSDD-ENQ-2026-${randomBytes(3).toString('hex').toUpperCase()}`;

    const delivery = await dispatchNotification({
      channel: 'email',
      recipient: organization.email,
      subject: `Website Enquiry [${ticketId}]: ${topic}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nTopic: ${topic}\n\n${message}`,
      metadata: { ticketId },
    });

    const ticket = {
      ticketId,
      name,
      email,
      phone: phone || 'Not provided',
      topic,
      message,
      status: 'Open',
      deliveryStatus: delivery.status,
      createdAt: new Date().toISOString(),
    };
    inquiries.unshift(ticket);
    await writeCollection('inquiries', inquiries);
    return { ok: true, status: 201, ticket, delivery };
  });
}

export async function createMembershipApplication(input) {
  const name = String(input?.name || '').trim().slice(0, 120);
  const fatherSpouse = String(input?.fatherSpouse || '').trim().slice(0, 120);
  const phone = String(input?.phone || '').trim().slice(0, 30);
  const email = String(input?.email || '').trim().toLowerCase().slice(0, 254);
  const tier = String(input?.tier || 'executive-member').trim().slice(0, 60);
  const designation = String(input?.designation || 'Executive Member').trim().slice(0, 100);
  const address = String(input?.address || '').trim().slice(0, 300);
  const interest = String(input?.interest || '').trim().slice(0, 150);
  const bloodGroup = String(input?.bloodGroup || 'O+').trim().slice(0, 10);

  if (!name || !phone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !address) {
    return { ok: false, status: 400, error: 'Name, phone, valid email, and address are required.' };
  }

  return withLock('membership-applications', async () => {
    const apps = await readCollection('membership-applications', async () => []);
    const appId = `GSDD-M-APP-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
    const record = {
      appId,
      name,
      fatherSpouse,
      phone,
      email,
      tier,
      designation,
      address,
      interest,
      bloodGroup,
      status: 'Pending Committee Review',
      appliedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
    };
    apps.unshift(record);
    await writeCollection('membership-applications', apps);
    return { ok: true, status: 201, application: record };
  });
}

// ---------------------------------------------------------------------------
// Admin Reconciliation (Verify & Settle Donations, Fee Payments, Certificates)
// ---------------------------------------------------------------------------

export async function listPendingReconciliations() {
  const donations = await readCollection('donations', buildInitialDonations);
  const feePayments = await readCollection('fee-payments', async () => []);
  const certificates = await readCollection('certificates', buildInitialCertificates);
  const inquiries = await readCollection('inquiries', async () => []);

  return {
    pendingDonations: donations.filter((d) => d.status === 'Pending Verification' || d.status === 'Pending Settlement'),
    pendingFeePayments: feePayments.filter((p) => p.status === 'Pending Verification'),
    pendingCertificates: certificates.filter((c) => c.status === 'Pending Staff Approval'),
    inquiries: inquiries.slice(0, 50),
  };
}

export async function reconcilePortalItem({ kind, id, action, adminUser = 'admin', bankRef = '' }) {
  const approve = action === 'approve';
  if (!['approve', 'reject'].includes(action)) {
    return { ok: false, status: 400, error: 'action must be approve or reject' };
  }

  if (kind === 'donation') {
    return withLock('donations', async () => {
      const donations = await readCollection('donations', buildInitialDonations);
      const idx = donations.findIndex((d) => d.id === id || d.trackingId === id);
      if (idx === -1) return { ok: false, status: 404, error: 'Donation record not found' };

      const current = donations[idx];
      if (approve) {
        if (current.status === 'Verified') {
          return { ok: true, status: 200, donation: current };
        }
        const receiptNo = current.receiptNo || `GSDD-REC-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
        donations[idx] = {
          ...current,
          status: 'Verified',
          receiptNo,
          receipt80gIssued: true,
          taxDeductible: true,
          bankRef: bankRef || current.utr,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
      } else {
        donations[idx] = {
          ...current,
          status: 'Rejected',
          receiptNo: null,
          receipt80gIssued: false,
          taxDeductible: false,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
      }
      await writeCollection('donations', donations);
      if (approve && current.subscriptionId) {
        await withLock('subscriptions', async () => {
          const subs = await readCollection('subscriptions', buildInitialSubscriptions);
          const sIdx = subs.findIndex((s) => s.id === current.subscriptionId);
          if (sIdx !== -1) {
            const sub = subs[sIdx];
            const cycles = (sub.deductionCycles || []).map((c) =>
              c.trackingId === current.trackingId ? { ...c, status: 'Verified', receiptNo: donations[idx].receiptNo } : c
            );
            subs[sIdx] = {
              ...sub,
              completedDeductions: (sub.completedDeductions || 0) + 1,
              totalRecurringPaid: (sub.totalRecurringPaid || 0) + Number(current.amount || 0),
              deductionCycles: cycles,
            };
            await writeCollection('subscriptions', subs);
          }
        });
      }
      return { ok: true, status: 200, donation: donations[idx] };
    });
  }

  if (kind === 'fee_payment') {
    return withLock('fee-payments', async () => {
      const payments = await readCollection('fee-payments', async () => []);
      const idx = payments.findIndex((p) => p.id === id);
      if (idx === -1) return { ok: false, status: 404, error: 'Fee payment record not found' };

      const current = payments[idx];
      if (approve) {
        if (current.status === 'Verified') {
          return { ok: true, status: 200, payment: current };
        }
        const receiptNo = current.receiptNo || `GSDD-FEE-2026-${randomBytes(3).toString('hex').toUpperCase()}`;
        payments[idx] = {
          ...current,
          status: 'Verified',
          receiptIssued: true,
          receiptNo,
          bankRef: bankRef || current.utr,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
        await writeCollection('fee-payments', payments);

        await withLock('members', async () => {
          const members = await readCollection('members', buildInitialMembers);
          const mIdx = members.findIndex((m) => m.id === current.memberId);
          if (mIdx !== -1) {
            members[mIdx] = { ...members[mIdx], feeStatus: 'Paid' };
            await writeCollection('members', members);
          }
        });
      } else {
        payments[idx] = {
          ...current,
          status: 'Rejected',
          receiptIssued: false,
          receiptNo: null,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
        await writeCollection('fee-payments', payments);

        await withLock('members', async () => {
          const members = await readCollection('members', buildInitialMembers);
          const mIdx = members.findIndex((m) => m.id === current.memberId);
          if (mIdx !== -1 && members[mIdx].feeStatus !== 'Paid') {
            members[mIdx] = { ...members[mIdx], feeStatus: 'Pending' };
            await writeCollection('members', members);
          }
        });
      }
      return { ok: true, status: 200, payment: payments[idx] };
    });
  }

  if (kind === 'certificate') {
    return withLock('certificates', async () => {
      const certs = await readCollection('certificates', buildInitialCertificates);
      const idx = certs.findIndex((c) => c.id === id);
      if (idx === -1) return { ok: false, status: 404, error: 'Certificate record not found' };

      const current = certs[idx];
      if (approve) {
        const officialId = current.id.startsWith('GSDD-REQ-')
          ? `GSDD-VIS-2026-${randomBytes(3).toString('hex').toUpperCase()}`
          : current.id;
        certs[idx] = {
          ...current,
          id: officialId,
          requestId: current.requestId || current.id,
          type: 'Visitor Certificate of Participation & Honor',
          authority: 'Manoj Kumar Bishwas (Founder / CEO), GSDD Foundation',
          verificationCode: `VERIFIED-GSDD-${randomBytes(3).toString('hex').toUpperCase()}`,
          status: 'Verified',
          isVerifiedOfficial: true,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
      } else {
        certs[idx] = {
          ...current,
          status: 'Rejected',
          isVerifiedOfficial: false,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
        };
      }
      await writeCollection('certificates', certs);
      return { ok: true, status: 200, certificate: certs[idx] };
    });
  }

  return { ok: false, status: 400, error: 'Unsupported reconciliation kind' };
}
