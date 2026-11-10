import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Valid minimal 1x1 transparent PNG (67 bytes)
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
      const res = await fetch(`${base}/api/posts/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Timed out waiting for Next server to start.');
}

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-posts-news-test-'));

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
        POSTS_DATA_DIR: testDataDir,
        PORTAL_DATA_DIR: testDataDir,
        ADMIN_DATA_DIR: testDataDir,
        ADMIN_USERNAME: 'posts-test-admin',
        ADMIN_PASSWORD_HASH: passwordHash,
        ADMIN_SESSION_SECRET: sessionSecret,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );

  let serverLogs = '';
  child.stdout.on('data', (d) => { serverLogs = (serverLogs + d).slice(-8000); });
  child.stderr.on('data', (d) => { serverLogs = (serverLogs + d).slice(-8000); });

  let adminCookie = '';

  const api = async (url, { method = 'GET', headers = {}, body, useAdmin = false } = {}) => {
    const reqHeaders = { Origin: base, ...headers };
    if (useAdmin && adminCookie) {
      reqHeaders.Cookie = adminCookie;
    }
    return fetch(`${base}${url}`, { method, headers: reqHeaders, body });
  };

  try {
    await waitForServer(base, child);

    // 1. Auth boundaries
    assert.equal((await api('/api/admin/posts/')).status, 401);
    assert.equal((await api('/api/admin/news/')).status, 401);
    assert.equal(
      (await api('/api/admin/posts/bulk-delete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ['post-1'] }),
      })).status,
      401
    );

    // 2. Admin login
    const loginRes = await api('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'posts-test-admin', password }),
    });
    assert.equal(loginRes.status, 200, `Expected admin login 200. Logs:\n${serverLogs}`);
    const setCookies =
      typeof loginRes.headers.getSetCookie === 'function'
        ? loginRes.headers.getSetCookie()
        : [loginRes.headers.get('set-cookie')].filter(Boolean);
    adminCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    assert.ok(adminCookie.includes('gsdd_admin_session='), 'Admin cookie should be set');

    // 3. Cross-origin mutation rejected even with admin cookie
    const evilOriginRes = await api('/api/admin/posts/', {
      method: 'POST',
      useAdmin: true,
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'activity', title: 'Bad origin', descriptionHtml: '<p>Test</p>' }),
    });
    assert.equal(evilOriginRes.status, 403);

    // 4. Reject > 5 images & fake content & > 2MB image
    const overLimitForm = new FormData();
    overLimitForm.append('type', 'activity');
    overLimitForm.append('title', 'Too many images');
    overLimitForm.append('descriptionHtml', '<p>Testing 6 images</p>');
    for (let i = 0; i < 6; i++) {
      overLimitForm.append('images', new File([VALID_PNG], `p${i}.png`, { type: 'image/png' }));
    }
    const overLimitRes = await api('/api/admin/posts/', {
      method: 'POST',
      useAdmin: true,
      body: overLimitForm,
    });
    assert.equal(overLimitRes.status, 400);

    const fakeImgForm = new FormData();
    fakeImgForm.append('type', 'press');
    fakeImgForm.append('title', 'Fake image');
    fakeImgForm.append('descriptionHtml', '<p>Testing fake bytes</p>');
    fakeImgForm.append('images', new File([Buffer.from('not a real png file bytes')], 'fake.png', { type: 'image/png' }));
    assert.equal((await api('/api/admin/posts/', { method: 'POST', useAdmin: true, body: fakeImgForm })).status, 400);

    const bigBuffer = Buffer.concat([VALID_PNG, Buffer.alloc(2 * 1024 * 1024 + 64)]);
    const tooBigForm = new FormData();
    tooBigForm.append('type', 'activity');
    tooBigForm.append('title', 'Oversize');
    tooBigForm.append('descriptionHtml', '<p>Testing > 2MB</p>');
    tooBigForm.append('images', new File([bigBuffer], 'huge.png', { type: 'image/png' }));
    assert.equal((await api('/api/admin/posts/', { method: 'POST', useAdmin: true, body: tooBigForm })).status, 400);

    // 5. Create Activity Post with 2 PNGs + XSS payload sanitization check
    const createForm = new FormData();
    createForm.append('type', 'activity');
    createForm.append('title', 'Araria Youth Digital Camp 2026');
    createForm.append(
      'descriptionHtml',
      '<script>alert(1)</script><p><strong>Hands-on training</strong> completed cleanly. <a href="javascript:alert(2)">Bad</a> <a href="https://gsddfoundation.org/">Good</a></p>'
    );
    createForm.append('images', new File([VALID_PNG], 'camp1.png', { type: 'image/png' }));
    createForm.append('images', new File([VALID_PNG], 'camp2.png', { type: 'image/png' }));

    const createdRes = await api('/api/admin/posts/', { method: 'POST', useAdmin: true, body: createForm });
    assert.equal(createdRes.status, 201);
    const createdData = await createdRes.json();
    assert.equal(createdData.ok, true);
    const createdPost = createdData.post;
    assert.equal(createdPost.images.length, 2);
    assert.ok(!createdPost.descriptionHtml.includes('<script'), 'Script tags must be stripped');
    assert.ok(!createdPost.descriptionHtml.includes('javascript:'), 'javascript: URLs must be stripped');
    assert.ok(createdPost.descriptionHtml.includes('<strong>Hands-on training</strong>'));

    // 6. Serve uploaded image with strict security headers & no-store
    const imgUrl = `${createdPost.images[0].src}/`;
    const imgRes = await api(imgUrl);
    assert.equal(imgRes.status, 200);
    assert.equal(imgRes.headers.get('content-type'), 'image/png');
    const imgCsp = imgRes.headers.get('content-security-policy') || '';
    assert.ok(
      imgCsp.includes('sandbox') || imgCsp.includes("object-src 'none'"),
      `Expected restrictive CSP header on image response, got: ${imgCsp}`
    );
    assert.equal(imgRes.headers.get('x-content-type-options'), 'nosniff');
    assert.match(imgRes.headers.get('cache-control') || '', /no-store/);

    // 7. Admin gallery endpoint & public posts filter endpoint
    const imgsListRes = await api(`/api/admin/posts/${createdPost.id}/images/`, { useAdmin: true });
    assert.equal(imgsListRes.status, 200);
    const imgsListData = await imgsListRes.json();
    assert.equal(imgsListData.images.length, 2);

    const publicActivityRes = await api('/api/posts/?filter=activity');
    assert.equal(publicActivityRes.status, 200);
    const publicActivityData = await publicActivityRes.json();
    assert.ok(publicActivityData.posts.some((p) => p.id === createdPost.id));

    // 8. Edit post: delete first image and update title
    const patchForm = new FormData();
    patchForm.append('type', 'press');
    patchForm.append('title', 'Araria Youth Digital Camp Press Note');
    patchForm.append('descriptionHtml', '<p>Updated press release body.</p>');
    patchForm.append('deletedImageIds', JSON.stringify([createdPost.images[0].id]));

    const patchRes = await api(`/api/admin/posts/${createdPost.id}/`, {
      method: 'PATCH',
      useAdmin: true,
      body: patchForm,
    });
    assert.equal(patchRes.status, 200);
    const patchedData = await patchRes.json();
    assert.equal(patchedData.post.type, 'press');
    assert.equal(patchedData.post.images.length, 1);

    // 9. Public pages render with updated content & press filter
    for (const [route, marker] of [
      ['/activity-post/', 'Activity posts and outreach.'],
      ['/press-release/', 'Araria Youth Digital Camp Press Note'],
      ['/achievements/', 'Achievements and recognition.'],
    ]) {
      const pageRes = await api(route);
      assert.equal(pageRes.status, 200, `Route ${route} failed`);
      const html = await pageRes.text();
      assert.ok(html.includes(marker), `Expected "${marker}" on ${route}`);
    }

    // 10. Bulk delete created post
    const bulkRes = await api('/api/admin/posts/bulk-delete/', {
      method: 'POST',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [createdPost.id] }),
    });
    assert.equal(bulkRes.status, 200);
    const bulkData = await bulkRes.json();
    assert.equal(bulkData.deletedCount, 1);

    // 11. News Management flow (draft hidden publicly, active visible on /news/ and /api/news/)
    const draftNewsForm = new FormData();
    draftNewsForm.append('title', 'Internal Draft Circular');
    draftNewsForm.append('description', 'Should stay hidden from public feed while draft.');
    draftNewsForm.append('status', 'draft');
    const draftNewsRes = await api('/api/admin/news/', { method: 'POST', useAdmin: true, body: draftNewsForm });
    assert.equal(draftNewsRes.status, 201);
    const { news: draftItem } = await draftNewsRes.json();

    let pubNewsData = await (await api('/api/news/')).json();
    assert.ok(!pubNewsData.news.some((n) => n.id === draftItem.id), 'Draft news must not leak to public /api/news/');

    // Publish draft -> active
    const publishRes = await api('/api/admin/news/', {
      method: 'PATCH',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draftItem.id, status: 'active' }),
    });
    assert.equal(publishRes.status, 200);

    pubNewsData = await (await api('/api/news/')).json();
    assert.ok(pubNewsData.news.some((n) => n.id === draftItem.id), 'Published news must appear in public /api/news/');

    const newsPageRes = await api('/news/');
    assert.equal(newsPageRes.status, 200);
    const newsHtml = await newsPageRes.text();
    assert.ok(newsHtml.includes('Stories from the foundation.'));
    assert.ok(newsHtml.includes('Internal Draft Circular'));

    // Cleanup created news item
    const delNewsRes = await api('/api/admin/news/', {
      method: 'DELETE',
      useAdmin: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [draftItem.id] }),
    });
    assert.equal(delNewsRes.status, 200);

    console.log('PASS: feature-posts-news integration tests passed!');
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
