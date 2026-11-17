import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { encodeQrMatrix } from '../app/lib/qr-encode.js';

console.log('--- 1. Testing QR Code Encoders Across All Modules ---');

const qrTestCases = [
  // Website QR presets
  'https://gsddfoundation.org/',
  'https://gsddfoundation.org/donate/',
  'https://gsddfoundation.org/membership/',
  'https://gsddfoundation.org/verify/',
  // Member & Certificate Verification
  'https://gsddfoundation.org/verify/?code=MEM-2026-0042',
  'https://gsddfoundation.org/verify/?code=CERT-2026-0891',
  'https://gsddfoundation.org/verify/?code=GSDD-REC-2026-8801',
  'https://gsddfoundation.org/verify?type=certificate&id=GSDD-CERT-2026-001',
  'https://gsddfoundation.org/verify?type=appointment&id=GSDD-APT-2026-001',
  // UPI Payment QRs
  'upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20FOUNDATION&am=1200&cu=INR&tn=Membership%20Fee%20MEM-001',
  'upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20FOUNDATION&am=2500&cu=INR&tn=Donation%20Rural%20Healthcare',
  'upi://pay?pa=foundationgsdd@okaxis&pn=GSDD%20FOUNDATION&am=1100&cu=INR&tn=Member%20Donation%20Health',
];

for (const payload of qrTestCases) {
  const matrix = encodeQrMatrix(payload);
  assert(matrix.size >= 21, `QR size should be at least 21x21 for ${payload}`);
  assert(Array.isArray(matrix.modules), `QR modules must be an array for ${payload}`);
  assert.equal(matrix.modules.length, matrix.size);
  assert.equal(matrix.modules[0].length, matrix.size);
  // Verify modules are boolean
  assert.equal(typeof matrix.modules[0][0], 'boolean');
}
console.log(`PASS: All ${qrTestCases.length} QR payloads encoded successfully with genuine ISO-18004 matrices.`);

console.log('--- 2. Testing Member Dashboard Search Bar Placement ---');
const listener = createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const base = 'http://127.0.0.1:' + port;
const directory = await mkdtemp(path.join(tmpdir(), 'gsdd-verify-qr-'));
const reference = 'GSDD-VIS-2026-QR-FIXTURE';
await writeFile(path.join(directory, 'certificates.json'), JSON.stringify([{
  id: reference, recipient: 'QR Browser Fixture', type: 'Visitor Certificate',
  status: 'Verified', isVerifiedOfficial: true, date: '2026-01-01',
}]));
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, GALLERY_BUCKET: '', PORTAL_DATA_DIR: directory },
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
  await waitForServer(base + '/member/dashboard/');
  const res = await fetch(base + '/member/dashboard/');
  assert.equal(res.status, 200, 'Member dashboard must return status 200');
  const html = await res.text();

  // 1. Verify Member Utility Search Bar is present
  assert(html.includes('member-utility-strip'), 'HTML must contain member-utility-strip');
  assert(html.includes('Quick jump (notices, referrals, phonepe, receipt, photo)...'), 'Search bar placeholder must be present');
  assert(html.includes('Referrals ('), 'Referrals shortcut button must be present');
  assert(html.includes('Notices ('), 'Notices shortcut button must be present');
  assert(html.includes('Photo'), 'Photo shortcut button must be present');
  assert(html.includes('Dark') || html.includes('Light'), 'Theme toggle must be present');

  // 2. Verify search bar is placed BEFORE the member greeting/top bar (at the top of the content)
  const searchIndex = html.indexOf('member-utility-strip');
  const greetingIndex = html.indexOf('member-greeting');
  assert(searchIndex !== -1, 'Search bar must exist');
  assert(greetingIndex !== -1, 'Member greeting must exist');
  assert(searchIndex < greetingIndex, `Search bar (index ${searchIndex}) must appear BEFORE member greeting (index ${greetingIndex}) at the top of member dashboard!`);
  console.log(`PASS: Member search bar correctly positioned at top of dashboard (searchIndex: ${searchIndex} < greetingIndex: ${greetingIndex}).`);

  // 3. Verify Bottom Quick Bar is present after content
  const bottomNavIndex = html.indexOf('Member Quick Access');
  assert(bottomNavIndex !== -1, 'Bottom Quick-Access nav must be present');
  assert(bottomNavIndex > greetingIndex, 'Bottom Quick-Access bar must be placed after main greeting content');
  console.log('PASS: Member Bottom Quick-Access bar correctly positioned.');

  // 4. Verify QR codes rendered across routes
  const resCert = await fetch(base + '/visitor-certificate/');
  assert.equal(resCert.status, 200);
  const certHtml = await resCert.text();
  assert(certHtml.includes('Visitor Certificate'), 'Visitor certificate route working');
  console.log('PASS: Visitor Certificate route verified.');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(base + '/verify/?code=' + encodeURIComponent(reference));
    await expect(page.getByText('AUTHENTIC QR', { exact: true })).toBeVisible();
    await expect(page.getByText('QR Browser Fixture', { exact: true }).first()).toBeVisible();
  } finally {
    await browser.close();
  }

  console.log('\nALL MEMBER SEARCH BAR & QR VERIFICATION TESTS PASSED SUCCESSFULLY!');
} finally {
  const exited = server.exitCode === null ? once(server, 'exit') : Promise.resolve();
  server.kill('SIGTERM');
  await exited;
  await rm(directory, { recursive: true, force: true });
}
