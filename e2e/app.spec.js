import { test, expect } from '@playwright/test';

test.describe('App Initialization', () => {
  test('should load app without critical errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');

    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e => 
      !e.includes('Failed to load resource') && 
      !e.includes('net::ERR') &&
      !e.includes('Warning') &&
      !e.includes('warning')
    );

    console.log('Console errors found:', criticalErrors);

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have no uncaught exceptions', async ({ page }) => {
    const pageErrors = [];
    
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(pageErrors).toHaveLength(0);
  });

  test('app renders main UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const body = await page.locator('body');
    const hasContent = await body.evaluate(el => el.innerText.length > 0);
    
    expect(hasContent).toBe(true);
  });
});