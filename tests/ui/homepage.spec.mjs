import { test, expect } from '@playwright/test';

// Gallery next/image fill elements must stay inside their cards. Without a
// positioned image frame they escape to the page and cover the hero and links.
test('gallery images stay in their cards without covering the hero', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.home-gallery-card');
  await expect(cards).toHaveCount(6);

  for (const card of await cards.all()) {
    const geometry = await card.evaluate((element) => {
      const image = element.querySelector('img');
      const frame = image.parentElement;
      const bounds = (node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        card: bounds(element),
        frame: bounds(frame),
        image: bounds(image),
        positionedWithinFrame: image.offsetParent === frame,
      };
    });
    expect(geometry.positionedWithinFrame, 'Gallery fill image must use its frame as its containing block').toBe(true);
    expect(geometry.frame.height).toBeGreaterThanOrEqual(200);
    expect(geometry.image.x).toBeCloseTo(geometry.frame.x, 0);
    expect(geometry.image.y).toBeCloseTo(geometry.frame.y, 0);
    expect(geometry.image.width).toBeCloseTo(geometry.frame.width, 0);
    expect(geometry.image.height).toBeCloseTo(geometry.frame.height, 0);
    expect(geometry.image.y).toBeGreaterThan(geometry.card.y);
    expect(geometry.image.y + geometry.image.height).toBeLessThan(geometry.card.y + geometry.card.height);
  }

  const heroLink = page.locator('.redesign-hero-actions a').first();
  // An actionability check catches images that visually obscure content or
  // intercept pointer events, unlike a plain visibility assertion.
  await heroLink.click({ trial: true });
  await expect(page.locator('h1')).toContainText('Empowering people.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('hero controls and gallery links remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Next story slide', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Stronger communities');
  await page.getByRole('button', { name: 'Previous story slide', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Empowering people.');

  const galleryLink = page.getByRole('link', { name: 'View photo in gallery: Learning together', exact: true });
  await galleryLink.click();
  await expect(page).toHaveURL(/\/gallery\/?$/);
});
