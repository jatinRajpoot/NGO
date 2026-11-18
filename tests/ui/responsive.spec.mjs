import { test, expect } from '@playwright/test';

const KEY_RESPONSIVE_ROUTES = [
  '/projects/',
  '/verify/',
  '/internships/',
  '/beneficiaries/apply/',
  '/complaints/',
  '/member/register/',
  '/member/dashboard/',
  '/donor/register/',
  '/team/portal/',
  '/donate/',
  '/autopay-donate/',
];

test('key public pages and portals have no horizontal overflow across viewports', async ({ page }) => {
  test.setTimeout(90000);

  for (const route of KEY_RESPONSIVE_ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const audit = await page.evaluate(() => {
      const innerW = window.innerWidth;
      const docScrollW = document.documentElement.scrollWidth;
      const offenders = [];

      for (const el of document.querySelectorAll('body *')) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        let p = el.parentElement;
        let clippedByAncestor = false;
        while (p && p !== document.body && p !== document.documentElement) {
          const ps = window.getComputedStyle(p);
          if (
            ps.overflowX === 'auto' ||
            ps.overflowX === 'scroll' ||
            ps.overflowX === 'hidden' ||
            ps.overflowX === 'clip'
          ) {
            clippedByAncestor = true;
            break;
          }
          p = p.parentElement;
        }

        if (!clippedByAncestor && rect.right > innerW + 2) {
          const tag = el.tagName.toLowerCase();
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          offenders.push(`${tag}${cls ? '.' + cls : ''} (right=${Math.round(rect.right)} > ${innerW})`);
          if (offenders.length >= 5) break;
        }
      }

      return { innerW, docScrollW, offenders };
    });

    expect(
      audit.docScrollW,
      `Route ${route} horizontal scrollWidth (${audit.docScrollW}) must not exceed viewport (${audit.innerW})`
    ).toBeLessThanOrEqual(audit.innerW);
    expect(
      audit.offenders,
      `Route ${route} has elements overflowing viewport (${audit.innerW}px): ${audit.offenders.join(', ')}`
    ).toEqual([]);
  }
});
