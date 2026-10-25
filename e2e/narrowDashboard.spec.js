import { test, expect } from './helpers';

test('keeps dashboard columns stable while fitting narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 160, height: 650 });
    await page.addInitScript(() => {
        localStorage.setItem('oneup_language', 'fr');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({
            isSetup: true, startDate: '2026-01-01', completions: {},
        }));
    });
    await page.goto('/');
    await page.locator('.exercise-grid').first().waitFor();
    await page.evaluate(() => document.fonts.ready);

    for (const viewport of [
        { width: 160, height: 650 },
        { width: 180, height: 650 },
        { width: 240, height: 600 },
        { width: 390, height: 844 },
        { width: 160, height: 650 },
    ]) {
        await page.setViewportSize(viewport);
        const samples = await page.locator('.exercise-grid').first().evaluate(async grid => {
            const content = grid.closest('.fit-to-view-content');
            const container = content.parentElement;
            const result = [];
            // Observe successive frames after entrance animations settle. A
            // single screenshot can miss the alternating two/three-column loop.
            for (let frame = 0; frame < 120; frame++) {
                await new Promise(requestAnimationFrame);
                if (frame < 80) continue;
                const firstTop = grid.children[0].getBoundingClientRect().top;
                result.push({
                    columns: [...grid.children].filter(child => Math.abs(child.getBoundingClientRect().top - firstTop) < 2).length,
                    width: content.clientWidth,
                    availableWidth: container.clientWidth,
                    scale: content.style.transform,
                });
            }
            return result;
        });
        expect(new Set(samples.map(sample => sample.columns)).size, JSON.stringify(viewport)).toBe(1);
        expect(new Set(samples.map(sample => sample.scale)).size, JSON.stringify(viewport)).toBe(1);
        for (const sample of samples) expect(Math.abs(sample.width - sample.availableWidth)).toBeLessThanOrEqual(1);
    }
});
