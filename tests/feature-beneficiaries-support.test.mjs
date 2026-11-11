import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

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
    if (proc.exitCode !== null) throw new Error(`Server exited (${proc.exitCode})`);
    try {
      const res = await fetch(`${base}/api/public/beneficiaries/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-support-test-'));

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
        SUPPORT_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'sup-test-admin',
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
      '/api/admin/support/beneficiaries/',
      '/api/admin/support/complaints/',
      '/api/admin/support/enquiries/',
    ]) {
      assert.equal((await fetch(`${base}${ep}`)).status, 401);
    }

    // 2. Admin login
    const loginRes = await req('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sup-test-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Login failed:\n${logs}`);
    const setCookies = typeof loginRes.headers.getSetCookie === 'function'
      ? loginRes.headers.getSetCookie()
      : [loginRes.headers.get('set-cookie')].filter(Boolean);
    adminCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    // 3. Direct public Beneficiary Apply -> Admin Review + Add Benefit -> Public directory (no PII leak)
    const benApply = await req('/api/public/beneficiaries/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Shanti Devi',
        phone: '9835099112',
        email: 'shanti@example.org',
        category: 'Women Livelihood',
        district: 'Araria',
        needSummary: 'Embroidery equipment support',
      }),
    });
    assert.equal(benApply.status, 201);
    const { request: benReq } = await benApply.json();
    assert.equal(benReq.status, 'Direct Request');

    const directList = await (await req('/api/admin/support/beneficiaries/?tab=direct_request', { useAdmin: true })).json();
    const record = directList.beneficiaries.find((b) => b.trackingCode === benReq.trackingCode);
    assert.ok(record);

    const addBenefit = await req('/api/admin/support/beneficiaries/', {
      method: 'PATCH',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: record.id,
        status: 'Active',
        addBenefit: { benefitTitle: 'Embroidery Kit Grant', benefitValue: 'Rs. 6000' },
      }),
    });
    assert.equal(addBenefit.status, 200);

    const pubBen = await (await req(`/api/public/beneficiaries/?q=${encodeURIComponent(benReq.trackingCode)}`)).json();
    assert.equal(pubBen.beneficiaries.length, 1);
    assert.equal(pubBen.beneficiaries[0].benefitsCount, 1);
    assert.equal(pubBen.beneficiaries[0].phone, undefined, 'Private phone must not leak on public beneficiaries endpoint');

    const benCsv = await req('/api/admin/support/beneficiaries/?export=csv', { useAdmin: true });
    assert.equal(benCsv.status, 200);
    assert.ok((await benCsv.text()).includes('Shanti Devi'));

    // 4. Complaint Submit -> Admin Remark -> Public Status Lookup -> Delete
    const cmpPost = await req('/api/public/complaints/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complainantName: 'Kamal Prasad',
        email: 'kamal@example.org',
        subject: 'Receipt Spelling Correction',
        description: 'Request updating donor middle initial on certificate.',
      }),
    });
    assert.equal(cmpPost.status, 201);
    const { complaint: createdCmp } = await cmpPost.json();

    const cmpAll = await (await req('/api/admin/support/complaints/', { useAdmin: true })).json();
    const cmpItem = cmpAll.complaints.find((c) => c.ticketNo === createdCmp.ticketNo);
    assert.ok(cmpItem);

    const cmpResolve = await req('/api/admin/support/complaints/', {
      method: 'PATCH',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cmpItem.id,
        status: 'Resolved',
        adminRemark: 'Updated spelling and reissued certificate.',
      }),
    });
    assert.equal(cmpResolve.status, 200);

    const statusLookup = await (await req(`/api/public/complaints/?query=${encodeURIComponent(createdCmp.ticketNo)}`)).json();
    assert.equal(statusLookup.complaints[0].status, 'Resolved');
    assert.match(statusLookup.complaints[0].adminRemark, /reissued/);

    assert.equal(
      (await req('/api/admin/support/complaints/', {
        method: 'DELETE',
        useAdmin: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [cmpItem.id] }),
      })).status,
      200
    );

    // 5. Enquiries new filter + reply
    const enqNew = await (await req('/api/admin/support/enquiries/?status=new', { useAdmin: true })).json();
    assert.ok(enqNew.enquiries.length >= 1);
    const targetEnq = enqNew.enquiries[0];
    const replyRes = await req('/api/admin/support/enquiries/', {
      method: 'PATCH',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetEnq.id, adminReply: 'Thank you for reaching out, our CSR lead will call shortly.' }),
    });
    assert.equal(replyRes.status, 200);

    // 6. Public pages render 200 cleanly
    for (const [route, marker] of [
      ['/beneficiaries/', 'Active beneficiaries'],
      ['/beneficiaries/apply/', 'Apply for beneficiary aid.'],
      ['/complaints/', 'Help us hear what needs attention.'],
      ['/check-status/', 'Check complaint status.'],
    ]) {
      const p = await req(route);
      assert.equal(p.status, 200, `Route ${route} failed`);
      assert.ok((await p.text()).includes(marker), `Marker "${marker}" missing on ${route}`);
    }

    console.log('PASS: feature-beneficiaries-complaints-enquiries integration tests passed!');
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
