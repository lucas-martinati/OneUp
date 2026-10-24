import { test, expect } from './helpers';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';

test('repairs an already migrated 80-rep cap on day 297 and allows continuing', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-24T12:00:00+02:00'));
    await page.addInitScript(id => {
        localStorage.setItem(`announcement_seen_${id}`, '1');
        localStorage.setItem('oneup_language', 'en');
        const entry = { count: 80, goal: 80, level: 10, difficulty: 0.3, isCompleted: true, timestamp: 123 };
        localStorage.setItem('pushup_challenge_data', JSON.stringify({ startDate: '2026-01-01', isSetup: true, progressVersion: 4,
            completions: { '2026-10-23': { pushups: entry }, '2026-10-24': { pushups: entry } },
        }));
    }, CURRENT_ANNOUNCEMENT.id);
    await page.goto('/');
    await page.locator('button[aria-label$="counter"]').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('progressbar', { name: 'Levels' })).toHaveAttribute('aria-valuenow', '2');
    await dialog.getByRole('button', { name: '10', exact: true }).click();
    await expect(dialog.getByRole('progressbar', { name: 'Levels' })).toHaveAttribute('aria-valuenow', '3');
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('pushup_challenge_data')));
    expect(data.completions['2026-10-24'].pushups).toMatchObject({ count: 90, goal: 297, level: 3 });
    expect(data.completions['2026-10-23'].pushups).toMatchObject({ count: 80, goal: 80, level: 10 });
});
