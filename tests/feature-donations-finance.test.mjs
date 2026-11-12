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
    if (proc.exitCode !== null) {
      throw new Error(`Next server exited prematurely with code ${proc.exitCode}`);
    }
    try {
      const res = await fetch(`${base}/api/public/campaigns/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-finance-test-'));

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
        FINANCE_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'fin-test-admin',
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
  let coordCookie = '';

  const req = async (url, { method = 'GET', headers = {}, body, cookie = '' } = {}) =>
    fetch(`${base}${url}`, {
      method,
      headers: {
        Origin: base,
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body,
    });

  const grabCookie = (res) => {
    const list = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);
    return list.map((c) => c.split(';')[0]).join('; ');
  };

  try {
    await waitForServer(base, child);

    // 1. Unauthenticated boundaries
    for (const p of [
      '/api/admin/finance/donations/',
      '/api/admin/campaigns/',
      '/api/admin/coordinators/',
      '/api/admin/coordinator-donations/',
      '/api/admin/other-donations/',
      '/api/admin/autopay/',
      '/api/coordinator/me/',
    ]) {
      assert.equal((await fetch(`${base}${p}`)).status, 401, `${p} must return 401 when unauthenticated`);
    }

    // 2. Admin login
    const loginRes = await req('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'fin-test-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Login failed:\n${logs}`);
    adminCookie = grabCookie(loginRes);

    // 3. Create Campaign & verify draft vs active visibility
    const campCreate = await req('/api/admin/campaigns/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Clean Solar Classrooms 2026',
        category: 'Environment & Sustainability',
        goalAmount: 50000,
        status: 'Active',
      }),
    });
    assert.equal(campCreate.status, 201);
    const { campaign } = await campCreate.json();

    const draftCamp = await req('/api/admin/campaigns/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Internal Draft Drive', goalAmount: 10000, status: 'Draft' }),
    });
    assert.equal(draftCamp.status, 201);

    const pubCamps = await (await req('/api/public/campaigns/')).json();
    assert.ok(pubCamps.campaigns.some((c) => c.id === campaign.id));
    assert.ok(!pubCamps.campaigns.some((c) => c.title === 'Internal Draft Drive'));

    // 4. PhonePe Net Banking Sandbox (reject wrong creds -> succeed test/test -> update campaign total)
    const sessRes = await req('/api/payments/sandbox/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gateway: 'phonepe',
        mode: 'netbanking',
        source: 'campaign',
        donorName: 'Vivek Raj',
        email: 'vivek@example.org',
        amount: 2500,
        purpose: 'Environment & Sustainability',
        campaignId: campaign.id,
      }),
    });
    assert.equal(sessRes.status, 201);
    const { session } = await sessRes.json();

    const badNb = await req('/api/payments/sandbox/verify/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, username: 'bad', password: 'bad' }),
    });
    assert.equal(badNb.status, 401);

    const okNb = await req('/api/payments/sandbox/verify/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, username: 'test', password: 'test' }),
    });
    assert.equal(okNb.status, 200);
    const nbData = await okNb.json();
    assert.equal(nbData.donation.status, 'Success');

    const campsAfter = await (await req('/api/public/campaigns/')).json();
    const updatedCamp = campsAfter.campaigns.find((c) => c.id === campaign.id);
    assert.equal(updatedCamp.raisedAmount, 2500);

    // 5. Public donation search includes new receipt
    const pubDon = await (await req(`/api/public/donations/?q=${encodeURIComponent(nbData.donation.receiptNo)}`)).json();
    assert.equal(pubDon.donations.length, 1);

    // 6. Admin Donations CSV Export & Edit/Bulk Delete
    const csvRes = await req('/api/admin/finance/donations/?source=all&export=csv', { cookie: adminCookie });
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers.get('content-type') || '', /text\/csv/);
    assert.ok((await csvRes.text()).includes('Vivek Raj'));

    // 7. Coordinator workflow: Admin creates coordinator -> Coordinator logs in -> submits collection -> Admin approves
    const coordPass = randomBytes(10).toString('hex');
    const cCreate = await req('/api/admin/coordinators/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kiran Coordinator',
        email: 'kiran.coord@example.org',
        phone: '9800001122',
        district: 'Araria',
        password: coordPass,
      }),
    });
    assert.equal(cCreate.status, 201);

    const cLogin = await req('/api/coordinator/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'kiran.coord@example.org', password: coordPass }),
    });
    assert.equal(cLogin.status, 200);
    coordCookie = grabCookie(cLogin);
    assert.ok(coordCookie.includes('gsdd_coordinator_session='));

    const cSubmit = await req('/api/coordinator/donations/', {
      method: 'POST',
      cookie: coordCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorName: 'Local Trader Group',
        donorPhone: '9811223344',
        amount: 3000,
        method: 'Direct QR',
        purpose: 'Education',
        proofRef: 'QR-990011',
      }),
    });
    assert.equal(cSubmit.status, 201);
    const { donation: coordDon } = await cSubmit.json();
    assert.equal(coordDon.status, 'Pending');

    const cApprove = await req('/api/admin/coordinator-donations/', {
      method: 'PATCH',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coordDon.id, status: 'Completed' }),
    });
    assert.equal(cApprove.status, 200);
    assert.equal((await cApprove.json()).donation.status, 'Completed');

    assert.equal((await req('/api/coordinator/logout/', { method: 'POST', cookie: coordCookie })).status, 200);

    // 8. Other Item Donation + AutoPay registration & status lookup + CSV export
    const otherRes = await req('/api/admin/other-donations/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorName: 'Hardware Partners',
        category: 'IT Equipment',
        items: [{ itemName: 'Desks', quantity: 5, unit: 'Pieces' }],
      }),
    });
    assert.equal(otherRes.status, 201);

    const apReg = await req('/api/public/autopay/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorName: 'Monthly Ally',
        email: 'ally@example.org',
        amount: 500,
        gateway: 'PhonePe AutoPay',
      }),
    });
    assert.equal(apReg.status, 201);
    const { mandate } = await apReg.json();

    const apLookup = await (await req(`/api/public/autopay/?query=${encodeURIComponent(mandate.mandateRef)}`)).json();
    assert.equal(apLookup.mandates.length, 1);

    const apCsv = await req('/api/admin/autopay/?export=csv', { cookie: adminCookie });
    assert.equal(apCsv.status, 200);
    assert.ok((await apCsv.text()).includes(mandate.mandateRef));

    // 9. Public pages return 200 with expected content
    for (const [route, marker] of [
      ['/campaigns/', 'Support a clearly described cause.'],
      ['/autopay-donate/', 'Auto-Pay monthly donation.'],
      ['/autopay-donate/status/', 'Auto-Pay status tracking.'],
      ['/donation-history/', 'Donation history'],
      ['/coordinator/login/', 'Coordinator Login'],
    ]) {
      const pRes = await req(route);
      assert.equal(pRes.status, 200, `Route ${route} failed`);
      assert.ok((await pRes.text()).includes(marker), `Marker "${marker}" missing on ${route}`);
    }

    console.log('PASS: feature-donations-finance integration tests passed!');
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
