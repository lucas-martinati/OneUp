import { test as base, expect } from '@playwright/test';

/**
 * Shared test fixture that neutralises the returning-user announcement overlay.
 *
 * `useAnnouncement` shows a full-screen overlay 800ms after the dashboard mounts
 * for any user who has opened the app before (the `oneup_has_opened` flag). In
 * E2E it pops in mid-interaction and intercepts pointer events, causing flaky
 * failures. Clearing the flag before every page load forces the "new user" path,
 * where the overlay is never shown — independent of the current announcement id.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try { window.localStorage.removeItem('oneup_has_opened'); } catch { /* ignore */ }

      // Safety net: even if a dashboard remount re-triggers the overlay, keep it
      // hidden so it can never intercept pointer events. The `.ann-backdrop`
      // class is stable across announcement content changes.
      const css = '.ann-backdrop{display:none!important;pointer-events:none!important}';
      const inject = () => {
        const style = document.createElement('style');
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
      };
      if (document.head) inject();
      else document.addEventListener('DOMContentLoaded', inject);
    });
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
