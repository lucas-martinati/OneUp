import { test, expect, gotoDashboard } from './helpers';

test.describe('Bottom navigation bar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
  });

  test('shows the five destinations', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    const buttons = nav.locator('button');
    await expect(buttons).toHaveCount(5);
  });

  const destinations = [
    { name: /calendrier|calendar/i },
    { name: /statistiques|statistics/i },
    { name: /classement|leaderboard/i },
    { name: /paramètres|settings/i },
  ];

  for (const dest of destinations) {
    test(`opens a modal from the ${dest.name} item`, async ({ page }) => {
      await page.locator('nav').getByRole('button', { name: dest.name }).click();
      const modal = page.locator('[class*="modal"], [role="dialog"]').first();
      await expect(modal).toBeVisible();
    });
  }

  test('central button opens the session builder', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: /séance|session|workout/i }).click();
    const modal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(modal).toBeVisible();
  });

  test('header no longer contains navigation buttons', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByRole('button', { name: /paramètres|settings/i })).toHaveCount(0);
    await expect(header.getByRole('button', { name: /statistiques|statistics/i })).toHaveCount(0);
  });
});
