import './helpers/register-source.mjs';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';

const directory = await mkdtemp(path.join(tmpdir(), 'gsdd-review-workflows-'));
Object.assign(process.env, { NODE_ENV: 'production', GALLERY_BUCKET: '', PORTAL_DATA_DIR: directory,
  ADMIN_DATA_DIR: directory, MEMBERSHIP_DATA_DIR: directory, FINANCE_DATA_DIR: directory,
  OPERATIONS_DATA_DIR: directory, SUPPORT_DATA_DIR: directory, ADMIN_SYSTEM_DATA_DIR: directory,
  PORTAL_SESSION_SECRET: 'isolated-regression-secret-at-least-thirty-two-characters', RESEND_API_KEY: '' });
delete process.env.GSDD_DEMO_DATA;
let resetToken;
const notification = createServer(async (request, response) => {
  let body = ''; for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  if (payload.metadata?.kind === 'member_password_reset') resetToken = payload.metadata.resetToken;
  response.writeHead(200); response.end('{}');
});
await new Promise(resolve => notification.listen(0, '127.0.0.1', resolve));
process.env.NOTIFICATION_WEBHOOK_URL = `http://127.0.0.1:${notification.address().port}/`;

try {
  const portal = await import('../app/lib/portal-store.js');
  const membership = await import('../app/lib/membership-suite-store.js');
  const finance = await import('../app/lib/finance-store.js');
  const support = await import('../app/lib/support-store.js');
  const operations = await import('../app/lib/operations-store.js');
  const { getAdminOverviewData } = await import('../app/lib/admin-system-store.js');
  const recovery = await import('../app/lib/member-recovery.js');

  const empty = await getAdminOverviewData();
  assert.equal(empty.kpis.totalMembers.count, 0);
  assert.equal(empty.kpis.totalDonations.amount, 0);
  assert.equal(empty.kpis.beneficiaries.count, 0);
  assert.equal(empty.quickStats.pendingReconciliations, 0);
  assert.ok(empty.monthlyDonations.every(m => m.total === 0 && m.cash + m.online === m.total));

  // Existing portal credentials win over a legacy application with the same email.
  const { hashPassword } = await import('../app/lib/portal-auth.js');
  await portal.registerMemberAccount({ name: 'Existing', email: 'existing@example.invalid', phone: '9000000001', address: 'Fixture', password: 'ExistingSecret123!' });
  await writeFile(path.join(directory, 'membership-suite', 'members-ext.json'), JSON.stringify([
    { id: 'ext-existing', name: 'Duplicate', email: 'existing@example.invalid', mobile: '9000000001', accountStatus: 'Blocked', passwordHash: await hashPassword('WrongLegacySecret123!') },
    { id: 'ext-legacy', name: 'Legacy', email: 'legacy@example.invalid', mobile: '9000000002', accountStatus: 'Active', passwordHash: await hashPassword('LegacySecret123!') },
  ]));
  assert.ok(await portal.authenticateMemberAccount('existing@example.invalid', 'ExistingSecret123!'));
  assert.equal(await portal.authenticateMemberAccount('existing@example.invalid', 'WrongLegacySecret123!'), null);
  assert.ok(await portal.authenticateMemberAccount('legacy@example.invalid', 'LegacySecret123!'));
  await membership.deleteExtendedMembers(['ext-legacy']);
  assert.ok(!(await portal.memberAccountStore.read()).some(m => m.id === 'ext-legacy'), 'Migrated deleted records must not return');
  await writeFile(path.join(directory, 'finance', 'donations.json'), JSON.stringify([{ id: 'legacy-simulation', donorName: 'Old Simulation', email: 'old@example.invalid', amount: 9999, status: 'Success', utr: 'OLD-SANDBOX-REF' }]));
  await writeFile(path.join(directory, 'finance', 'gateway-sessions.json'), JSON.stringify([{ status: 'Completed', txRef: 'OLD-SANDBOX-REF' }]));
  assert.equal((await finance.listFinanceDonations()).length, 0, 'Historical sandbox transactions with recorded sessions must be excluded');
  const created = await membership.createExtendedMember({ name: 'Workflow Member', email: 'workflow@example.invalid', mobile: '9876543210', password: 'OriginalPass123!', address: 'Isolated address' }, { isPublicApply: true });
  assert.ok(created.ok);
  assert.equal(await portal.authenticateMemberAccount('workflow@example.invalid', 'OriginalPass123!'), null);
  await membership.updateExtendedMember(created.member.id, { accountStatus: 'Active' });
  assert.ok(await portal.authenticateMemberAccount('workflow@example.invalid', 'OriginalPass123!'));
  await membership.updateExtendedMember(created.member.id, { accountStatus: 'Blocked' });
  assert.equal(await portal.authenticateMemberAccount('workflow@example.invalid', 'OriginalPass123!'), null);
  await membership.updateExtendedMember(created.member.id, { accountStatus: 'Active' });

  const insecure = await recovery.confirmMemberPasswordReset({ email: 'workflow@example.invalid', phone: '3210', newPassword: 'ReplacementPass123!' });
  assert.equal(insecure.ok, false);
  assert.ok((await recovery.requestMemberPasswordReset('workflow@example.invalid')).ok);
  assert.ok(resetToken);
  const storedReset = await readFile(path.join(directory, 'member-password-resets.json'), 'utf8');
  assert.ok(!storedReset.includes(resetToken), 'Store only a token digest');
  assert.ok((await recovery.confirmMemberPasswordReset({ token: resetToken, newPassword: 'ReplacementPass123!' })).ok);
  assert.equal(await portal.authenticateMemberAccount('workflow@example.invalid', 'OriginalPass123!'), null);
  assert.ok(await portal.authenticateMemberAccount('workflow@example.invalid', 'ReplacementPass123!'));
  assert.equal((await recovery.confirmMemberPasswordReset({ token: resetToken, newPassword: 'AnotherPass123!' })).ok, false);

  await portal.updateMemberProfile(created.member.id, { photoSrc: '/api/members/photo/mem-photo-fixture.png/' });
  assert.equal((await portal.getMemberWorkspace(created.member.id)).photoSrc, '/api/members/photo/mem-photo-fixture.png/');
  const inquiry = await portal.createInquiryTicket({ name: 'Workflow Sender', email: 'sender@example.invalid', message: 'Real enquiry content' });
  assert.ok((await support.listEnquiries()).some(r => r.id === inquiry.ticket.ticketId));
  await support.replyToEnquiry(inquiry.ticket.ticketId, { adminReply: 'Saved reply' });
  assert.equal((await support.listEnquiries({ status: 'replied' }))[0].adminReply, 'Saved reply');
  const donation = await portal.createPendingDonation({ source: 'visitor', donorName: 'Workflow Donor', email: 'donor@example.invalid', amount: 1234, method: 'UPI', utr: 'WORKFLOW-123456' });
  const listed = (await finance.listFinanceDonations()).find(r => r.id === donation.donation.id);
  assert.ok(listed.requiresReconciliation);
  assert.ok(!(await finance.listFinanceDonations({ status: 'success' })).some(r => r.id === donation.donation.id));
  assert.ok((await finance.updateFinanceDonation(listed.id, { status: 'Success' })).ok);
  assert.equal((await portal.readPortalRecords('donations')).find(r => r.id === donation.donation.id).status, 'Verified');
  assert.equal((await getAdminOverviewData()).kpis.totalDonations.amount, 1234);

  const session = await finance.createGatewaySession({ gateway: 'razorpay', amount: 5000, donorName: 'Simulation' });
  const simulated = await finance.verifyGatewaySession({ sessionId: session.session.sessionId });
  assert.equal(simulated.isSandbox, true);
  assert.equal(simulated.donation.receiptNo, null);
  assert.equal((await finance.listFinanceDonations()).length, 1);
  assert.equal((await getAdminOverviewData()).kpis.totalDonations.amount, 1234);
  const mandate = await finance.registerAutoPayMandate({ donorName: 'Unpaid', email: 'unpaid@example.invalid', amount: 500 });
  assert.equal(mandate.mandate.status, 'Pending Authorization');
  assert.deepEqual(mandate.mandate.payments, []);
  assert.equal((await finance.updateAutoPayMandateStatus(mandate.mandate.id, { triggerDebit: true })).ok, false);

  const track = await operations.createInternship({ title: 'Workflow internship', duration: '1 month', status: 'Active' });
  const application = await operations.applyForInternship({ internshipId: track.internship.id, name: 'Intern', email: 'intern@example.invalid', phone: '9000000000' });
  const issued = await operations.issueInternshipCertificate(application.application.id, 'Approved');
  assert.equal((await operations.verifyInternshipCertificate(issued.application.certificateId)).verified, true);
  await operations.issueInternshipCertificate(application.application.id, 'Rejected');
  assert.equal((await operations.verifyInternshipCertificate(issued.application.certificateId)).found, false);
  console.log('PASS: account approval/reset/photo, enquiry and donation queues, real overview, isolated simulations, unpaid mandates and certificate revocation.');
} finally {
  await new Promise(resolve => notification.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
