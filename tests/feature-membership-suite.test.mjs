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
    if (proc.exitCode !== null) throw new Error(`Server exited (${proc.exitCode})`);
    try {
      const res = await fetch(`${base}/api/public/members/?view=management`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-mem-suite-test-'));

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
        MEMBERSHIP_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'mem-suite-admin',
        ADMIN_PASSWORD_HASH: passwordHash,
        ADMIN_SESSION_SECRET: sessionSecret,
        PORTAL_SESSION_SECRET: sessionSecret,
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
  let memberCookie = '';

  const req = async (url, { method = 'GET', headers = {}, body, cookie = '' } = {}) =>
    fetch(`${base}${url}`, {
      method,
      headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...headers },
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

    // 1. Auth boundaries
    for (const ep of [
      '/api/admin/membership-suite/members/',
      '/api/admin/membership-suite/designations/',
      '/api/admin/membership-suite/notices/',
      '/api/admin/membership-suite/certificates/',
      '/api/admin/membership-suite/management-body/',
      '/api/member/extensions/',
    ]) {
      assert.equal((await fetch(`${base}${ep}`)).status, 401);
    }

    // 2. Admin login
    const loginRes = await req('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'mem-suite-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Login failed:\n${logs}`);
    adminCookie = grabCookie(loginRes);

    // 3. Public Full Membership Apply w/ photo & Aadhaar masking + Admin Verification + Public Member Lookup
    const applyFd = new FormData();
    applyFd.append('name', 'Anjali Kumari');
    applyFd.append('email', 'anjali.apply@example.org');
    applyFd.append('mobile', '9835099001');
    applyFd.append('gender', 'Female');
    applyFd.append('aadhaarNumber', '123456789012');
    applyFd.append('referralCode', 'NGO-2026-0032');
    applyFd.append('photo', new File([VALID_PNG], 'anjali.png', { type: 'image/png' }));

    const applyRes = await req('/api/public/members/', { method: 'POST', body: applyFd });
    assert.equal(applyRes.status, 201);
    const { member: appliedMember } = await applyRes.json();
    assert.equal(appliedMember.aadhaarMasked, 'XXXX-XXXX-9012');
    assert.equal(appliedMember.accountStatus, 'Pending');
    assert.ok(appliedMember.photoSrc);

    const photoFetch = await req(appliedMember.photoSrc);
    assert.equal(photoFetch.status, 200);
    assert.equal(photoFetch.headers.get('content-type'), 'image/png');

    // Admin verifies & activates
    const verifyPatch = await req('/api/admin/membership-suite/members/', {
      method: 'PATCH',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appliedMember.id, accountStatus: 'Active', verified: true }),
    });
    assert.equal(verifyPatch.status, 200);

    // Verify public lookup finds active member without leaking mobile/aadhaar
    const lookupRes = await req(`/api/public/members/?verify=${encodeURIComponent(appliedMember.regNo)}`);
    assert.equal(lookupRes.status, 200);
    const lookupJson = await lookupRes.json();
    assert.equal(lookupJson.member.name, 'Anjali Kumari');
    assert.equal(lookupJson.member.aadhaarMasked, undefined);
    assert.equal(lookupJson.member.mobile, undefined);

    // CSV export
    const memCsv = await req('/api/admin/membership-suite/members/?export=csv', { cookie: adminCookie });
    assert.equal(memCsv.status, 200);
    assert.ok((await memCsv.text()).includes('Anjali Kumari'));

    // 4. Designations CRUD & Export
    const desRes = await req('/api/admin/membership-suite/designations/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Block Volunteer', feeRs: 300, validityYears: 1, renewalFeeRs: 200, status: 1 }),
    });
    assert.equal(desRes.status, 201);

    // 5. Notices multi-select dispatch & delete
    const noticeRes = await req('/api/admin/membership-suite/notices/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Notice', message: 'Orientation Friday', recipientIds: ['all'] }),
    });
    assert.equal(noticeRes.status, 201);
    const { notice } = await noticeRes.json();
    assert.equal(
      (await req('/api/admin/membership-suite/notices/', {
        method: 'DELETE',
        cookie: adminCookie,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notice.id] }),
      })).status,
      200
    );

    // 6. Visitor Certificates + Template Selection & Management Body CRUD
    const certRes = await req('/api/admin/membership-suite/certificates/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'Visitor', recipientName: 'Guest Speaker', program: 'Digital Literacy Camp', design: 'Royal Gold Seal' }),
    });
    assert.equal(certRes.status, 201);

    const mgmtRes = await req('/api/admin/membership-suite/management-body/', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Advisory Trustee', designation: 'Treasurer', displayOrder: 4, status: 'Active' }),
    });
    assert.equal(mgmtRes.status, 201);

    // 7. Member registration & Member Extensions (PhonePe test/test donation + referrals + notices + photo)
    const memRegRes = await req('/api/member/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Member Extension User',
        email: 'member.ext@example.org',
        phone: '9835055443',
        address: 'Raniganj, Araria, Bihar',
        password: 'StrongPassword123!',
        category: 'Annual Member',
      }),
    });
    assert.equal(memRegRes.status, 201);
    memberCookie = grabCookie(memRegRes);

    const extGet = await req('/api/member/extensions/', { cookie: memberCookie });
    assert.equal(extGet.status, 200);
    assert.ok(Array.isArray((await extGet.json()).notices));

    const badMemberNb = await req('/api/member/extensions/', {
      method: 'POST',
      cookie: memberCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gateway_donate', gateway: 'phonepe', username: 'bad', password: 'bad', amount: 500 }),
    });
    assert.equal(badMemberNb.status, 401);

    const okMemberNb = await req('/api/member/extensions/', {
      method: 'POST',
      cookie: memberCookie,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gateway_donate', gateway: 'phonepe', username: 'test', password: 'test', amount: 500 }),
    });
    assert.equal(okMemberNb.status, 201);

    // 8. Forgot password verify & reset flow
    const fpBad = await req('/api/public/forgot-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'confirm', email: 'anjali.apply@example.org', phone: '0000000000', newPassword: 'NewPassword99!' }),
    });
    assert.equal(fpBad.status, 400);

    const fpGood = await req('/api/public/forgot-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'confirm', email: 'anjali.apply@example.org', phone: '9835099001', newPassword: 'NewPassword99!' }),
    });
    assert.equal(fpGood.status, 200);

    // 9. Public pages return 200 cleanly
    for (const [route, marker] of [
      ['/general-members/', 'Verified general members.'],
      ['/management-body/', 'Foundation management body.'],
      ['/member-verification/', 'Members verification lookup.'],
      ['/forgot-password/', 'Forgot password recovery.'],
      ['/membership/', 'Interested in becoming a member?'],
    ]) {
      const p = await req(route);
      assert.equal(p.status, 200, `Route ${route} failed`);
      assert.ok((await p.text()).includes(marker), `Marker "${marker}" missing on ${route}`);
    }

    console.log('PASS: feature-membership-suite integration tests passed!');
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
