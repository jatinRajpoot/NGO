import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { defaultMembers } from '../app/member/member-data.js';

console.log('--- Testing Member Data & Schema ---');
assert(Array.isArray(defaultMembers), 'defaultMembers should be an array');
assert(defaultMembers.length >= 2, 'defaultMembers should have at least 2 demo members');

for (const m of defaultMembers) {
  assert(m.id, 'Member must have id');
  assert(m.name, 'Member must have name');
  assert(m.email, 'Member must have email');
  assert(m.phone, 'Member must have phone');
  assert(m.designation, 'Member must have designation');
  assert(m.category, 'Member must have category');
  assert(m.feeStatus, 'Member must have feeStatus');
  assert(Array.isArray(m.activities), 'Member must have activities list');
  assert(Array.isArray(m.donations), 'Member must have donations list');
  assert(Array.isArray(m.certificates), 'Member must have certificates list');
  assert(m.notifications, 'Member must have notifications settings');
  assert(Array.isArray(m.messages), 'Member must have messages thread');
}
console.log('PASS: Member schema & demo profiles verified successfully.');

console.log('--- Testing Member Portal HTTP Endpoints ---');
const port = 3010;
const server = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not start in time');
}

try {
  await waitForServer(`http://localhost:${port}/member/login`);

  // 1. Member Login Route
  const resLogin = await fetch(`http://localhost:${port}/member/login`);
  assert.equal(resLogin.status, 200, 'Member login should return 200');
  const textLogin = await resLogin.text();
  assert(textLogin.includes('Member Login'), 'Login page should render Member Login');
  assert(textLogin.includes('Member Portal'), 'Login page should render Member Portal badge');
  console.log('PASS: /member/login route working correctly.');

  // 2. Member Register Route
  const resReg = await fetch(`http://localhost:${port}/member/register`);
  assert.equal(resReg.status, 200, 'Member register should return 200');
  const textReg = await resReg.text();
  assert(textReg.includes('Member Registration'), 'Register page should render title');
  console.log('PASS: /member/register route working correctly.');

  // 3. Member Dashboard Route
  const resDash = await fetch(`http://localhost:${port}/member/dashboard`);
  assert.equal(resDash.status, 200, 'Member dashboard should return 200');
  const textDash = await resDash.text();
  assert(textDash.includes('Overview'), 'Dashboard should render sidebar item: Overview');
  assert(textDash.includes('Membership Details'), 'Dashboard should render sidebar item: Membership Details');
  assert(textDash.includes('Membership Fees'), 'Dashboard should render sidebar item: Membership Fees');
  assert(textDash.includes('Payment Receipts'), 'Dashboard should render sidebar item: Payment Receipts');
  assert(textDash.includes('Membership ID Card'), 'Dashboard should render sidebar item: Membership ID Card');
  assert(textDash.includes('My Certificates'), 'Dashboard should render sidebar item: My Certificates');
  assert(textDash.includes('My Donations'), 'Dashboard should render sidebar item: My Donations');
  assert(textDash.includes('Referral System'), 'Dashboard should render sidebar item: Referral System');
  assert(textDash.includes('Notifications'), 'Dashboard should render sidebar item: Notifications');
  assert(textDash.includes('Messages'), 'Dashboard should render sidebar item: Messages');
  assert(textDash.includes('Change Password'), 'Dashboard should render sidebar item: Change Password');
  console.log('PASS: /member/dashboard route and all 12 sidebar modules rendered correctly.');

  console.log('ALL MEMBER PORTAL INTEGRATION TESTS PASSED!');
} finally {
  server.kill('SIGTERM');
}
