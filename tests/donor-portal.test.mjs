import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { defaultDonors, donorPrograms, donorTaxDetails, donorImpactStories } from '../app/donor/donor-data.js';

console.log('--- Testing Donor Data & Schema ---');
assert(Array.isArray(defaultDonors), 'defaultDonors should be an array');
assert(defaultDonors.length >= 2, 'defaultDonors should have at least 2 demo donor accounts');

for (const d of defaultDonors) {
  assert(d.id, 'Donor must have id');
  assert(d.name, 'Donor must have name');
  assert(d.email, 'Donor must have email');
  assert(d.phone, 'Donor must have phone');
  assert(d.pan, 'Donor must have pan');
  assert(d.tier, 'Donor must have tier');
  assert(typeof d.totalDonated === 'number', 'Donor totalDonated must be a number');
  assert(Array.isArray(d.donations), 'Donor must have donations array');
  assert(Array.isArray(d.subscriptions), 'Donor must have subscriptions array');
  assert(d.notifications, 'Donor must have notifications object');
  assert(Array.isArray(d.certificates), 'Donor must have certificates array');
}

assert(Array.isArray(donorPrograms), 'donorPrograms must be an array');
assert(donorPrograms.length >= 5, 'donorPrograms must have at least 5 focus areas');

assert(donorTaxDetails.mcaRegNumber, 'donorTaxDetails must include mcaRegNumber');
assert(donorTaxDetails.section80GNumber, 'donorTaxDetails must include section80GNumber');
assert(donorTaxDetails.bankAccount.upiId, 'donorTaxDetails must include UPI ID');

console.log('PASS: Donor schema, tax registration, and demo profiles verified successfully.');

console.log('--- Testing Donor Portal HTTP Endpoints ---');
const port = 3012;
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
  await waitForServer(`http://localhost:${port}/donor/login`);

  // 1. Donor Login Route
  const resLogin = await fetch(`http://localhost:${port}/donor/login`);
  assert.equal(resLogin.status, 200, 'Donor login should return 200');
  const textLogin = await resLogin.text();
  assert(textLogin.includes('Donor Login'), 'Login page should render Donor Login');
  assert(textLogin.includes('Donor &amp; Patron Portal') || textLogin.includes('Donor & Patron Portal'), 'Login page should render Patron badge');
  assert(textLogin.includes('Rajesh Patel'), 'Login page should render Rajesh Patel demo chip');
  assert(textLogin.includes('Priya Sharma'), 'Login page should render Priya Sharma demo chip');
  console.log('PASS: /donor/login route working correctly.');

  // 2. Donor Register Route
  const resReg = await fetch(`http://localhost:${port}/donor/register`);
  assert.equal(resReg.status, 200, 'Donor register should return 200');
  const textReg = await resReg.text();
  assert(textReg.includes('Donor &amp; Patron Registration') || textReg.includes('Donor & Patron Registration'), 'Register page should render title');
  assert(textReg.includes('PAN Card Number'), 'Register page should ask for PAN Card');
  assert(textReg.includes('Section 80G'), 'Register page should mention Section 80G');
  console.log('PASS: /donor/register route working correctly.');

  // 3. Donor Dashboard Route
  const resDash = await fetch(`http://localhost:${port}/donor/dashboard`);
  assert.equal(resDash.status, 200, 'Donor dashboard should return 200');
  const textDash = await resDash.text();
  assert(textDash.includes('Overview'), 'Dashboard should render sidebar item: Overview');
  assert(textDash.includes('Make donation'), 'Dashboard should render sidebar item: Make donation');
  assert(textDash.includes('Download Receipt'), 'Dashboard should render sidebar item: Download Receipt');
  assert(textDash.includes('Manage Subscription'), 'Dashboard should render sidebar item: Manage Subscription');
  assert(textDash.includes('Donor profile'), 'Dashboard should render sidebar item: Donor profile');
  assert(textDash.includes('Change password'), 'Dashboard should render sidebar item: Change password');
  assert(textDash.includes('Donation History'), 'Dashboard should render sidebar item: Donation History');
  assert(textDash.includes('Monthly Donation'), 'Dashboard should render sidebar item: Monthly Donation');
  assert(textDash.includes('Notifications'), 'Dashboard should render sidebar item: Notifications');
  assert(textDash.includes('Donation Certificate'), 'Dashboard should render sidebar item: Donation Certificate');
  console.log('PASS: /donor/dashboard route and all handwritten sidebar modules rendered correctly.');

  console.log('ALL DONOR PORTAL INTEGRATION TESTS PASSED!');
} finally {
  server.kill('SIGTERM');
}
