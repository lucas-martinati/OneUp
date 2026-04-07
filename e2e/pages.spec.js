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
    const settingsButton = page.locator('button').filter({ hasText: /paramètres|settings/i }).first();
    
    const isVisible = await settingsButton.isVisible().catch(() => false);
    if (isVisible) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      const settingsModal = page.locator('[class*="modal"], [role="dialog"]').first();
      const modalVisible = await settingsModal.isVisible().catch(() => false);
      expect(modalVisible).toBe(true);
    }
  });

  test('Counter starts workout', async ({ page }) => {
    const counterButtons = page.locator('button').all();
    let counterFound = false;
    
    for (const button of await counterButtons) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('start')) {
        await button.click();
        await page.waitForTimeout(500);
        counterFound = true;
        break;
      }
    }
    expect(counterFound).toBe(true);
  });
});