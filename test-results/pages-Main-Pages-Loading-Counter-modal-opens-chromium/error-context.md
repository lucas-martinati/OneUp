# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages.spec.js >> Main Pages Loading >> Counter modal opens
- Location: e2e/pages.spec.js:31:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Main Pages Loading', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  6  |     await page.waitForTimeout(3000);
  7  |   });
  8  | 
  9  |   test('Dashboard page loads', async ({ page }) => {
  10 |     const body = page.locator('body');
  11 |     await expect(body).toBeVisible();
  12 |     
  13 |     const hasContent = await body.evaluate(el => el.innerText.length > 0);
  14 |     expect(hasContent).toBe(true);
  15 |   });
  16 | 
  17 |   test('Settings modal opens', async ({ page }) => {
  18 |     const settingsButton = page.locator('button').filter({ hasText: /settings|paramètres/i }).first();
  19 |     if (await settingsButton.isVisible().catch(() => false)) {
  20 |       await settingsButton.click();
  21 |       await page.waitForTimeout(500);
  22 |       
  23 |       const settingsModal = page.locator('[class*="modal"], [role="dialog"]').first();
  24 |       if (await settingsModal.isVisible().catch(() => false)) {
  25 |         expect(true).toBe(true);
  26 |       }
  27 |     }
  28 |     expect(true).toBe(true);
  29 |   });
  30 | 
  31 |   test('Counter modal opens', async ({ page }) => {
  32 |     const counterButtons = page.locator('button').all();
  33 |     let counterFound = false;
  34 |     
  35 |     for (const button of await counterButtons) {
  36 |       const text = await button.textContent();
  37 |       if (text && text.toLowerCase().includes('start')) {
  38 |         await button.click();
  39 |         await page.waitForTimeout(500);
  40 |         counterFound = true;
  41 |         break;
  42 |       }
  43 |     }
  44 |     expect(true).toBe(true);
  45 |   });
  46 | });
```