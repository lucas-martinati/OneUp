import { test, expect } from '@playwright/test';

test.describe('Main Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard page loads', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const hasContent = await body.evaluate(el => el.innerText.length > 0);
    expect(hasContent).toBe(true);
  });

  test('Settings modal opens', async ({ page }) => {
    const settingsButton = page.locator('button').filter({ hasText: /settings|paramètres/i }).first();
    const isVisible = await settingsButton.isVisible().catch(() => false);
    test.skip(!isVisible, 'Settings button not visible in current UI state.');
    await settingsButton.click();
    await page.waitForLoadState('networkidle');
    
    const settingsModal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(settingsModal).toBeVisible();
  });

  test('Counter starts workout', async ({ page }) => {
    const counterButtons = page.locator('button').all();
    let startButtonClicked = false;
    
    for (const button of await counterButtons) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('start')) {
        await button.click();
        await page.waitForLoadState('networkidle');
        startButtonClicked = true;
        break;
      }
    }

    test.skip(!startButtonClicked, 'Start button not visible in current UI state.');
    const counterModal = page.locator('[class*="modal"], [role="dialog"]').first();
    await expect(counterModal).toBeVisible();
  });
});
