import { test as base, expect } from '@playwright/test';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';

/** Keep release announcements from interrupting unrelated test journeys. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((announcementId) => {
      try {
        localStorage.setItem(`announcement_seen_${announcementId}`, '1');
        localStorage.removeItem('oneup_has_opened');
      } catch { /* Storage may be unavailable in a restricted context. */ }
    }, CURRENT_ANNOUNCEMENT.id);
    await use(page);
  },
});

export { expect };

/**
 * Wait for the onboarding step card's entrance animation to finish.
 *
 * Each step is a `key={step}` element, so advancing a step REMOUNTS the card
 * with a fresh `.flip-enter` (`flipIn` 0.6s rotateY). Clicking a control inside
 * the card mid-flip is racy: the node is freshly mounted and transforming, which
 * surfaces as "element is not stable" / "element was detached from the DOM".
 * Playwright auto-waits for stability on a simple click, but selecting a mode
 * card and then continuing chains two interactions on the same animating card,
 * so we settle the animation explicitly first. Resolves immediately when no card
 * is animating (e.g. reduced motion).
 */
export async function settleStepCard(page) {
  await page
    .waitForFunction(() => {
      const card = document.querySelector('.flip-enter');
      if (!card) return true;
      return card.getAnimations().every(a => a.playState === 'finished');
    }, { timeout: 5000 })
    .catch(() => {});
}

/**
 * Drive the 3-step onboarding to completion (default "start now" mode) and
 * land on the dashboard. No-op if onboarding was already completed.
 *
 * Step 1 (concept)  → "Let's go!"
 * Step 2 (mode)     → "Continue"  (the "Start now" card is selected by default)
 * Step 3 (ready)    → "Start Challenge"
 */
export async function completeOnboarding(page) {
  const letsGo = page.getByRole('button', { name: /let's go|c'est parti/i });
  if (!(await letsGo.isVisible().catch(() => false))) return;

  await letsGo.click();
  await settleStepCard(page);
  await page.getByRole('button', { name: /^continue$|^continuer$/i }).click();
  await settleStepCard(page);
  await page.getByRole('button', { name: /start challenge|lancer le défi/i }).click();

  // Dashboard is ready once the first exercise counter button is mounted.
  await expect(page.locator('button[aria-label$="counter"]').first()).toBeVisible();
}

/** Load the app and reach a clean dashboard state. */
export async function gotoDashboard(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await completeOnboarding(page);
}
