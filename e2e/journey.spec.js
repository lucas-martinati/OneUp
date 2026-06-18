import { test, expect, gotoDashboard } from './helpers';

// End-to-end coverage of the core user journey: onboarding (both modes),
// completing an exercise, the counter controls, switching exercises and
// switching language.

test.describe('Onboarding', () => {
  test('"start now" flow lands on the dashboard', async ({ page }) => {
    await gotoDashboard(page);

    // Day hero + counter button + the 5-destination nav prove we reached the dashboard.
    await expect(page.getByText(/^day$|^jour$/i).first()).toBeVisible();
    await expect(page.locator('button[aria-label$="counter"]').first()).toBeVisible();
    await expect(page.locator('nav').locator('button')).toHaveCount(5);
  });

  test('"already started" (history import) flow lands on the dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /let's go|c'est parti/i }).click();

    // Step 2: pick the "I already started this year" mode, then continue.
    await page.getByRole('button', { name: /already started|déjà commencé/i }).click();
    await page.getByRole('button', { name: /^continue$|^continuer$/i }).click();

    // Step 3: a date input + exercise pickers appear; pushups is preselected so
    // "Start Challenge" is enabled with the default (yesterday) date.
    await expect(page.locator('input[type="date"]')).toBeVisible();
    const start = page.getByRole('button', { name: /start challenge|lancer le défi/i });
    await expect(start).toBeEnabled();
    await start.click();

    await expect(page.locator('button[aria-label$="counter"]').first()).toBeVisible();
  });
});

test.describe('Exercise completion journey', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
  });

  test('completing an exercise marks its tile as done', async ({ page }) => {
    const counterButton = page.locator('button[aria-label$="counter"]').first();
    await counterButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const completeAll = dialog.getByRole('button', { name: /complete all|tout compléter/i });
    await completeAll.click();

    // Once the goal is reached the CTA disables — the completion was persisted.
    await expect(completeAll).toBeDisabled();

    // Close the panel and confirm the exercise tile now shows the done checkmark.
    await page.getByRole('button', { name: /^close$|^fermer$/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.exercise-button', { hasText: '✓' }).first()).toBeVisible();
  });

  test('incrementing then resetting updates the counter readout', async ({ page }) => {
    await page.locator('button[aria-label$="counter"]').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The ring readout starts at 0 (no control button is labelled "0").
    await expect(dialog.getByText('0', { exact: true })).toBeVisible();

    // "+10" is unambiguous (only the increment quad has a 10) and moves the count off zero.
    await dialog.getByRole('button', { name: '10' }).click();
    await expect(dialog.getByText('0', { exact: true })).toBeHidden();

    // Reset brings the readout back to zero.
    await dialog.getByRole('button', { name: /^reset$|^réinitialiser$/i }).click();
    await expect(dialog.getByText('0', { exact: true })).toBeVisible();
  });

  test('selecting another exercise switches the active counter', async ({ page }) => {
    const counterButton = page.locator('button[aria-label$="counter"]').first();
    const firstLabel = await counterButton.getAttribute('aria-label');

    // Pick a different exercise tile on the current (bodyweight) slide.
    await page.locator('.exercise-button').nth(1).click();

    await expect(counterButton).not.toHaveAttribute('aria-label', firstLabel);
  });
});

test.describe('Session builder', () => {
  test('central nav button opens the session configurator', async ({ page }) => {
    await gotoDashboard(page);

    await page.locator('nav').getByRole('button', { name: /^session$|^séance$/i }).click();
    await expect(page.locator('[role="dialog"], [class*="modal"]').first()).toBeVisible();
  });
});

test.describe('Internationalization', () => {
  test('language switcher translates the onboarding UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Default locale (en-US) renders English.
    await expect(page.getByRole('button', { name: /let's go/i })).toBeVisible();

    await page.locator('select[aria-label="Language"]').selectOption('fr');

    // The same CTA is now French — i18n switching works end to end.
    await expect(page.getByRole('button', { name: /c'est parti/i })).toBeVisible();
  });
});
