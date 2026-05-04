import { test, expect } from '@playwright/test';

async function completeOnboardingIfNeeded(page) {
  const letsGoButton = page.getByRole('button', { name: /let's go/i });
  if (!(await letsGoButton.isVisible().catch(() => false))) return;

  await letsGoButton.click();

  const startChallengeButton = page.getByRole('button', { name: /start challenge/i });
  await expect(startChallengeButton).toBeVisible();
  await startChallengeButton.click();

  await expect(page.locator('button[aria-label$="counter"]').first()).toBeVisible();
}

async function dismissAnnouncementIfVisible(page) {
  const dismissButton = page.getByRole('button', { name: /awesome/i });
  await dismissButton.waitFor({ state: 'visible', timeout: 1500 })
    .then(() => dismissButton.click())
    .catch(() => {});
}

test.describe('Main Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await completeOnboardingIfNeeded(page);
    await dismissAnnouncementIfVisible(page);
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
    const counterButton = page.locator('button[aria-label$="counter"]').first();
    await expect(counterButton).toBeVisible();

    await counterButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
