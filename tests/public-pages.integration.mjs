import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Production smoke test for the public site and the unauthenticated edges of
// the admin surface.
//
// Two modes:
//   1. Target an already-running production server:
//        BASE_URL=https://example.test node tests/public-pages.integration.mjs
//   2. Build output already exists in .next and the script launches:
//        node tests/public-pages.integration.mjs
//
// Mode 2 runs `next start` with NODE_ENV=production, an empty GALLERY_BUCKET
// (so the seed-original read path is exercised without touching GCS), and a
// temporary GALLERY_DATA_DIR. It never writes to .data or .next.
//
// Run explicitly; do not run it while another Next build/dev process is using
// this checkout. No admin credentials are required and no state is mutated.

const repoRoot = process.cwd();
const externalBase = (process.env.BASE_URL || '').trim();

const ROUTES = [
  ['/', 'Empowering people.'],
  ['/about/', 'Opportunity grows when communities'],
  ['/core-areas/', 'Five connected priorities. One shared purpose.'],
  ['/work-sectors/', 'Driving inclusive growth through community-centred development.'],
  ['/projects/', 'Ideas for community-centred work.'],
  ['/projects/digital-literacy-and-cyber-awareness/', 'Illustrative programme concept'],
  ['/activities/', 'A window into our community.'],
  ['/gallery/', 'A window into our community.'],
  ['/events/', 'Meet, learn and take part.'],
  ['/campaigns/', 'Support a clearly described cause.'],
  ['/news/', 'Stories from the foundation.'],
  ['/team/', 'Management team'],
  ['/transparency/', 'Integrity, accountability and clear records.'],
  ['/verify/', 'Check a document code.'],
  ['/get-involved/', 'Be part of the work that opens new pathways.'],
  ['/membership/', 'Interested in becoming a member?'],
  ['/internships/', 'Learn through community-centred work.'],
  ['/donate/', 'A contribution can help open a door to opportunity.'],
  ['/contact/', 'Tell us what you would like to make possible.'],
  ['/complaints/', 'Help us hear what needs attention.'],
  ['/terms/', 'Use of this website'],
  ['/privacy-policy/', 'Information and contact'],
  ['/refund-policy/', 'Refunds and cancellations'],
];

const UNEXPECTED_ERROR_MARKERS = /__next_error__|Application error: a server-side exception|Internal Server Error/i;
const SERVER_ERROR_MARKERS = /Application error: a server-side exception|Internal Server Error/i;

let server = null;
let serverLogs = '';
let testDataDir = null;
let base;
let origin;

function allocatePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      listener.close((closeError) => {
        if (closeError) reject(closeError);
        else resolve(address.port);
      });
    });
  });
}

async function request(pathname, options = {}) {
  return fetch(base + pathname, {
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
    ...options,
    headers: {
      Origin: origin,
      ...(options.headers || {}),
    },
  });
}

async function waitForServer() {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (server && server.exitCode !== null) {
      throw new Error(`Next exited prematurely with code ${server.exitCode}: ${serverLogs}`);
    }
    try {
      const response = await request('/');
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready: ${serverLogs}`);
}

function stopServer() {
  if (!server) return;
  if (process.platform === 'win32' && server.pid && server.exitCode === null) {
    spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  } else {
    server.kill();
  }
}

async function cleanup() {
  stopServer();
  if (!testDataDir) return;
  try {
    assert.equal(path.dirname(path.resolve(testDataDir)), path.resolve(tmpdir()));
    assert.ok(path.basename(testDataDir).startsWith('gsdd-public-test-'));
    await rm(testDataDir, { recursive: true, force: true });
  } catch {}
}

try {
  if (externalBase) {
    const target = new URL(externalBase);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      throw new Error('BASE_URL must use http or https');
    }
    if (target.pathname !== '/' || target.search || target.hash) {
      throw new Error('BASE_URL must be an origin such as https://example.test');
    }
    base = target.origin;
    origin = target.origin;
  } else {
    if (!existsSync(path.join(repoRoot, '.next', 'BUILD_ID'))) {
      throw new Error('No production build found. Run `npm run build` first or set BASE_URL.');
    }

    const port = await allocatePort();
    base = `http://127.0.0.1:${port}`;
    origin = base;
    testDataDir = await mkdtemp(path.join(tmpdir(), 'gsdd-public-test-'));

    server = spawn(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          GALLERY_BUCKET: '',
          GALLERY_DATA_DIR: testDataDir,
          NEXT_TELEMETRY_DISABLED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    );
    server.stdout.on('data', (chunk) => { serverLogs = (serverLogs + chunk).slice(-12000); });
    server.stderr.on('data', (chunk) => { serverLogs = (serverLogs + chunk).slice(-12000); });
  }

  await waitForServer();

  // 1. Public routes render real HTML and page-specific content.
  for (const [route, marker] of ROUTES) {
    const response = await request(route);
    assert.equal(response.status, 200, `${route} should return 200, got ${response.status}`);
    assert.match(response.headers.get('content-type') || '', /^text\/html/i, `${route} should return HTML`);
    const html = await response.text();
    assert.ok(html.includes(marker), `${route} should contain "${marker}"`);
    assert.ok(!UNEXPECTED_ERROR_MARKERS.test(html), `${route} should not render an error page`);
    assert.match(html, /GSDD\s*FOUNDATION|GSDD\s*<span>\s*FOUNDATION/i, `${route} should keep the site identity`);
  }

  // 2. Truthful statutory details remain visible on the transparency page.
  const transparencyResponse = await request('/transparency/');
  const transparencyHtml = await transparencyResponse.text();
  assert.ok(transparencyHtml.includes('U88900BR2026NPL086114'), 'CIN should be published');
  assert.ok(transparencyHtml.includes('BR/2026/1140209'), 'NGO Darpan ID should be published');

  // 3. The gallery lists the bundled seed originals and serves them.
  const seedNames = (await readdir(path.join(repoRoot, 'public', 'media', 'gallery')))
    .filter((name) => /\.webp$/i.test(name))
    .sort();
  assert.ok(seedNames.length > 0, 'Expected bundled seed gallery images');
  const seedNameSet = new Set(seedNames);

  // 3a. Public gallery page 1 renders visible bundled seed photographs descending by date
  const galleryResponse = await request('/gallery/');
  assert.equal(galleryResponse.status, 200, '/gallery/ should return 200');
  assert.match(galleryResponse.headers.get('content-type') || '', /^text\/html/i);
  const galleryHtml = await galleryResponse.text();
  assert.ok(!UNEXPECTED_ERROR_MARKERS.test(galleryHtml), 'Gallery page 1 should not render an error page');
  assert.ok(!galleryHtml.includes('Gallery temporarily unavailable'), 'Gallery storage should be readable');

  // Extract visible rendered seed photograph filenames from the HTML (direct path or next/image encoded)
  const renderedSeedMatches = [
    ...galleryHtml.matchAll(/(?:\/media\/gallery\/|%2Fmedia%2Fgallery%2F)(IMG-[A-Za-z0-9_-]+\.webp)/gi),
  ];
  const renderedSeedNames = [...new Set(renderedSeedMatches.map((m) => m[1]))];
  assert.ok(
    renderedSeedNames.length > 0,
    'Public gallery page 1 should render visible bundled photographs'
  );
  for (const renderedName of renderedSeedNames) {
    assert.ok(
      seedNameSet.has(renderedName),
      `Rendered photograph ${renderedName} must be a known bundled seed image`
    );
  }

  // The actually visible seed photograph is directly reachable and served as WebP
  const firstRenderedSeed = renderedSeedNames[0];
  const renderedImageResponse = await request(`/media/gallery/${encodeURIComponent(firstRenderedSeed)}`);
  assert.equal(renderedImageResponse.status, 200, 'Visible seed gallery image should be served');
  assert.match(renderedImageResponse.headers.get('content-type') || '', /^image\/webp/i);

  // Seed image served directly from disk via static media path
  const seedImageResponse = await request(`/media/gallery/${encodeURIComponent(seedNames[0])}`);
  assert.equal(seedImageResponse.status, 200, 'Seed gallery images should be served');
  assert.match(seedImageResponse.headers.get('content-type') || '', /^image\/webp/i);

  // 3b. Pagination: page 2 renders valid HTML with distinct photographs when collection spans > 1 page
  const page2Response = await request('/gallery/?page=2');
  assert.equal(page2Response.status, 200, 'Gallery page 2 should return 200');
  assert.match(page2Response.headers.get('content-type') || '', /^text\/html/i);
  const page2Html = await page2Response.text();
  assert.ok(!UNEXPECTED_ERROR_MARKERS.test(page2Html), 'Gallery page 2 should not render an error page');
  assert.ok(!page2Html.includes('Gallery temporarily unavailable'), 'Gallery storage should be readable on page 2');

  const page2SeedMatches = [
    ...page2Html.matchAll(/(?:\/media\/gallery\/|%2Fmedia%2Fgallery%2F)(IMG-[A-Za-z0-9_-]+\.webp)/gi),
  ];
  const page2RenderedSeedNames = [...new Set(page2SeedMatches.map((m) => m[1]))];
  if (seedNames.length > 24) {
    assert.ok(page2RenderedSeedNames.length > 0, 'Gallery page 2 should render photographs');
    assert.notDeepEqual(
      page2RenderedSeedNames,
      renderedSeedNames,
      'Page 2 photographs should differ from page 1'
    );
  }

  // 3c. Invalid page parameters fall back gracefully without server error
  for (const invalidPageQuery of ['?page=invalid', '?page=-1', '?page=0', '?page=99999']) {
    const invalidRes = await request(`/gallery/${invalidPageQuery}`);
    assert.equal(invalidRes.status, 200, `/gallery/${invalidPageQuery} should return 200`);
    assert.match(invalidRes.headers.get('content-type') || '', /^text\/html/i);
    const invalidHtml = await invalidRes.text();
    assert.ok(!UNEXPECTED_ERROR_MARKERS.test(invalidHtml), `/gallery/${invalidPageQuery} should not error`);
    assert.ok(!invalidHtml.includes('Gallery temporarily unavailable'));
  }

  // 4. Non-slash URLs redirect to the canonical trailing-slash form.
  for (const route of ['/about', '/gallery', '/projects']) {
    const response = await request(route);
    assert.equal(response.status, 308, `${route} should redirect to its trailing-slash form`);
    assert.equal(new URL(response.headers.get('location'), base).pathname, `${route}/`);
  }

  // 5. Unknown routes and unpublished detail routes return the public 404 page.
  for (const route of [
    '/this-page-does-not-exist/',
    '/projects/not-a-real-project/',
    '/campaigns/not-published/',
    '/news/not-published/',
    '/events/not-published/',
  ]) {
    const response = await request(route);
    assert.equal(response.status, 404, `${route} should return 404, got ${response.status}`);
    assert.match(response.headers.get('content-type') || '', /^text\/html/i);
    const html = await response.text();
    // Validate public 404 fallback: check both title and rendered body text
    assert.match(html, /<title>[^<]*Page not found[^<]*<\/title>/i, `${route} should have not-found title`);
    assert.ok(
      html.includes('Page not found') || html.includes('This page isn'),
      `${route} should render the public not-found body`
    );
    // Real server exceptions must not be leaked. Note: Next 15 wraps valid dynamic notFound in <html id="__next_error__">
    assert.ok(!SERVER_ERROR_MARKERS.test(html), `${route} should not leak a server error`);
  }

  // 6. Admin pages are protected, non-indexable, and never render the dashboard.
  let response = await request('/admin/');
  assert.equal(response.status, 307, 'Unauthenticated admin page should redirect');
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/admin/login/');

  response = await request('/admin/login/');
  assert.equal(response.status, 200);
  const loginHtml = await response.text();
  assert.ok(loginHtml.includes('Admin Sign In'), 'Login page should render its form');
  assert.match(loginHtml, /name="robots"[^>]*content="noindex/i, 'Admin pages must not be indexed');
  assert.ok(!loginHtml.includes('Photo Gallery Management'), 'Login page must not render the dashboard');

  // 7. Unauthenticated admin APIs fail closed with JSON, not HTML.
  response = await request('/api/admin/gallery/');
  assert.equal(response.status, 401, 'Unauthenticated gallery API should return 401');
  assert.match(response.headers.get('content-type') || '', /application\/json/i);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  assert.deepEqual(await response.json(), { ok: false, error: 'unauthorized' });

  response = await request('/api/admin/auth/login/');
  assert.equal(response.status, 405, 'GET is not allowed on the login endpoint');

  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' },
    body: JSON.stringify({ username: 'smoke', password: 'smoke' }),
  });
  assert.equal(response.status, 403, 'Cross-origin login attempts must be rejected');
  assert.equal((await response.json()).error, 'forbidden_origin');

  response = await request('/api/admin/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.10' },
    body: JSON.stringify({ username: 'smoke', password: 'smoke' }),
  });
  assert.ok([401, 503].includes(response.status), 'Unknown credentials must never authenticate');
  assert.equal(response.headers.get('set-cookie'), null, 'Rejected logins must not set a cookie');
  assert.equal((await response.json()).ok, false);

  response = await request('/api/admin/gallery/', { method: 'POST' });
  assert.equal(response.status, 401, 'Unauthenticated uploads must be rejected');
  response = await request('/api/admin/gallery/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'not-a-real-photo' }),
  });
  assert.equal(response.status, 401, 'Unauthenticated deletions must be rejected');

  // 8. The image endpoint rejects traversal and unknown IDs.
  for (const pathname of [
    '/api/gallery/images/%252e%252e%252fmanifest.json',
    '/api/gallery/images/..%5cmanifest.json',
    '/api/gallery/images/not-a-real-photo.webp',
  ]) {
    response = await request(pathname);
    assert.equal(response.status, 404, `${pathname} should return 404`);
  }

  // 9. Security headers are enforced on public responses.
  const rootResponse = await request('/');
  assert.equal(rootResponse.headers.get('x-content-type-options'), 'nosniff', 'nosniff header must be present');
  assert.equal(rootResponse.headers.get('x-frame-options'), 'DENY', 'X-Frame-Options must be DENY');
  assert.equal(rootResponse.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', 'Strict referrer policy required');
  assert.match(rootResponse.headers.get('content-security-policy') || '', /frame-ancestors 'none'/, 'CSP frame-ancestors required');
  assert.match(rootResponse.headers.get('permissions-policy') || '', /camera=\(\)/, 'Permissions-Policy required');
  assert.equal(rootResponse.headers.get('cross-origin-opener-policy'), 'same-origin', 'COOP same-origin required');
  assert.equal(rootResponse.headers.get('x-permitted-cross-domain-policies'), 'none', 'Permitted cross-domain policies must be none');
  assert.equal(rootResponse.headers.get('x-powered-by'), null, 'X-Powered-By must be suppressed');

  // 10. robots.txt is published and disallows private areas while declaring sitemap.
  const robotsResponse = await request('/robots.txt');
  assert.equal(robotsResponse.status, 200, 'robots.txt should return 200');
  assert.match(robotsResponse.headers.get('content-type') || '', /^text\/plain/i);
  const robotsText = await robotsResponse.text();
  assert.match(robotsText, /User-[Aa]gent:\s*\*/i, 'robots.txt should address all user agents');
  assert.match(robotsText, /Disallow:\s*\/admin\//i, 'robots.txt must disallow /admin/');
  assert.match(robotsText, /Disallow:\s*\/api\//i, 'robots.txt must disallow /api/');
  assert.match(robotsText, /Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i, 'robots.txt should declare the sitemap');

  // 11. sitemap.xml is published and lists public canonical URLs.
  const sitemapResponse = await request('/sitemap.xml');
  assert.equal(sitemapResponse.status, 200, 'sitemap.xml should return 200');
  assert.match(sitemapResponse.headers.get('content-type') || '', /xml/i);
  const sitemapText = await sitemapResponse.text();
  assert.match(sitemapText, /<urlset/i, 'sitemap.xml should contain urlset');
  assert.ok(sitemapText.includes('https://gsddfoundation.org/'), 'sitemap.xml should include homepage');
  assert.ok(sitemapText.includes('https://gsddfoundation.org/gallery/'), 'sitemap.xml should include gallery');
  assert.ok(!sitemapText.includes('/admin/'), 'sitemap.xml must not include admin routes');
  assert.ok(!sitemapText.includes('/api/'), 'sitemap.xml must not include api routes');

  console.log(`PASS: ${ROUTES.length} public routes, gallery assets & pagination, canonical redirects, 404s, security headers, robots, sitemap, and unauthenticated admin boundaries.`);
} catch (error) {
  if (serverLogs) console.error(serverLogs);
  throw error;
} finally {
  await cleanup();
}
