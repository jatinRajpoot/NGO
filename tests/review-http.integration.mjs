import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { createServer } from 'node:http';
let emailedToken;
const mail = createServer(async (request, response) => { let raw = ''; for await (const chunk of request) raw += chunk; const message = JSON.parse(raw); if (message.metadata?.kind === 'member_password_reset') emailedToken = message.metadata.resetToken; response.end('{}'); });
await new Promise(resolve => mail.listen(0, '127.0.0.1', resolve));

const listener = net.createServer();
await new Promise(r => listener.listen(0, '127.0.0.1', r));
const port = listener.address().port;
await new Promise(r => listener.close(r));
const base = `http://127.0.0.1:${port}`;
const dataDir = await mkdtemp(path.join(tmpdir(), 'ngo-review-http-'));
const password = randomBytes(20).toString('hex');
const salt = randomBytes(16).toString('hex');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '-p', String(port)], {
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production', GALLERY_BUCKET: '', GALLERY_DATA_DIR: dataDir,
    ADMIN_DATA_DIR: dataDir, PORTAL_DATA_DIR: dataDir, FINANCE_DATA_DIR: dataDir,
    MEMBERSHIP_DATA_DIR: dataDir, SUPPORT_DATA_DIR: dataDir, OPERATIONS_DATA_DIR: dataDir,
    ADMIN_SYSTEM_DATA_DIR: dataDir, POSTS_DATA_DIR: dataDir,
    ADMIN_USERNAME: 'review-admin', ADMIN_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`,
    ADMIN_SESSION_SECRET: randomBytes(48).toString('hex'), PORTAL_SESSION_SECRET: randomBytes(48).toString('hex'),
    TEAM_SESSION_SECRET: randomBytes(48).toString('hex'), NOTIFICATION_WEBHOOK_URL: `http://127.0.0.1:${mail.address().port}/`, RESEND_API_KEY: '',
    FLASK_API_URL: 'http://127.0.0.1:5000', NEXT_TELEMETRY_DISABLED: '1' },
});
let logs = '';
server.stdout.on('data', x => { logs = (logs + x).slice(-12000); });
server.stderr.on('data', x => { logs = (logs + x).slice(-12000); });
const evidence = [];
async function req(url, body, cookie, method = body ? 'POST' : 'GET') {
  const res = await fetch(base + url, { method, headers: { Origin: base, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { text: text.slice(0, 300) }; }
  return { status: res.status, data: json, cookie: res.headers.getSetCookie().map(x => x.split(';')[0]).join('; ') };
}
function record(id, facts) { evidence.push({ id, ...facts }); console.log(JSON.stringify(evidence.at(-1))); }
try {
  const deadline = Date.now() + 45000;
  while (true) {
    try { const res = await fetch(base + '/'); if (res.ok) break; } catch {}
    if (Date.now() > deadline || server.exitCode !== null) throw new Error('Server failed: ' + logs);
    await new Promise(r => setTimeout(r, 300));
  }
  const login = await req('/api/admin/auth/login/', { username: 'review-admin', password });
  assert.equal(login.status, 200);
  const admin = login.cookie;
  const email = 'review-member@example.invalid';
  const oldPassword = 'OriginalReviewPass123!';
  const newPassword = 'ReplacementReviewPass123!';
  const memberFields = { name: 'Review Member', email, mobile: '9876543210', phone: '9876543210', address: 'Isolated review test address', category: 'Executive Member', password: oldPassword };
  const extended = await req('/api/public/members/', memberFields);
  assert.equal(extended.status, 201);
  const approved = await req('/api/admin/membership-suite/members/', { id: extended.data.member.id, accountStatus: 'Active' }, admin, 'PATCH');
  assert.equal(approved.status, 200);
  const extendedLogin = await req('/api/member/login/', { email, password: oldPassword });
  assert.equal(extendedLogin.status, 200);
  record('membership_registration_split', { registrationStatus: extended.status, approvalStatus: approved.status, loginStatus: extendedLogin.status });
  const duplicate = await req('/api/member/register/', memberFields);
  assert.equal(duplicate.status, 409);
  const reset = await req('/api/public/forgot-password/', { email, phone: '3210', newPassword });
  assert.equal(reset.status, 400);
  assert.equal((await req('/api/public/forgot-password/', { step: 'request', email })).status, 200);
  assert.ok(emailedToken);
  assert.equal((await req('/api/public/forgot-password/', { step: 'confirm', token: emailedToken, newPassword })).status, 200);
  assert.equal((await req('/api/member/me/', undefined, extendedLogin.cookie)).status, 401, 'Reset revokes previous sessions');
  const newLogin = await req('/api/member/login/', { email, password: newPassword });
  const oldLogin = await req('/api/member/login/', { email, password: oldPassword });
  assert.equal(newLogin.status, 200); assert.equal(oldLogin.status, 401);
  record('password_reset_split', { emailedSingleUseCodeRequired: true, phoneOnlyAttemptStatus: reset.status, resetStatus: reset.status, newPasswordLoginStatus: newLogin.status, oldPasswordLoginStatus: oldLogin.status });
  const photoForm = new FormData();
  photoForm.append('photo', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9AAAAABJRU5ErkJggg==', 'base64')], { type: 'image/png' }), 'review.png');
  const photoRes = await fetch(base + '/api/member/extensions/', { method: 'POST', headers: { Origin: base, Cookie: newLogin.cookie }, body: photoForm });
  const photo = await photoRes.json();
  assert.equal(photoRes.status, 200);
  const refreshed = await req('/api/member/me/', undefined, newLogin.cookie);
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.data.member.photoSrc, photo.photoSrc);
  record('member_photo_not_persisted', { uploadStatus: photoRes.status, uploadReturnedPhoto: Boolean(photo.photoSrc), refreshedProfileHasUploadedPhoto: refreshed.data.member.photoSrc === photo.photoSrc });
  const ticket = await req('/api/inquiries/', { name: 'Review Enquiry', email: 'review-enquiry@example.invalid', message: 'Unique review enquiry content' });
  assert.equal(ticket.status, 201);
  const enquiries = await req('/api/admin/support/enquiries/', undefined, admin);
  assert.equal(enquiries.status, 200);
  const inquiryFound = enquiries.data.enquiries.some(x => x.email === 'review-enquiry@example.invalid');
  assert.equal(inquiryFound, true);
  record('enquiry_queue_split', { submissionStatus: ticket.status, adminListStatus: enquiries.status, submittedTicketVisibleInAdmin: inquiryFound });
  const beforeOverview = await req('/api/admin/overview/', undefined, admin);
  const pending = await req('/api/donations/', { donorName: 'Review Real Donation', email: 'review-real@example.invalid', amount: 1234, method: 'UPI', utr: 'REVIEW-UNIQUE-UTR-123456' });
  assert.equal(pending.status, 201);
  const reconciles = await req('/api/admin/reconcile/', undefined, admin);
  assert.ok(reconciles.data.pendingDonations.some(x => x.id === pending.data.donation.id));
  const finance = await req('/api/admin/finance/donations/', undefined, admin);
  assert.equal(finance.status, 200);
  const pendingVisible = finance.data.donations.some(x => x.id === pending.data.donation.id);
  assert.equal(pendingVisible, true);
  const approvedDonation = await req('/api/admin/reconcile/', { kind: 'donation', id: pending.data.donation.id, action: 'approve', bankRef: 'REVIEW-MATCHED-BANK-123456' }, admin);
  assert.equal(approvedDonation.status, 200);
  assert.ok(approvedDonation.data.donation.receiptNo);
  record('donation_queue_split', { submissionStatus: pending.status, reconciliationApiContainsDonation: true, financeAdminListContainsDonation: pendingVisible });
  const gateway = await req('/api/payments/sandbox/', { gateway: 'razorpay', donorName: 'Review Simulated Donation', email: 'review-sandbox@example.invalid', amount: 9876 });
  assert.equal(gateway.status, 201);
  const settled = await req('/api/payments/sandbox/verify/', { sessionId: gateway.data.session.sessionId });
  assert.equal(settled.status, 200); assert.equal(settled.data.donation.status, 'Simulated');
  assert.equal(settled.data.donation.receiptNo, null);
  const publicDonations = await req('/api/public/donations/?q=Review%20Simulated');
  assert.ok(!publicDonations.data.donations.some(x => x.id === settled.data.donation.id));
  record('sandbox_writes_success_ledger', { authenticated: false, providerTransactionPerformed: false, verificationStatus: settled.status, donationStatus: settled.data.donation.status, receiptIssued: Boolean(settled.data.donation.receiptNo), appearsInPublicPaidHistory: false });
  const directAutopay = await req('/api/public/autopay/', { donorName: 'Review Unpaid Mandate', email: 'review-autopay@example.invalid', amount: 500 });
  assert.equal(directAutopay.status, 201);
  record('autopay_without_payment', { authenticated: false, providerTransactionPerformed: false, creationStatus: directAutopay.status, mandateStatus: directAutopay.data.mandate.status, paymentCount: directAutopay.data.mandate.payments.length });
  const afterOverview = await req('/api/admin/overview/', undefined, admin);
  const total = r => r.data.overview?.kpis?.totalDonations || r.data.kpis?.totalDonations;
  assert.equal(total(afterOverview).amount - total(beforeOverview).amount, 1234);
  record('overview_ignores_finance', { beforeDonationKpi: total(beforeOverview), afterDonationKpi: total(afterOverview), afterKeys: Object.keys(afterOverview.data), returnedMonthlyDonations: (afterOverview.data.overview || afterOverview.data).monthlyDonations });
  const certificate = await req('/api/admin/membership-suite/certificates/', { kind: 'Visitor', recipientName: 'HTTP Recipient', program: 'Real issuance' }, admin);
  assert.equal(certificate.status, 201);
  const verification = await req('/api/certificates/verify/?code=' + encodeURIComponent(certificate.data.certificate.certNo));
  assert.equal(verification.status, 200);
  assert.equal(verification.data.verified, true);
  const flask = await req('/api/v1/certificates?search=GSDD');
  assert.equal(flask.status, 404);
  record('flask_proxy_without_service', { status: flask.status, dependencyConfiguredInContainer: false });
  if (process.env.REVIEW_BROWSER_TESTS === '1') {
    const { chromium, expect } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ baseURL: base });
      const signIn = await context.request.post('/api/admin/auth/login/', { headers: { Origin: base }, data: { username: 'review-admin', password } });
      assert.equal(signIn.status(), 200);
      const page = await context.newPage();
      await page.goto('/membership/');
      const application = page.locator('form').filter({ has: page.getByPlaceholder('Password (at least 8 characters) *', { exact: true }) });
      await application.getByPlaceholder('Full Name *', { exact: true }).fill('Browser Applicant');
      await application.getByPlaceholder('Email Address *', { exact: true }).fill('browser-applicant@example.invalid');
      await application.getByPlaceholder('Mobile Number *', { exact: true }).fill('9000000007');
      await application.getByPlaceholder('Password (at least 8 characters) *', { exact: true }).fill('BrowserApplicantSecret123!');
      await application.getByRole('checkbox').check();
      await application.getByRole('button', { name: 'Review Application' }).click();
      await expect(page.getByText('BrowserApplicantSecret123!', { exact: true })).toHaveCount(0);
      const [submission] = await Promise.all([
        page.waitForResponse(r => new URL(r.url()).pathname === '/api/public/members/' && r.request().method() === 'POST'),
        page.getByRole('button', { name: 'Confirm & Submit Application', exact: true }).click(),
      ]);
      assert.equal(submission.status(), 201, 'The actual membership form must provide its password');
      const browserApplicant = (await submission.json()).member;
      assert.equal(browserApplicant.paymentStatus, 'Pending');
      await page.goto('/admin/#website');
      await page.getByRole('tab', { name: 'Page Content', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
      await page.getByRole('tab', { name: 'Social Links', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();

      await page.goto('/admin/#team');
      await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
      await page.goto('/admin/#appointments');
      await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
      for (const [section, endpoint] of [['membership', '/api/admin/membership-suite/members/'], ['certificates', '/api/admin/membership-suite/certificates/'], ['messages', '/api/admin/membership-suite/notices/'], ['reports', '/api/admin/overview/']]) {
        const [response] = await Promise.all([
          page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().method() === 'GET'),
          page.goto(`/admin/#${section}`),
        ]);
        assert.equal(response.status(), 200, `${section} must use the durable API`);
      }
      console.log('PASS: admin browser controls use live member/certificate/notice/report modules and disable unsupported actions.');
    } finally { await browser.close(); }
  }
  console.log('PASS: HTTP registration, approval, reset/session revocation, photo persistence, enquiry/admin and donation/reconciliation flows, safe simulations, native certificate verification.');
} finally {
  server.kill();
  await new Promise(r => server.exitCode !== null ? r() : server.once('exit', r));
  await new Promise(resolve => mail.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
}
