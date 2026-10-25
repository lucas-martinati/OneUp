import { test, expect } from './helpers';

test('browses session exercises with both arrows and preserves partial progress', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-19T12:00:00+01:00'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
        localStorage.setItem('oneup_language', 'fr');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({
            startDate: '2026-01-01', isSetup: true,
            completions: { '2026-02-19': { pushups: { count: 17, goal: 50, level: 3, isCompleted: true } } },
        }));
    });
    await page.goto('/');
    await page.locator('nav').getByRole('button', { name: /séance|session/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText('Pompes', { exact: true }).click();
    await dialog.getByText('Squats', { exact: true }).click();
    await dialog.getByRole('button', { name: /Lancer \(2/ }).click();
    const next = page.getByRole('button', { name: 'Exercice suivant', exact: true });
    const previous = page.getByRole('button', { name: 'Exercice précédent', exact: true });
    await expect(page.getByRole('heading', { name: 'Pompes', exact: true })).toBeVisible();
    await next.click();
    await expect(page.getByRole('heading', { name: 'Squats', exact: true })).toBeVisible();
    // Enter on the focused previous button must activate that button.
    await previous.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Pompes', exact: true })).toBeVisible();
    await previous.click();
    await expect(page.getByRole('heading', { name: 'Squats', exact: true })).toBeVisible();
    await next.click();
    await expect(page.getByRole('heading', { name: 'Pompes', exact: true })).toBeVisible();
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('pushup_challenge_data')));
    expect(progress.completions['2026-02-19'].pushups).toMatchObject({ count: 17, level: 3 });
    await page.screenshot({ path: 'test-results/workout-navigation-mobile.png', animations: 'disabled' });
    await page.setViewportSize({ width: 320, height: 740 });
    await expect(previous).toBeInViewport();
    await expect(next).toBeInViewport();
    const prevBox = await previous.boundingBox();
    const nextBox = await next.boundingBox();
    expect(prevBox.x + prevBox.width).toBeLessThanOrEqual(nextBox.x);
    await page.getByRole('button', { name: 'Tout compléter', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Squats', exact: true })).toBeVisible();
    await previous.click();
    await expect(page.getByRole('heading', { name: 'Pompes', exact: true })).toBeVisible();
    // Wait beyond the 1500 ms celebration timer to catch an unintended auto-skip.
    await page.waitForTimeout(1800);
    await expect(page.getByRole('heading', { name: 'Pompes', exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oneup_session_history') || '[]').length)).toBe(0);
});
