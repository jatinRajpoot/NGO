import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const VALID_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

async function getFreePort() {
  const srv = net.createServer();
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const { port } = srv.address();
  await new Promise((resolve) => srv.close(resolve));
  return port;
}

async function waitForServer(base, proc) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`Server exited prematurely (${proc.exitCode})`);
    try {
      const res = await fetch(`${base}/api/public/projects/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-ops-test-'));

  const password = randomBytes(18).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  const sessionSecret = randomBytes(48).toString('hex');

  const hasBuild = existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'));
  const nextCmd = hasBuild ? 'start' : 'dev';

  const child = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', nextCmd, '--hostname', '127.0.0.1', '--port', String(port)],
    {
      env: {
        ...process.env,
        NODE_ENV: hasBuild ? 'production' : 'development',
        GALLERY_BUCKET: '',
        OPERATIONS_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'ops-test-admin',
        ADMIN_PASSWORD_HASH: passwordHash,
        ADMIN_SESSION_SECRET: sessionSecret,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );

  let logs = '';
  child.stdout.on('data', (d) => { logs = (logs + d).slice(-8000); });
  child.stderr.on('data', (d) => { logs = (logs + d).slice(-8000); });

  let adminCookie = '';
  const req = async (url, { method = 'GET', headers = {}, body, useAdmin = false } = {}) =>
    fetch(`${base}${url}`, {
      method,
      headers: { Origin: base, ...(useAdmin && adminCookie ? { Cookie: adminCookie } : {}), ...headers },
      body,
    });

  try {
    await waitForServer(base, child);

    // 1. Auth boundaries
    for (const ep of [
      '/api/admin/operations/videos/',
      '/api/admin/operations/events/',
      '/api/admin/operations/internships/',
      '/api/admin/operations/expenses/',
      '/api/admin/operations/jobs/',
      '/api/admin/operations/projects/',
    ]) {
      assert.equal((await fetch(`${base}${ep}`)).status, 401);
    }

    // 2. Admin login
    const loginRes = await req('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ops-test-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Login failed:\n${logs}`);
    const setCookies = typeof loginRes.headers.getSetCookie === 'function'
      ? loginRes.headers.getSetCookie()
      : [loginRes.headers.get('set-cookie')].filter(Boolean);
    adminCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    // 3. Videos CRUD
    const vidCreate = await req('/api/admin/operations/videos/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Araria Camp Film', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
    });
    assert.equal(vidCreate.status, 201);
    const { video } = await vidCreate.json();
    assert.equal(video.embedUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ');

    // 4. Events + Applicant flow
    const evtCreate = await req('/api/admin/operations/events/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Raniganj Career Camp', eventType: 'Workshops', date: '2026-06-15', venue: 'Raniganj Hall' }),
    });
    assert.equal(evtCreate.status, 201);
    const { event } = await evtCreate.json();

    const evtReg = await req('/api/public/events/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, name: 'Pooja Rani', email: 'pooja@example.org', phone: '9835011122' }),
    });
    assert.equal(evtReg.status, 201);

    const appsRes = await (await req('/api/admin/operations/events/?tab=applicants', { useAdmin: true })).json();
    assert.ok(appsRes.applicants.some((a) => a.email === 'pooja@example.org'));

    // 5. Internships + Apply + Cert Issue & Verify
    const intCreate = await req('/api/admin/operations/internships/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Field Research Intern', type: 'Hybrid', duration: '6 Weeks', stipend: 'Yes' }),
    });
    assert.equal(intCreate.status, 201);
    const { internship } = await intCreate.json();

    const intApply = await req('/api/public/internships/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internshipId: internship.id, applicantName: 'Aarav Jha', email: 'aarav@example.org', phone: '9911223344', qualification: 'B.A.' }),
    });
    assert.equal(intApply.status, 201);
    const { application: intApp } = await intApply.json();

    const certIssue = await req('/api/admin/operations/internships/', {
      method: 'PATCH',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: intApp.id, status: 'Approved' }),
    });
    assert.equal(certIssue.status, 200);
    const { application: certifiedApp } = await certIssue.json();
    assert.ok(certifiedApp.certificateId);

    const certVerify = await req(`/api/public/internships/?verifyCert=${encodeURIComponent(certifiedApp.certificateId)}`);
    assert.equal(certVerify.status, 200);
    assert.equal((await certVerify.json()).certificate.internName, 'Aarav Jha');

    // 6. Expenses + Attachment + Spoof Check + CSV
    const badExp = new FormData();
    badExp.append('title', 'Bad File Expense');
    badExp.append('amount', '500');
    badExp.append('attachment', new File([Buffer.from('fake image')], 'spoof.png', { type: 'image/png' }));
    assert.equal((await req('/api/admin/operations/expenses/', { method: 'POST', useAdmin: true, body: badExp })).status, 400);

    const goodExp = new FormData();
    goodExp.append('title', 'Seminar Stationery');
    goodExp.append('category', 'Stationery & Printing');
    goodExp.append('amount', '1250');
    goodExp.append('paymentMode', 'UPI');
    goodExp.append('attachment', new File([VALID_PNG], 'bill.png', { type: 'image/png' }));
    const expRes = await req('/api/admin/operations/expenses/', { method: 'POST', useAdmin: true, body: goodExp });
    assert.equal(expRes.status, 201);
    const { expense } = await expRes.json();
    assert.ok(expense.attachmentSrc);

    const attFetch = await req(expense.attachmentSrc, { useAdmin: true });
    assert.equal(attFetch.status, 200);
    assert.equal(attFetch.headers.get('content-type'), 'image/png');

    const expCsv = await req('/api/admin/operations/expenses/?export=csv', { useAdmin: true });
    assert.equal(expCsv.status, 200);
    assert.ok((await expCsv.text()).includes('Seminar Stationery'));

    // 7. Jobs + Career Application
    const jobCreate = await req('/api/admin/operations/jobs/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Block Trainer', location: 'Araria, Bihar', status: 'Active' }),
    });
    assert.equal(jobCreate.status, 201);
    const { job } = await jobCreate.json();

    const jobApply = await req('/api/public/jobs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, name: 'Deepak Mahto', email: 'deepak@example.org', phone: '9800112233' }),
    });
    assert.equal(jobApply.status, 201);

    // 8. Projects
    const prjCreate = await req('/api/admin/operations/projects/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Solar Digital Lab', category: 'Education', goalAmount: 100000, spentAmount: 40000 }),
    });
    assert.equal(prjCreate.status, 201);

    // 9. Public routes return 200 and expected markers
    for (const [route, marker] of [
      ['/events/', 'Meet, learn and take part.'],
      ['/internships/', 'Learn through community-centred work.'],
      ['/internships/verify-certificate/', 'Internship certificate verification.'],
      ['/careers/', 'Join our programme team.'],
      ['/projects/', 'Ideas for community-centred work.'],
    ]) {
      const p = await req(route);
      assert.equal(p.status, 200, `Route ${route} failed`);
      assert.ok((await p.text()).includes(marker), `Marker "${marker}" missing on ${route}`);
    }

    console.log('PASS: feature-operations integration tests passed!');
  } finally {
    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
    await rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
