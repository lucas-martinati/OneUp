import { test, expect } from './helpers';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';

test('desktop timer darkens the full overlay and streak separators match their borders', async ({ page }) => {
    await page.setViewportSize({ width: 1565, height: 1080 });
    await page.addInitScript(id => {
        localStorage.setItem(`announcement_seen_${id}`, '1');
        localStorage.setItem('oneup_language', 'en');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({ isSetup: true, startDate: '2026-01-01', completions: {} }));
    }, CURRENT_ANNOUNCEMENT.id);
    await page.goto('/');
    await page.locator('.exercise-button').filter({ hasText: 'Plank' }).click();
    await page.locator('button[aria-label$="counter"]').first().click();
    const panel = page.getByRole('dialog', { name: 'Plank' });
    const overlay = page.locator('.modal-overlay').filter({ has: panel });
    const original = await overlay.evaluate(el => getComputedStyle(el).backgroundColor);
    await panel.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(overlay).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    expect(await overlay.evaluate(el => el.getBoundingClientRect().width)).toBe(1565);
    await page.screenshot({ path: 'test-results/desktop-timer-black.png', animations: 'disabled' });
    await panel.getByRole('button', { name: 'Pause', exact: true }).first().click();
    await expect(overlay).toHaveCSS('background-color', original);
    await page.evaluate(async () => {
        const [{ default: React }, { default: ReactDOM }, { StreakFlame }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'), import('/src/components/ui/StreakFlame.jsx'),
        ]);
        const host = document.createElement('div'); host.id = 'streak-fixture'; document.body.append(host);
        ReactDOM.createRoot(host).render(React.createElement(StreakFlame, { streak: 2, level: 5, active: true, variant: 'badge' }));
    });
    const badge = page.locator('#streak-fixture > div');
    const separator = badge.locator(':scope > span[aria-hidden="true"]');
    await expect(separator).toHaveCSS('background-color', 'rgba(249, 115, 22, 0.3)');
    await expect(badge).toHaveCSS('border-top-color', await separator.evaluate(el => getComputedStyle(el).backgroundColor));
});
