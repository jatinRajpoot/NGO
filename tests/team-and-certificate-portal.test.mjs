import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { defaultTeamMembers } from '../app/team/team-data.js';

console.log('--- Testing Team Member Data & Schema ---');
assert(Array.isArray(defaultTeamMembers), 'defaultTeamMembers must be an array');
assert(defaultTeamMembers.length >= 2, 'Must have at least 2 demo team members');

for (const tm of defaultTeamMembers) {
  assert(tm.id, 'Team member must have ID');
  assert(tm.name, 'Team member must have name');
  assert(tm.email, 'Team member must have email');
  assert(tm.phone, 'Team member must have phone');
  assert(tm.role, 'Team member must have role');
  assert(tm.designation, 'Team member must have designation');
  assert(tm.department, 'Team member must have department');
  assert(tm.bio, 'Team member must have bio');
  assert(Array.isArray(tm.responsibilities), 'Team member must have responsibilities array');
  assert(Array.isArray(tm.notifications), 'Team member must have notifications array');
  assert(Array.isArray(tm.certificates), 'Team member must have certificates array');
}
console.log('PASS: Team member schema & demo profiles verified successfully.');

console.log('--- Testing Team Member HTTP Endpoints ---');
const port = 3014;
const server = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

async function waitForServer(url, timeout = 35000) {
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
  await waitForServer(`http://localhost:${port}/team/login`);

  // 1. Team Login Route
  const resLogin = await fetch(`http://localhost:${port}/team/login`);
  assert.equal(resLogin.status, 200, 'Team login should return 200');
  const textLogin = await resLogin.text();
  assert(textLogin.includes('Team Member Login'), 'Login page should render title');
  assert(textLogin.includes('Manoj Kumar Bishwas'), 'Login page should render Manoj Kumar Bishwas demo button');
  assert(textLogin.includes('Arvind Kumar'), 'Login page should render Arvind Kumar demo button');
  console.log('PASS: /team/login route verified.');

  // 2. Team Portal Dashboard Route
  const resPortal = await fetch(`http://localhost:${port}/team/portal`);
  assert.equal(resPortal.status, 200, 'Team portal should return 200');
  const textPortal = await resPortal.text();
  assert(textPortal.includes('View Profile'), 'Portal should render sidebar tab: View Profile');
  assert(textPortal.includes('View Designation'), 'Portal should render sidebar tab: View Designation');
  assert(textPortal.includes('Update Profile &amp; Photo') || textPortal.includes('Update Profile & Photo'), 'Portal should render sidebar tab: Update Profile & Photo');
  assert(textPortal.includes('View Bio'), 'Portal should render sidebar tab: View Bio');
  assert(textPortal.includes('View Team Members'), 'Portal should render sidebar tab: View Team Members');
  assert(textPortal.includes('View Notifications'), 'Portal should render sidebar tab: View Notifications');
  assert(textPortal.includes('View Certificates'), 'Portal should render sidebar tab: View Certificates');
  console.log('PASS: /team/portal route and all sidebar tabs verified.');

  console.log('ALL TEAM MEMBER PORTAL TESTS PASSED!');
} finally {
  server.kill('SIGTERM');
}
