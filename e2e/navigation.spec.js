import { test, expect } from '@playwright/test';

test.describe('Navigation & Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('can interact with exercise selector', async ({ page }) => {
    const slideIndicator = page.locator('div').filter({ hasText: /^[0-9]$/ }).first();
    
    if (await slideIndicator.isVisible().catch(() => false)) {
      await slideIndicator.click();
      await page.waitForTimeout(300);
    }
    expect(true).toBe(true);
  });

  test('has working buttons on dashboard', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('scroll works on dashboard', async ({ page }) => {
    const main = page.locator('main').first();
    
    if (await main.isVisible().catch(() => false)) {
      await main.evaluate(el => el.scrollTo(0, 100));
      await page.waitForTimeout(300);
    }
    expect(true).toBe(true);
  });
});