import { test, expect, gotoDashboard } from './helpers';

test.describe('Main Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
  });

  test('Dashboard page loads', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const hasContent = await body.evaluate(el => el.innerText.length > 0);
    expect(hasContent).toBe(true);
  });

  test('Settings modal opens', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: /paramètres|settings/i }).click();

    const settingsModal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(settingsModal).toBeVisible();
  });

  test('Counter starts workout', async ({ page }) => {
    const counterButton = page.locator('button[aria-label$="counter"]').first();
    await expect(counterButton).toBeVisible();

    await counterButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
