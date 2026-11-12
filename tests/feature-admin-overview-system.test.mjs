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
    if (proc.exitCode !== null) {
      throw new Error(`Next server exited prematurely with code ${proc.exitCode}`);
    }
    try {
      const res = await fetch(`${base}/api/admin/overview/`);
      if (res.status === 401 || res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-admin-sys-test-'));

  const password = randomBytes(18).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  const sessionSecret = randomBytes(48).toString('hex');
  const panelPassword = randomBytes(12).toString('hex');

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
        ADMIN_SYSTEM_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'sys-test-admin',
        ADMIN_PASSWORD_HASH: passwordHash,
        ADMIN_SESSION_SECRET: sessionSecret,
        PANEL_PASSWORD: panelPassword,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );

  let serverLogs = '';
  child.stdout.on('data', (d) => { serverLogs = (serverLogs + d).slice(-8000); });
  child.stderr.on('data', (d) => { serverLogs = (serverLogs + d).slice(-8000); });

  const jar = new Map();
  const absorbCookies = (res) => {
    const list =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [res.headers.get('set-cookie')].filter(Boolean);
    for (const raw of list) {
      const first = raw.split(';')[0];
      const eq = first.indexOf('=');
      if (eq > 0) {
        const name = first.slice(0, eq).trim();
        const val = first.slice(eq + 1).trim();
        if (!val || /Max-Age=0/i.test(raw)) jar.delete(name);
        else jar.set(name, val);
      }
    }
  };

  const api = async (url, { method = 'GET', headers = {}, body } = {}) => {
    const cookieHeader = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(`${base}${url}`, {
      method,
      headers: {
        Origin: base,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...headers,
      },
      body,
    });
    absorbCookies(res);
    return res;
  };

  try {
    await waitForServer(base, child);

    // 1. Auth boundaries
    assert.equal((await fetch(`${base}/api/admin/overview/`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/birthdays/`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/letterheads/`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/software/unlock/`)).status, 401);
    assert.equal((await fetch(`${base}/admin/software/software-data/`)).status, 403);

    // 2. Admin login
    const loginRes = await api('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sys-test-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Login failed:\n${serverLogs}`);
    assert.ok(jar.has('gsdd_admin_session'));

    // 3. Direct software routes remain 403 even after admin login until Panel Password unlocked
    assert.equal((await api('/admin/software/software-data/')).status, 403);
    assert.equal((await api('/api/admin/software/software-data/')).status, 403);

    // 4. Wrong panel password -> 403; valid panel password -> 200 + cookie
    const badPanelRes = await api('/api/admin/software/unlock/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelPassword: 'wrong-panel-password' }),
    });
    assert.equal(badPanelRes.status, 403);

    const goodPanelRes = await api('/api/admin/software/unlock/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panelPassword }),
    });
    assert.equal(goodPanelRes.status, 200);
    assert.ok(jar.has('gsdd_panel_unlock'));

    // 5. Unlocked dedicated route & API work + updates persist across all 8 sections
    const unlockedPageRes = await api('/admin/software/software-data/');
    assert.equal(unlockedPageRes.status, 200);
    const unlockedHtml = await unlockedPageRes.text();
    assert.ok(unlockedHtml.includes('Software Update'));

    for (const [sec, patch, verifyKey, verifyVal] of [
      ['software-data', { tagline: 'Updated Community Tagline 2026' }, 'tagline', 'Updated Community Tagline 2026'],
      ['payment-api', { activeGateway: 'razorpay' }, 'activeGateway', 'razorpay'],
      ['email-data', { smtpPort: '465' }, 'smtpPort', '465'],
      ['appointment-data', { validityMonths: '24' }, 'validityMonths', '24'],
      ['access-settings', { maintenanceMode: true }, 'maintenanceMode', true],
      ['license-data', { plan: 'Enterprise Verified' }, 'plan', 'Enterprise Verified'],
      ['recaptcha-data', { enabled: true, version: 'v3' }, 'enabled', true],
    ]) {
      const pRes = await api(`/api/admin/software/${sec}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      assert.equal(pRes.status, 200, `PATCH ${sec} failed`);
      const pData = await pRes.json();
      assert.equal(pData.data[verifyKey], verifyVal);
    }

    // 6. Reset Website Data confirmation guard + success
    const badReset = await api('/api/admin/software/reset-website/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationText: 'wrong', targets: ['letterheads'] }),
    });
    assert.equal(badReset.status, 400);

    const okReset = await api('/api/admin/software/reset-website/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationText: 'RESET GSDD DATA', targets: ['settings'] }),
    });
    assert.equal(okReset.status, 200);

    // 7. Lock Panel again -> returns 403 immediately
    assert.equal((await api('/api/admin/software/unlock/', { method: 'DELETE' })).status, 200);
    assert.equal((await api('/admin/software/software-data/')).status, 403);
    assert.equal((await api('/api/admin/software/software-data/')).status, 403);

    // 8. Overview KPIs, Jun-Nov chart, Quick Stats & Live Feeds
    const ovRes = await api('/api/admin/overview/');
    assert.equal(ovRes.status, 200);
    const { overview } = await ovRes.json();
    for (const kpiKey of [
      'totalMembers', 'totalDonations', 'activeCampaigns', 'upcomingEvents',
      'beneficiaries', 'activeInterns', 'totalMembershipFee',
      'totalMemberDonation', 'totalVisitorDonation', 'totalCrowdfundingDonation',
    ]) {
      assert.ok(overview.kpis[kpiKey], `Missing KPI ${kpiKey}`);
    }
    assert.equal(overview.monthlyDonations.length, 6);
    assert.equal(overview.monthlyDonations[0].month, 'Jun');
    assert.equal(overview.monthlyDonations[5].month, 'Nov');
    assert.ok(overview.recentMembers.length > 0);
    assert.ok(overview.recentActivity.length > 0);

    // 9. Birthday Wishes
    const bdayToday = await (await api('/api/admin/birthdays/?tab=today')).json();
    assert.ok(bdayToday.birthdays.length >= 1);
    const targetBday = bdayToday.birthdays[0];
    const wishRes = await api('/api/admin/birthdays/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetBday.id, message: 'Happy Birthday from GSDD!' }),
    });
    assert.equal(wishRes.status, 200);
    const wishData = await wishRes.json();
    assert.equal(wishData.record.lastWishMessage, 'Happy Birthday from GSDD!');

    // 10. Letter Head CRUD
    const lhCreate = await api('/api/admin/letterheads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientName: 'Block Development Officer, Raniganj',
        date: '2026-04-02',
        email: 'bdo@example.in',
        subject: 'Digital Literacy Camp Venue Permission',
        address: 'Block Office, Raniganj',
        description: 'Requesting hall allocation for youth computer awareness session.',
      }),
    });
    assert.equal(lhCreate.status, 201);
    const { letterhead } = await lhCreate.json();

    const lhPatch = await api('/api/admin/letterheads/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: letterhead.id, subject: 'Updated Venue Permission Letter' }),
    });
    assert.equal(lhPatch.status, 200);
    assert.equal((await lhPatch.json()).letterhead.subject, 'Updated Venue Permission Letter');

    const lhDel = await api('/api/admin/letterheads/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [letterhead.id] }),
    });
    assert.equal(lhDel.status, 200);

    // 11. Extended Admin Profile & Photo upload / reject / serve / remove
    const profPatch = await api('/api/admin/auth/profile/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Rajkumar Maurya' }),
    });
    assert.equal(profPatch.status, 200);
    assert.equal((await profPatch.json()).profile.name, 'Rajkumar Maurya');

    const badPhotoForm = new FormData();
    badPhotoForm.append('photo', new File([Buffer.from('not an image file')], 'bad.png', { type: 'image/png' }));
    assert.equal((await api('/api/admin/profile/photo/', { method: 'POST', body: badPhotoForm })).status, 400);

    const goodPhotoForm = new FormData();
    goodPhotoForm.append('photo', new File([VALID_PNG], 'avatar.png', { type: 'image/png' }));
    const photoUpRes = await api('/api/admin/profile/photo/', { method: 'POST', body: goodPhotoForm });
    assert.equal(photoUpRes.status, 200);
    const { profile: profWithPhoto } = await photoUpRes.json();
    assert.ok(profWithPhoto.photoSrc.includes('/api/admin/profile/photo/'));

    const photoGetRes = await api(profWithPhoto.photoSrc);
    assert.equal(photoGetRes.status, 200);
    assert.equal(photoGetRes.headers.get('content-type'), 'image/png');

    assert.equal((await api('/api/admin/profile/photo/', { method: 'DELETE' })).status, 200);

    console.log('PASS: feature-admin-overview-system integration tests passed!');
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
