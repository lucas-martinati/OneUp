import { test, expect } from './helpers';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';

test('finishes a partial session only after confirmation and preserves reached levels', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-19T12:00:00+01:00'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(id => {
        localStorage.setItem(`announcement_seen_${id}`, '1');
        localStorage.setItem('oneup_language', 'fr');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({ startDate: '2026-01-01', isSetup: true, completions: {
            '2026-02-19': { pushups: { count: 15, goal: 50, level: 3, isCompleted: true } },
        } }));
    }, CURRENT_ANNOUNCEMENT.id);
    await page.goto('/');
    await page.locator('nav').getByRole('button', { name: /séance|session/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText('Pompes', { exact: true }).click();
    await dialog.getByText('Squats', { exact: true }).click();
    await dialog.getByRole('button', { name: /Lancer \(2/ }).click();
    await page.getByRole('button', { name: 'Terminer la séance', exact: true }).click();
    await expect(page.getByText(/Certains exercices restent incomplets/)).toBeVisible();
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oneup_session_history') || '[]').length)).toBe(0);
    await page.getByRole('button', { name: 'Terminer la séance', exact: true }).click();
    await page.getByRole('button', { name: 'Terminer la séance', exact: true }).last().click();
    await expect(page.getByText('Vos progrès sont enregistrés')).toBeVisible();
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('oneup_session_history'))[0]);
    expect(session.exercises).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'pushups', reps: 15, level: 3 }),
        expect.objectContaining({ id: 'squats', reps: 0, level: 0 }),
    ]));
    const day = await page.evaluate(() => JSON.parse(localStorage.getItem('pushup_challenge_data')).completions['2026-02-19']);
    expect(day.pushups.level).toBe(3);
    expect(day.squats?.isCompleted || false).toBe(false);
    await page.screenshot({ path: 'test-results/partial-session-mobile.png', animations: 'disabled' });
});
