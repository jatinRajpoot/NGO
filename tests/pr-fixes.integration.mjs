import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { encodeQrMatrix } from '../app/lib/qr-encode.js';
import { defaultMembers } from '../app/member/member-data.js';
import { defaultDonors, donorTaxDetails } from '../app/donor/donor-data.js';
import { defaultTeamMembers } from '../app/team/team-data.js';
import { verifiedCertificates } from '../app/certificate/certificate-data.js';
import { organization } from '../app/data/site-data.js';

console.log('--- 1. Verifying static data hygiene & pure-JS QR encoder ---');
const upiPayload = 'upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20Foundation&am=1000&cu=INR';
const qr = encodeQrMatrix(upiPayload);
assert.ok(qr.size >= 21 && qr.size % 4 === 1, 'QR matrix size must follow ISO-18004 formula');
assert.equal(qr.modules.length, qr.size);
assert.equal(qr.modules[0][0], true, 'Top-left finder pattern corner must be dark');

for (const m of defaultMembers) {
  assert.equal('password' in m, false, `Member ${m.id} must not ship plaintext password`);
}
for (const d of defaultDonors) {
  assert.equal('password' in d, false, `Donor ${d.id} must not ship plaintext password`);
}
assert.ok(donorTaxDetails.mcaRegNumber.includes(organization.cin));
assert.equal(donorTaxDetails.ngoDarpanId, organization.darpan);
assert.equal(donorTaxDetails.panNumber, organization.pan);
assert.equal(donorTaxDetails.section12ANumber, organization.tax12a);
assert.ok(donorTaxDetails.section80GNumber.includes(organization.tax80g));
for (const cert of verifiedCertificates) {
  assert.equal(cert.cin, organization.cin, `Certificate ${cert.id} must use official CIN`);
  assert.equal(cert.mcaReg, organization.darpan, `Certificate ${cert.id} must use official Darpan ID`);
  assert.equal(cert.pan, organization.pan, `Certificate ${cert.id} must use official PAN`);
  assert.equal(cert.tax80g, organization.tax80g, `Certificate ${cert.id} must use official 80G number`);
}
for (const tm of defaultTeamMembers) {
  for (const c of tm.certificates || []) {
    assert.ok(!String(c.regNo || '').includes('U85300BR2024NPL069123'), 'Must not contain placeholder CIN');
    assert.ok(!String(c.regNo || '').includes('BR/2024/049102'), 'Must not contain placeholder MCA reg');
  }
}

console.log('--- 2. Launching next start against isolated temporary portal store ---');
const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;

const tempDir = await mkdtemp(path.join(tmpdir(), 'gsdd-pr-fixes-'));
const adminUsername = 'pr-verify-admin';
const adminPassword = randomBytes(16).toString('hex');
const salt = randomBytes(16).toString('hex');
const adminPasswordHash = `${salt}:${scryptSync(adminPassword, salt, 64).toString('hex')}`;
const teamPortalPassword = 'ExecTeamSecret!2026';

const server = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    GALLERY_BUCKET: '',
    GALLERY_DATA_DIR: tempDir,
    ADMIN_DATA_DIR: tempDir,
    PORTAL_DATA_DIR: tempDir,
    ADMIN_USERNAME: adminUsername,
    ADMIN_PASSWORD_HASH: adminPasswordHash,
    ADMIN_SESSION_SECRET: randomBytes(48).toString('hex'),
    PORTAL_SESSION_SECRET: randomBytes(48).toString('hex'),
    TEAM_SESSION_SECRET: randomBytes(48).toString('hex'),
    TEAM_PORTAL_PASSWORD: teamPortalPassword,
    NOTIFICATION_WEBHOOK_URL: '',
    RESEND_API_KEY: '',
    NEXT_TELEMETRY_DISABLED: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let logs = '';
server.stdout.on('data', (c) => { logs = (logs + c).slice(-8000); });
server.stderr.on('data', (c) => { logs = (logs + c).slice(-8000); });

function extractCookie(response, cookieName) {
  const list = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  for (const item of list) {
    if (item.startsWith(`${cookieName}=`)) {
      return item.split(';')[0];
    }
  }
  return null;
}

async function api(route, { method = 'GET', body, cookie = '', origin = base } = {}) {
  const headers = {};
  if (origin !== null) headers.Origin = origin;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${base}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
}

try {
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`${base}/`);
      if (r.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, `Server failed to start: ${logs}`);

  // 3. Cross-origin CSRF protection
  const csrfRes = await api('/api/donations/', {
    method: 'POST',
    origin: 'https://evil.example',
    body: { donorName: 'Test', email: 'test@example.com', amount: 500, utr: 'UTR123456' },
  });
  assert.equal(csrfRes.status, 403, 'Cross-origin POST /api/donations/ must return 403');

  // 4. Visitor Donation Pending Verification + Duplicate UTR Rejection + Inquiry + Certificate Request
  const badDonRes = await api('/api/donations/', {
    method: 'POST',
    body: { donorName: 'Asha Devi', email: 'asha@example.com', amount: 1500, method: 'UPI', utr: '123' },
  });
  assert.equal(badDonRes.status, 400, 'Donation without >=6 char UTR must fail validation');

  const utr = `UTR${Date.now()}99`;
  const donRes = await api('/api/donations/', {
    method: 'POST',
    body: { donorName: 'Asha Devi', email: 'asha@example.com', phone: '9876543210', amount: 1500, method: 'UPI', utr },
  });
  assert.equal(donRes.status, 201);
  const donJson = await donRes.json();
  assert.equal(donJson.donation.status, 'Pending Verification');
  assert.equal(donJson.donation.receiptNo, null);
  assert.equal(donJson.donation.receipt80gIssued, false);

  const dupDonRes = await api('/api/donations/', {
    method: 'POST',
    body: { donorName: 'Asha Devi', email: 'asha@example.com', amount: 1500, method: 'UPI', utr },
  });
  assert.equal(dupDonRes.status, 409, 'Duplicate UTR must be rejected');

  const inqRes = await api('/api/inquiries/', {
    method: 'POST',
    body: { name: 'Rohan Kumar', email: 'rohan@example.com', topic: 'Volunteering', message: 'Want to help Raniganj camp' },
  });
  assert.equal(inqRes.status, 201);
  const inqJson = await inqRes.json();
  assert.match(inqJson.ticket.ticketId, /^GSDD-ENQ-/);
  assert.equal(inqJson.delivery.status, 'queued_no_provider');

  const certReqRes = await api('/api/certificates/', {
    method: 'POST',
    body: { name: 'Visitor Suman', email: 'suman@example.com', purpose: 'School Health Visit', date: '2026-04-02' },
  });
  assert.equal(certReqRes.status, 201);
  const certReqJson = await certReqRes.json();
  assert.equal(certReqJson.certificate.status, 'Pending Staff Approval');
  assert.equal(certReqJson.certificate.isVerifiedOfficial, false);

  const preVerifyRes = await api(`/api/certificates/verify/?code=${encodeURIComponent(certReqJson.certificate.id)}`);
  assert.equal(preVerifyRes.status, 200);
  const preVerifyJson = await preVerifyRes.json();
  assert.equal(preVerifyJson.verified, false, 'Unapproved certificate request must not verify as official');

  const fakeVerifyRes = await api('/api/certificates/verify/?code=FAKE-TAMPERED-001');
  assert.equal(fakeVerifyRes.status, 404);
  const fakeVerifyJson = await fakeVerifyRes.json();
  assert.equal(fakeVerifyJson.found, false);
  assert.equal(fakeVerifyJson.verified, false);

  // 5. Member Register, Fee Pending Verification, Message, Password Change + Session Revocation
  const memEmail = `member-${Date.now()}@example.com`;
  const memRegRes = await api('/api/member/register/', {
    method: 'POST',
    body: {
      name: 'Kiran Prasad',
      email: memEmail,
      phone: '9911223344',
      address: 'Araria, Bihar',
      password: 'Password123!',
    },
  });
  assert.equal(memRegRes.status, 201);
  let memCookie = extractCookie(memRegRes, 'gsdd_member_session');
  assert.ok(memCookie, 'Member registration must set HttpOnly session cookie');
  const memRegJson = await memRegRes.json();
  assert.equal(memRegJson.member.feeStatus, 'Pending');

  const feeRes = await api('/api/member/fee-payment/', {
    method: 'POST',
    cookie: memCookie,
    body: { paymentMode: 'UPI', utr: `FEEUTR${Date.now()}` },
  });
  assert.equal(feeRes.status, 201);
  const feeJson = await feeRes.json();
  assert.equal(feeJson.payment.status, 'Pending Verification');
  assert.equal(feeJson.member.feeStatus, 'Pending Verification', 'Fee must remain pending until admin reconciliation');

  const msgRes = await api('/api/member/messages/', {
    method: 'POST',
    cookie: memCookie,
    body: { department: 'Accounts', subject: 'Fee Ref Check', text: 'Please check UTR.' },
  });
  assert.equal(msgRes.status, 201);
  const msgJson = await msgRes.json();
  assert.equal(msgJson.delivery.status, 'queued_no_provider');

  const oldMemCookie = memCookie;
  const chgRes = await api('/api/member/change-password/', {
    method: 'POST',
    cookie: memCookie,
    body: { currentPassword: 'Password123!', newPassword: 'NewPassword456!' },
  });
  assert.equal(chgRes.status, 200);
  memCookie = extractCookie(chgRes, 'gsdd_member_session');
  assert.ok(memCookie);

  const staleCookieRes = await api('/api/member/profile/', {
    method: 'PATCH',
    cookie: oldMemCookie,
    body: { phone: '9000000000' },
  });
  assert.equal(staleCookieRes.status, 401, 'Prior member session must be invalidated on password change');

  const oldPassLoginRes = await api('/api/member/login/', {
    method: 'POST',
    body: { identifier: memEmail, password: 'Password123!' },
  });
  assert.equal(oldPassLoginRes.status, 401, 'Old password must be rejected after change');

  const logoutRes = await api('/api/member/logout/', { method: 'POST', cookie: memCookie });
  assert.equal(logoutRes.status, 200);
  const afterLogoutRes = await api('/api/member/profile/', {
    method: 'PATCH',
    cookie: memCookie,
    body: { phone: '9000000001' },
  });
  assert.equal(afterLogoutRes.status, 401, 'Revoked member cookie must fail after logout');

  // 6. Admin Login & Reconciliation
  const unauthReconcile = await api('/api/admin/reconcile/');
  assert.equal(unauthReconcile.status, 401);

  const adminLoginRes = await api('/api/admin/auth/login/', {
    method: 'POST',
    body: { username: adminUsername, password: adminPassword },
  });
  assert.equal(adminLoginRes.status, 200);
  const adminCookie = extractCookie(adminLoginRes, 'gsdd_admin_session');
  assert.ok(adminCookie, 'Admin login must return gsdd_admin_session');

  const recDonRes = await api('/api/admin/reconcile/', {
    method: 'POST',
    cookie: adminCookie,
    body: { kind: 'donation', id: donJson.donation.trackingId, action: 'approve', bankRef: utr },
  });
  assert.equal(recDonRes.status, 200);
  const recDonJson = await recDonRes.json();
  assert.equal(recDonJson.donation.status, 'Verified');
  assert.equal(recDonJson.donation.receipt80gIssued, true);
  assert.ok(recDonJson.donation.receiptNo, 'Verified donation must issue official 80G receiptNo');

  const recCertRes = await api('/api/admin/reconcile/', {
    method: 'POST',
    cookie: adminCookie,
    body: { kind: 'certificate', id: certReqJson.certificate.id, action: 'approve' },
  });
  assert.equal(recCertRes.status, 200);
  const recCertJson = await recCertRes.json();
  assert.equal(recCertJson.certificate.isVerifiedOfficial, true);

  const postVerifyRes = await api(`/api/certificates/verify/?code=${encodeURIComponent(recCertJson.certificate.id)}`);
  assert.equal(postVerifyRes.status, 200);
  const postVerifyJson = await postVerifyRes.json();
  assert.equal(postVerifyJson.verified, true, 'Approved certificate must verify as official');

  const recFeeRes = await api('/api/admin/reconcile/', {
    method: 'POST',
    cookie: adminCookie,
    body: { kind: 'fee_payment', id: feeJson.payment.id, action: 'approve' },
  });
  assert.equal(recFeeRes.status, 200);

  const newMemLogin = await api('/api/member/login/', {
    method: 'POST',
    body: { identifier: memEmail, password: 'NewPassword456!' },
  });
  assert.equal(newMemLogin.status, 200);
  const newMemCookie = extractCookie(newMemLogin, 'gsdd_member_session');
  const meAfterFee = await api('/api/member/me/', { cookie: newMemCookie });
  const meAfterFeeJson = await meAfterFee.json();
  assert.equal(meAfterFeeJson.member.feeStatus, 'Paid', 'Member feeStatus must become Paid after admin reconcile');

  // 7. Donor Cash Validation + Subscription Idempotency + Pause/Cancel + Notification Dispatch
  const donRegEmail = `donor-${Date.now()}@example.com`;
  const donRegRes = await api('/api/donor/register/', {
    method: 'POST',
    body: { name: 'Neha Singh', email: donRegEmail, phone: '9888777666', address: 'Patna', pan: 'ABCDE1234F', password: 'DonorPass99!' },
  });
  assert.equal(donRegRes.status, 201);
  const donorCookie = extractCookie(donRegRes, 'gsdd_donor_session');
  assert.ok(donorCookie);

  const badCashRes = await api('/api/donor/donations/', {
    method: 'POST',
    cookie: donorCookie,
    body: { amount: 1000, method: 'Cash', program: 'Education' },
  });
  assert.equal(badCashRes.status, 400, 'Cash pledge without verification note must fail');

  const subRes = await api('/api/donor/subscriptions/', {
    method: 'POST',
    cookie: donorCookie,
    body: { program: 'Healthcare', amount: 1000 },
  });
  assert.equal(subRes.status, 201);
  const subId = (await subRes.json()).subscription.id;

  const idempKey = `cycle-${Date.now()}`;
  const ded1 = await api(`/api/donor/subscriptions/${subId}/deduct/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { idempotencyKey: idempKey },
  });
  assert.equal(ded1.status, 201);
  const ded1Json = await ded1.json();
  assert.equal(ded1Json.idempotentReplay, false);
  assert.equal(ded1Json.cycle.status, 'Pending Settlement');

  const ded2 = await api(`/api/donor/subscriptions/${subId}/deduct/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { idempotencyKey: idempKey },
  });
  assert.equal(ded2.status, 200);
  const ded2Json = await ded2.json();
  assert.equal(ded2Json.idempotentReplay, true);

  const pauseRes = await api(`/api/donor/subscriptions/${subId}/status/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { status: 'Paused' },
  });
  assert.equal(pauseRes.status, 200);
  assert.equal((await pauseRes.json()).subscription.status, 'Paused');

  const pausedDedRes = await api(`/api/donor/subscriptions/${subId}/deduct/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { idempotencyKey: `cycle-paused-${Date.now()}` },
  });
  assert.equal(pausedDedRes.status, 409, 'Paused subscription must block cycle deductions');

  const cancelRes = await api(`/api/donor/subscriptions/${subId}/status/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { status: 'Cancelled', reason: 'Testing cancellation' },
  });
  assert.equal(cancelRes.status, 200);

  const reactivateRes = await api(`/api/donor/subscriptions/${subId}/status/`, {
    method: 'POST',
    cookie: donorCookie,
    body: { status: 'Active' },
  });
  assert.equal(reactivateRes.status, 409, 'Cancelled mandate must stay cancelled');

  const notifDispatchRes = await api('/api/donor/notifications/', {
    method: 'POST',
    cookie: donorCookie,
    body: { channel: 'email' },
  });
  assert.equal(notifDispatchRes.status, 200);
  assert.equal((await notifDispatchRes.json()).delivery.status, 'queued_no_provider');

  // 8. Team Session Auth & Revocation + Public Read-Only Check
  const badTeamLogin = await api('/api/team/login/', {
    method: 'POST',
    body: { identifier: 'ceo@gsddfoundation.org', password: 'wrong-password' },
  });
  assert.equal(badTeamLogin.status, 401, 'Team login must reject wrong password');

  const okTeamLogin = await api('/api/team/login/', {
    method: 'POST',
    body: { identifier: 'ceo@gsddfoundation.org', password: teamPortalPassword },
  });
  assert.equal(okTeamLogin.status, 200);
  const teamCookie = extractCookie(okTeamLogin, 'gsdd_team_session');
  assert.ok(teamCookie, 'Team login must set HttpOnly session cookie');

  const teamPatchRes = await api('/api/team/profile/', {
    method: 'PATCH',
    cookie: teamCookie,
    body: { bio: 'Updated verified executive biography.' },
  });
  assert.equal(teamPatchRes.status, 200);
  assert.equal((await teamPatchRes.json()).member.bio, 'Updated verified executive biography.');

  const teamLogoutRes = await api('/api/team/logout/', { method: 'POST', cookie: teamCookie });
  assert.equal(teamLogoutRes.status, 200);
  const teamRevokedRes = await api('/api/team/profile/', {
    method: 'PATCH',
    cookie: teamCookie,
    body: { bio: 'Should fail after logout' },
  });
  assert.equal(teamRevokedRes.status, 401, 'Team session cookie must fail after server-side revocation');

  console.log('ALL PR FIXES END-TO-END INTEGRATION CHECKS PASSED!');
} finally {
  server.kill('SIGTERM');
  await rm(tempDir, { recursive: true, force: true }).catch(() => {});
}
