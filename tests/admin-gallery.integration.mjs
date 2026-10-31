import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { request as httpRequest } from 'node:http';
import path from 'node:path';

// Run explicitly with node tests/admin-gallery.integration.mjs, with no other
// Next dev/build process using this checkout. Uses ephemeral generated credentials.
const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;

const ADMIN_COOKIE_NAME = 'gsdd_admin_session';
const password = randomBytes(24).toString('hex');
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const sessionSecret = randomBytes(48).toString('hex');
const testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-gallery-test-'));

const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
  {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      GALLERY_BUCKET: '',
      GALLERY_DATA_DIR: testDataDir,
      ADMIN_USERNAME: 'integration-admin',
      ADMIN_PASSWORD_HASH: passwordHash,
      ADMIN_SESSION_SECRET: sessionSecret,
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }
);

let logs = '';
child.stdout.on('data', (chunk) => { logs = (logs + chunk).slice(-12000); });
child.stderr.on('data', (chunk) => { logs = (logs + chunk).slice(-12000); });

let cookie;
let adminCookie;
let uploadedId;

async function request(url, options = {}) {
  // Node fetch replaces Host. Use the native client for reverse-proxy coverage.
  if (options.headers?.Host) {
    return new Promise((resolve, reject) => {
      const outgoing = httpRequest(base + url, {
        method: options.method || 'GET',
        headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
      }, (incoming) => {
        const chunks = [];
        incoming.on('data', (chunk) => chunks.push(chunk));
        incoming.on('error', reject);
        incoming.on('end', () => resolve(new Response(Buffer.concat(chunks), {
          status: incoming.statusCode,
          headers: incoming.headers,
        })));
      });
      outgoing.setTimeout(15000, () => outgoing.destroy(new Error('Proxy request timed out')));
      outgoing.on('error', reject);
      outgoing.end(options.body);
    });
  }
  return fetch(base + url, {
    signal: AbortSignal.timeout(15000),
    redirect: 'manual',
    ...options,
    headers: {
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
}

async function removeUpload() {
  if (uploadedId) {
    const idToDelete = uploadedId;
    uploadedId = undefined;
    try {
      const authCookie = cookie || adminCookie;
      await fetch(base + '/api/admin/gallery/', {
        signal: AbortSignal.timeout(10000),
        method: 'DELETE',
        headers: {
          Origin: base,
          'Content-Type': 'application/json',
          ...(authCookie ? { Cookie: authCookie } : {}),
        },
        body: JSON.stringify({ id: idToDelete }),
      });
    } catch {}
  }
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) {
      throw new Error(`Next exited prematurely with code ${child.exitCode}: ${logs}`);
    }
    try {
      const res = await request('/admin/');
      if (res.status < 500) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, `Server did not become ready: ${logs}`);

  // 1. Unauthenticated page access redirects (307)
  const unauthPageRes = await request('/admin/');
  assert.equal(unauthPageRes.status, 307);

  // 2. Unauthenticated GET /api/admin/gallery/ fails (401)
  const unauthGetRes = await request('/api/admin/gallery/');
  assert.equal(unauthGetRes.status, 401);

  // 3. Unauthenticated POST /api/admin/gallery/ fails (401)
  const dummyForm = new FormData();
  dummyForm.set('date', '2026-10-30');
  dummyForm.set('alt', 'Unauthenticated upload');
  const unauthPostRes = await request('/api/admin/gallery/', {
    method: 'POST',
    body: dummyForm,
  });
  assert.equal(unauthPostRes.status, 401);

  // 4. Unauthenticated DELETE /api/admin/gallery/ fails (401)
  const unauthDeleteRes = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'dummy-photo-id' }),
  });
  assert.equal(unauthDeleteRes.status, 401);

  // 5. Tampered cookie on API endpoint (401)
  const tamperedApiRes1 = await request('/api/admin/gallery/', {
    headers: { Cookie: `${ADMIN_COOKIE_NAME}=malformed-token` },
  });
  assert.equal(tamperedApiRes1.status, 401);

  const tamperedApiRes2 = await request('/api/admin/gallery/', {
    headers: {
      Cookie: `${ADMIN_COOKIE_NAME}=v1.9999999999.0123456789abcdef.AAAAAAAAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB`,
    },
  });
  assert.equal(tamperedApiRes2.status, 401);

  // 6. Tampered cookie on admin page redirects (307)
  const tamperedPageRes = await request('/admin/', {
    headers: { Cookie: `${ADMIN_COOKIE_NAME}=tampered` },
  });
  assert.equal(tamperedPageRes.status, 307);

  // 7. Login with untrusted origin (403)
  let response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 403);

  // 8. Login with wrong password (401) and no session cookie
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'integration-admin', password: 'wrong-password' }),
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null, 'Failed login must not set a session cookie');
  assert.match(response.headers.get('cache-control') || '', /no-store/, 'Login responses must not be cached');

  // 9. Login with unknown username (401)
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'unknown-admin', password }),
  });
  assert.equal(response.status, 401);

  // 9a. Opaque Origin header is rejected (403)
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'null' },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 403);

  // 9b. Credentials outside the documented length bounds are rejected (400)
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'a'.repeat(129), password }),
  });
  assert.equal(response.status, 400);
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'integration-admin', password: 'a'.repeat(1025) }),
  });
  assert.equal(response.status, 400);

  // 10. Login with malformed JSON body (400)
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"username": "integration-admin", malformed',
  });
  assert.equal(response.status, 400);

  // 11. Login with invalid Content-Type (400)
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 400);

  // 12. Successful login (200) with secure cookie attributes
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 200);
  const loginBody = await response.json();
  assert.equal(loginBody.ok, true);
  assert.match(response.headers.get('cache-control') || '', /no-store/, 'Login responses must not be cached');

  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie, 'Expected Set-Cookie header on successful login');
  assert.match(setCookie, new RegExp(ADMIN_COOKIE_NAME, 'i'));
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);

  cookie = setCookie.split(';')[0];
  adminCookie = cookie;

  // Next's bind-address URL differs from the external Host behind Cloud Run.
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Host: 'foundation.example.test',
      Origin: 'https://foundation.example.test',
      'X-Forwarded-Proto': 'https',
    },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 200, 'Preserved external Host must work behind TLS termination');
  assert.match(
    response.headers.get('set-cookie') || '',
    /;\s*Secure/i,
    'HTTPS-terminated requests must receive a Secure session cookie'
  );
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://untrusted.example',
      'X-Forwarded-Host': 'untrusted.example',
      'X-Forwarded-Proto': 'https',
    },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 403, 'Forwarded host must not override the destination Host');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const token = cookie.slice(cookie.indexOf('=') + 1);
  const alias = token.slice(0, -1) + alphabet[alphabet.indexOf(token.at(-1)) ^ 1];
  response = await request('/api/admin/gallery/', {
    headers: { Cookie: `${ADMIN_COOKIE_NAME}=${alias}` },
  });
  assert.equal(response.status, 401, 'Noncanonical signature aliases must be rejected');

  // 13. Authenticated page returns 200 and is not indexable
  response = await request('/admin/');
  assert.equal(response.status, 200);
  assert.match(
    await response.text(),
    /name="robots"[^>]*content="noindex/i,
    'Admin pages must remain out of search indexes'
  );

  // 14. Authenticated GET /api/admin/gallery/ returns 200 and photo list
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/, 'Admin API responses must not be cached');
  const galleryData = await response.json();
  assert.ok(Array.isArray(galleryData.photos));
  const initial = galleryData.photos;

  // Verify structure of existing photos: id, src, alt, date (YYYY-MM-DD)
  for (const item of initial) {
    assert.ok(item.id, 'Photo should have an id');
    assert.ok(item.src, 'Photo should have a src');
    assert.ok(typeof item.alt === 'string', 'Photo should have an alt string');
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
  }

  // The public contract is newest-first, so the list must already be sorted.
  const initialDates = initial.map((item) => item.date);
  assert.deepEqual(
    [...initialDates].sort((a, b) => b.localeCompare(a)),
    initialDates,
    'Gallery photos must be sorted by date descending'
  );

  // 15. Untrusted origin on POST /api/admin/gallery/ (403)
  response = await request('/api/admin/gallery/', {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example' },
    body: dummyForm,
  });
  assert.equal(response.status, 403);

  // 16. Untrusted origin on DELETE /api/admin/gallery/ (403)
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'dummy-id' }),
  });
  assert.equal(response.status, 403);

  const names = await readdir('public/media/gallery');
  const webpName = names.find((name) => name.endsWith('.webp'));
  assert.ok(webpName, 'Expected at least one webp image in public/media/gallery');
  const sampleImage = await readFile(path.join('public/media/gallery', webpName));

  // 17. Missing file (400)
  const noFileForm = new FormData();
  noFileForm.set('date', '2026-10-30');
  noFileForm.set('alt', 'Valid description');
  response = await request('/api/admin/gallery/', { method: 'POST', body: noFileForm });
  assert.equal(response.status, 400);

  // 18. Missing alt (400)
  const noAltForm = new FormData();
  noAltForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  noAltForm.set('date', '2026-10-30');
  response = await request('/api/admin/gallery/', { method: 'POST', body: noAltForm });
  assert.equal(response.status, 400);

  // 19. Empty / whitespace alt (400)
  const blankAltForm = new FormData();
  blankAltForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  blankAltForm.set('date', '2026-10-30');
  blankAltForm.set('alt', '   ');
  response = await request('/api/admin/gallery/', { method: 'POST', body: blankAltForm });
  assert.equal(response.status, 400);

  // 20. Malformed date - non-date string (400)
  const badDateForm1 = new FormData();
  badDateForm1.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  badDateForm1.set('date', 'not-a-date');
  badDateForm1.set('alt', 'Valid description');
  response = await request('/api/admin/gallery/', { method: 'POST', body: badDateForm1 });
  assert.equal(response.status, 400);

  // 21. Malformed date - wrong format (400)
  const badDateForm2 = new FormData();
  badDateForm2.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  badDateForm2.set('date', '2026/10/30');
  badDateForm2.set('alt', 'Valid description');
  response = await request('/api/admin/gallery/', { method: 'POST', body: badDateForm2 });
  assert.equal(response.status, 400);

  const impossibleDateForm = new FormData();
  impossibleDateForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  impossibleDateForm.set('date', '2026-02-30');
  impossibleDateForm.set('alt', 'Invalid calendar date');
  response = await request('/api/admin/gallery/', { method: 'POST', body: impossibleDateForm });
  assert.equal(response.status, 400);

  // 22. Missing date (400)
  const noDateForm = new FormData();
  noDateForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  noDateForm.set('alt', 'Valid description');
  response = await request('/api/admin/gallery/', { method: 'POST', body: noDateForm });
  assert.equal(response.status, 400);

  // 23. Invalid upload spoof: SVG/text content pretending to be webp (400)
  const fakeWebpForm = new FormData();
  fakeWebpForm.set('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><text>fake</text></svg>'], { type: 'image/webp' }), 'fake.webp');
  fakeWebpForm.set('date', '2026-10-30');
  fakeWebpForm.set('alt', 'Fake SVG image');
  response = await request('/api/admin/gallery/', { method: 'POST', body: fakeWebpForm });
  assert.equal(response.status, 400);

  // 24. Invalid upload spoof: random binary pretending to be webp (400)
  const corruptForm = new FormData();
  corruptForm.set('file', new Blob([randomBytes(128)], { type: 'image/webp' }), 'corrupt.webp');
  corruptForm.set('date', '2026-10-30');
  corruptForm.set('alt', 'Corrupted file');
  response = await request('/api/admin/gallery/', { method: 'POST', body: corruptForm });
  assert.equal(response.status, 400);

  // 25. Invalid upload: non-image MIME type / extension (400)
  const scriptForm = new FormData();
  scriptForm.set('file', new Blob(['console.log("bad");'], { type: 'text/javascript' }), 'payload.js');
  scriptForm.set('date', '2026-10-30');
  scriptForm.set('alt', 'Script payload');
  response = await request('/api/admin/gallery/', { method: 'POST', body: scriptForm });
  assert.equal(response.status, 400);

  // 25a. Declared MIME type must match the detected image bytes (400)
  const mismatchedTypeForm = new FormData();
  mismatchedTypeForm.set('file', new Blob([sampleImage], { type: 'image/jpeg' }), 'photo.jpg');
  mismatchedTypeForm.set('date', '2026-10-30');
  mismatchedTypeForm.set('alt', 'Mismatched content type');
  response = await request('/api/admin/gallery/', { method: 'POST', body: mismatchedTypeForm });
  assert.equal(response.status, 400);

  // 25b. File extension must match the detected image bytes (400)
  const mismatchedExtensionForm = new FormData();
  mismatchedExtensionForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.png');
  mismatchedExtensionForm.set('date', '2026-10-30');
  mismatchedExtensionForm.set('alt', 'Mismatched extension');
  response = await request('/api/admin/gallery/', { method: 'POST', body: mismatchedExtensionForm });
  assert.equal(response.status, 400);

  // 25c. Alternative text longer than the 300 character limit (400)
  const longAltForm = new FormData();
  longAltForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'photo.webp');
  longAltForm.set('date', '2026-10-30');
  longAltForm.set('alt', 'a'.repeat(301));
  response = await request('/api/admin/gallery/', { method: 'POST', body: longAltForm });
  assert.equal(response.status, 400);

  // 26. Valid upload (201)
  const validForm = new FormData();
  validForm.set('file', new Blob([sampleImage], { type: 'image/webp' }), 'integration.webp');
  validForm.set('date', '2026-10-30');
  validForm.set('alt', 'Integration check photograph');
  response = await request('/api/admin/gallery/', { method: 'POST', body: validForm });
  assert.equal(response.status, 201);
  const uploadData = await response.json();
  assert.ok(uploadData && uploadData.photo, 'Expected { photo } in 201 response');
  const photo = uploadData.photo;
  assert.ok(photo.id, 'Photo must have an id');
  uploadedId = photo.id;

  assert.equal(photo.alt, 'Integration check photograph');
  assert.equal(photo.date, '2026-10-30');
  assert.match(photo.src, /^\/api\/gallery\/images\/[a-f0-9-]+\.(?:jpe?g|png|webp)$/, 'Image URLs must use the canonical file path');

  // 27. Uploaded image is served correctly
  response = await request(photo.src);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/webp');
  const downloadedBytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(downloadedBytes, sampleImage);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', 'Image responses must disable MIME sniffing');
  assert.match(response.headers.get('cache-control') || '', /no-store/, 'Mutable gallery images must not be cached');

  // 27a. Encoded traversal attempts and unknown image IDs must not resolve (404)
  response = await request('/api/gallery/images/%252e%252e%252fmanifest.json');
  assert.equal(response.status, 404, 'Double-encoded traversal must be rejected');
  response = await request('/api/gallery/images/..%5cmanifest.json');
  assert.equal(response.status, 404, 'Backslash traversal must be rejected');
  response = await request('/api/gallery/images/not-a-real-photo.webp');
  assert.equal(response.status, 404, 'Unknown image IDs must return 404');

  // 28. Public gallery page reflects the new photo
  response = await request('/gallery/');
  assert.equal(response.status, 200);
  const publicPageText = await response.text();
  assert.ok(publicPageText.includes('Integration check photograph'), 'Public gallery should display new photo');

  // 29. Admin gallery list reflects the new photo
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 200);
  const afterUploadList = (await response.json()).photos;
  assert.equal(afterUploadList.length, initial.length + 1);
  assert.ok(afterUploadList.some((p) => p.id === photo.id));
  assert.equal(afterUploadList[0].id, photo.id, 'Newest upload should lead the date-sorted list');
  assert.deepEqual(
    [...afterUploadList.map((p) => p.date)].sort((a, b) => b.localeCompare(a)),
    afterUploadList.map((p) => p.date),
    'Uploaded photos must keep the newest-first ordering'
  );

  // 30. DELETE missing id (400)
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);

  // 31. DELETE malformed JSON body (400)
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: 'invalid-json{',
  });
  assert.equal(response.status, 400);

  // 32. DELETE non-existent id (404 or 400)
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
  });
  assert.ok(
    response.status === 404 || response.status === 400,
    `Expected 404 or 400 for non-existent photo ID, got ${response.status}`
  );

  // 33. Successful deletion of uploaded photo (200)
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: uploadedId }),
  });
  assert.equal(response.status, 200);
  const deleteData = await response.json();
  assert.equal(deleteData.ok, true);
  uploadedId = undefined; // Successfully deleted

  // 34. Admin list length restored
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 200);
  const afterDeleteList = (await response.json()).photos;
  assert.equal(afterDeleteList.length, initial.length);

  // 35. Deleted image endpoint returns 404
  response = await request(photo.src);
  assert.equal(response.status, 404);

  // 35a. Removing a bundled seed original hides it without deleting the file
  const galleryBeforeHideRes = await request('/gallery/');
  assert.equal(galleryBeforeHideRes.status, 200);
  const galleryBeforeHideHtml = await galleryBeforeHideRes.text();
  const original = initial.find(
    (p) => p.src.startsWith('/media/gallery/') && galleryBeforeHideHtml.includes(p.id)
  );
  assert.ok(original, 'Expected at least one bundled seed original visible on public gallery page 1');
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: original.id }),
  });
  assert.equal(response.status, 200, 'Seed originals must be removable through the manifest');
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 200);
  const afterHideList = (await response.json()).photos;
  assert.equal(afterHideList.length, initial.length - 1, 'Hidden seed originals must leave the admin list');
  assert.ok(!afterHideList.some((p) => p.id === original.id));
  response = await request('/gallery/');
  assert.equal(response.status, 200);
  // Next dev embeds server-side filesystem diagnostics in RSC scripts. The
  // hidden-original manifest can legitimately appear there, even though the
  // photo is absent from the rendered gallery. Assert against real markup.
  const afterHideMarkup = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.ok(
    !afterHideMarkup.includes(original.id),
    'Hidden seed originals must not be rendered on the public gallery page'
  );
  response = await request(`/media/gallery/${encodeURIComponent(original.id)}`);
  assert.equal(response.status, 200, 'Hiding a seed original must not delete the bundled file');

  // 36. Logout with untrusted origin (403)
  response = await request('/api/admin/auth/logout/', {
    method: 'POST',
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(response.status, 403);

  // 37. Successful logout (200)
  response = await request('/api/admin/auth/logout/', { method: 'POST' });
  assert.equal(response.status, 200);
  const logoutSetCookie = response.headers.get('set-cookie');
  assert.ok(logoutSetCookie, 'Logout must send Set-Cookie header');
  assert.match(logoutSetCookie, /Max-Age=0/i);

  cookie = undefined;

  // 38. Post-logout API requests are rejected (401)
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 401);

  // 39. Post-logout admin page redirects (307)
  response = await request('/admin/');
  assert.equal(response.status, 307);

  // 40. Repeated failures for one client are rate limited (429) before verification
  const rateLimitClient = '203.0.113.77';
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    response = await request('/api/admin/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': rateLimitClient },
      body: JSON.stringify({ username: 'integration-admin', password: 'wrong-password' }),
    });
    assert.equal(response.status, 401, `Failed attempt ${attempt} should return 401`);
  }
  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': rateLimitClient },
    body: JSON.stringify({ username: 'integration-admin', password: 'wrong-password' }),
  });
  assert.equal(response.status, 429, 'The 11th failed attempt from one client must be rate limited');
  assert.match(response.headers.get('retry-after') || '', /^\d+$/, 'Rate limit responses must include Retry-After');
  assert.equal((await response.json()).error, 'too_many_attempts');

  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': rateLimitClient },
    body: JSON.stringify({ username: 'integration-admin', password }),
  });
  assert.equal(response.status, 429, 'Rate limiting must be enforced before credential verification');

  console.log('PASS: admin auth, CSRF protection, cookie validation, rate limiting, upload validation & spoof rejection, gallery serving, seed-original hiding, deletion, and logout.');
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  try {
    await removeUpload();
  } catch (cleanupErr) {
    console.error('Error cleaning up uploaded test photo:', cleanupErr);
  } finally {
    if (process.platform === 'win32' && child.pid && child.exitCode === null) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else {
      child.kill();
    }
    if (testDataDir) {
      try {
        assert.equal(path.dirname(path.resolve(testDataDir)), path.resolve(tmpdir()));
        assert.ok(path.basename(testDataDir).startsWith('gsdd-gallery-test-'));
        await rm(testDataDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
