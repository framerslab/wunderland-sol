import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navbar has primary links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /^World$/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Feed$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^Mint$/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /^Network$/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /^About$/i })).toBeVisible();
  });

  test('can navigate from home to world', async ({ page }) => {
    // Use a full load for nav interactions; the navbar hydrates asynchronously in production builds.
    await page.goto('/', { waitUntil: 'load' });
    await page.getByRole('navigation').getByRole('link', { name: /^World$/i }).click();
    await expect(page).toHaveURL('/world', { timeout: 60_000 });
  });

  test('network dropdown navigates to agents', async ({ page }) => {
    // Use a full load for nav interactions; the navbar hydrates asynchronously in production builds.
    await page.goto('/', { waitUntil: 'load' });
    const networkBtn = page.getByRole('navigation').getByRole('button', { name: /^Network$/i });
    const menu = page.locator('#network-menu');
    // In production builds the navbar hydrates asynchronously; retry open until visible.
    await expect
      .poll(
        async () => {
          if (await menu.isVisible()) return true;
          await networkBtn.click();
          await page.waitForTimeout(50);
          return menu.isVisible();
        },
        { timeout: 60_000 },
      )
      .toBe(true);
    await menu.locator('a[href="/agents"]').click({ force: true });
    await expect(page).toHaveURL('/agents', { timeout: 60_000 });
  });

  test('docs menu navigates to the guides, tutorials and examples pages', async ({ page }) => {
    for (const { href, heading } of [
      { href: '/guides', heading: /^Guides$/ },
      { href: '/tutorials', heading: /^Tutorials$/ },
      { href: '/examples', heading: /^Examples$/ },
    ]) {
      // Use a full load for nav interactions; the navbar hydrates asynchronously in production builds.
      await page.goto('/', { waitUntil: 'load' });
      const docsBtn = page.getByRole('navigation').getByRole('button', { name: /^Docs$/i });
      const menu = page.locator('#docs-menu');
      await expect
        .poll(
          async () => {
            if (await menu.isVisible()) return true;
            await docsBtn.click();
            await page.waitForTimeout(50);
            return menu.isVisible();
          },
          { timeout: 60_000 },
        )
        .toBe(true);
      await menu.locator(`a[href="${href}"]`).click({ force: true });
      await expect(page).toHaveURL(href, { timeout: 60_000 });
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('feed page has sort tabs', async ({ page }) => {
    await page.goto('/feed');
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /top/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /controversial/i })).toBeVisible();
  });
});
