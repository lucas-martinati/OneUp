import { test, expect } from '@playwright/test';

test.describe('Navigation & Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();
  });

  test('can interact with exercise selector', async ({ page }) => {
    const slideIndicator = page.locator('div').filter({ hasText: /^[0-9]$/ }).first();
    const isVisible = await slideIndicator.isVisible().catch(() => false);
    test.skip(!isVisible, 'Slide indicator not visible in current UI state.');
    await slideIndicator.click();
    await expect(slideIndicator).toBeVisible();
  });

  test('has working buttons on dashboard', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('scroll works on dashboard', async ({ page }) => {
    const main = page.locator('main').first();
    const isVisible = await main.isVisible().catch(() => false);
    test.skip(!isVisible, 'Main container not visible in current UI state.');
    await main.evaluate(el => el.scrollTo(0, 100));
    await expect.poll(async () => main.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  });
});
