import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';
import { test, expect } from './helpers';

/** Exercise the full persistence/UI path with a legacy account snapshot. */
test('migrates once, counts partial reps and keeps higher milestones accessible after validation', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-19T12:00:00+01:00'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((announcementId) => {
        localStorage.setItem(`announcement_seen_${announcementId}`, '1');
        if (localStorage.getItem('level_test_seeded')) return;
        const now = new Date();
        const year = now.getFullYear();
        const yesterday = new Date(year, now.getMonth(), now.getDate() - 1);
        const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem('i18nextLng', 'en');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({
            startDate: `${year}-01-01`, userStartDate: `${year}-01-01`, isSetup: true,
            completions: {
                [dateStr(yesterday)]: { pushups: { isCompleted: true }, squats: { isCompleted: false, count: 40 } },
                [dateStr(now)]: { planche: { count: 19, goal: 200, level: 0, isCompleted: false } },
            },
        }));
        localStorage.setItem('level_test_seeded', 'true');
    }, CURRENT_ANNOUNCEMENT.id);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const counter = page.locator('button[aria-label$="counter"]').first();
    await expect(counter).toBeVisible();
    await expect(counter.locator('.counter-ring')).toHaveCSS('--ring-progress', `${50 / 365 * 100}%`);
    await counter.scrollIntoViewIfNeeded();
    await expect(counter).toBeInViewport();
    await page.screenshot({ path: 'test-results/levels-home-annual-ring-mobile.png', fullPage: true, animations: 'disabled' });
    await counter.click();
    const dialog = page.getByRole('dialog');
    const progress = dialog.getByRole('progressbar', { name: 'Levels' });
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(dialog.getByText('5 reps to level 1', { exact: true })).toBeVisible();
    const increment = dialog.getByRole('button', { name: '10', exact: true });
    await increment.click();
    await expect(increment).toBeEnabled();
    await expect(progress).toHaveAttribute('aria-valuenow', '2');
    await expect(dialog.getByText('5 reps to level 3', { exact: true })).toBeVisible();
    await expect(progress.locator('circle')).toBeVisible();
    // Continue beyond validation without disabling the increment controls.
    await increment.click();
    await increment.click();
    await expect(progress).not.toHaveAttribute('aria-valuenow', '0');
    await expect(increment).toBeEnabled();
    await dialog.getByRole('button', { name: /^close$/i }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(counter).toBeVisible();
    await counter.click();
    await expect(dialog.getByText('30', { exact: true })).toBeVisible();
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('pushup_challenge_data')));
    expect(persisted.progressVersion).toBe(5);
    const entries = Object.values(persisted.completions).map(day => day.pushups);
    expect(entries.some(entry => entry.level === 10 && entry.count > 0 && entry.goal > 0)).toBe(true);
    const unfinishedLegacy = Object.values(persisted.completions).find(day => day.squats)?.squats;
    expect(unfinishedLegacy).toMatchObject({ count: 40, isCompleted: true, goal: 49, level: 8 });
    await page.screenshot({ path: 'test-results/levels-mobile.png', fullPage: true, animations: 'disabled' });
    await dialog.getByRole('button', { name: /^close$/i }).click();
    await page.screenshot({ path: 'test-results/levels-home-mobile.png', fullPage: true, animations: 'disabled' });
    await expect(page.getByRole('button', { name: 'Streak', exact: true })).toHaveAccessibleDescription('Lvl 6');
    await expect(page.getByRole('button', { name: 'Streak', exact: true }).getByRole('img', { name: 'Lvl 6' })).toBeVisible();
    await page.locator('.exercise-button').filter({ hasText: 'Plank' }).click();
    await counter.click();
    await dialog.getByRole('button', { name: 'Resume', exact: true }).click();
    await expect.poll(() => page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('pushup_challenge_data'));
        return Math.max(...Object.values(data.completions).map(day => day.planche?.count || 0));
    })).toBeGreaterThanOrEqual(22);
    await expect(progress).toHaveAttribute('aria-valuenow', '1');
    await dialog.getByRole('button', { name: /^close$/i }).click();
    await page.getByRole('button', { name: 'Streak', exact: true }).click();
    await expect(page.getByText('Streaks by level').first()).toBeVisible();
    await expect(page.getByLabel('Lvl 1–6', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/levels-streaks-mobile.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    const day = page.getByRole('button', { name: /^19 February/ });
    await expect(day).toHaveAccessibleName('19 February · Lvl 6');
    await expect(day.getByRole('img', { name: 'Lvl 6' })).toBeVisible();
    await page.screenshot({ path: 'test-results/levels-calendar-mobile.png', fullPage: true, animations: 'disabled' });
    await day.click();
    await expect(page.getByRole('img', { name: 'Lvl 6', exact: true }).last()).toBeVisible();
    await page.screenshot({ path: 'test-results/levels-day-mobile.png', fullPage: true, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Statistics', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Charts', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Lvl 6', exact: true }).last()).toBeVisible();
    await page.screenshot({ path: 'test-results/levels-stats-overview-mobile.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Charts', exact: true }).click();
    const chart = page.locator('.chart-card').filter({ has: page.getByRole('heading', { name: 'Level history', exact: true }) });
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator('.svg-chart-line').first()).toHaveAttribute('d', /^[^C]+$/);
    await expect(chart.locator('.svg-chart-dot')).toHaveCount(2);
    await expect(chart).not.toContainText('Lvl 0');
    await chart.screenshot({ path: 'test-results/levels-chart-mobile.png', animations: 'disabled' });
    expect(errors).toEqual([]);
});
