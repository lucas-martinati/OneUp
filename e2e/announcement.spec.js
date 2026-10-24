import { test, expect } from './helpers';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';

// Real announcement and release assets, rendered without contacting an account.
test('presents the levels release with readable screenshots on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((id) => {
        localStorage.setItem(`announcement_seen_${id}`, '1');
        localStorage.setItem('oneup_language', 'fr');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({ isSetup: true, startDate: '2026-01-01', completions: {} }));
    }, CURRENT_ANNOUNCEMENT.id);
    await page.goto('/');
    await page.evaluate(async () => {
        const [{ default: React }, { default: ReactDOM }, { AnnouncementOverlay }, { default: announcement }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
            import('/src/features/announcements/AnnouncementOverlay.jsx'), import('/src/features/announcements/announcementConfig.js'),
        ]);
        const host = document.createElement('div'); document.body.append(host);
        const root = ReactDOM.createRoot(host);
        root.render(React.createElement(AnnouncementOverlay, { announcement, onDismiss: () => root.unmount() }));
    });
    const card = page.locator('.ann-card');
    await expect(card.getByRole('heading', { name: 'Chaque effort vous fait monter de niveau' })).toBeVisible();
    await expect(card.locator('.ann-highlight')).toHaveCount(6);
    const images = card.locator('.ann-image');
    await expect(images).toHaveCount(3);
    for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
        await expect(image).not.toHaveAttribute('alt', '');
    }
    await card.evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: 'test-results/announcement-levels-mobile.png', animations: 'disabled' });
    const gallery = card.getByRole('region');
    await gallery.scrollIntoViewIfNeeded();
    await gallery.evaluate(el => { el.scrollLeft = 0; });
    await page.screenshot({ path: 'test-results/announcement-levels-gallery.png', animations: 'disabled' });
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await card.getByRole('button', { name: 'À moi de jouer !' }).click();
    await expect(card).toHaveCount(0);
});
