import { test, expect } from './helpers';
import CURRENT_ANNOUNCEMENT from '../src/features/announcements/announcementConfig.js';
import { writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';

// Render real presentation components with fixture data; no real account is contacted.
test('shows level profiles, graphical settings and exports the shared level emblems', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-24T12:00:00+02:00'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(id => {
        localStorage.setItem(`announcement_seen_${id}`, '1');
        localStorage.setItem('oneup_language', 'fr');
        localStorage.setItem('pushup_challenge_data', JSON.stringify({ isSetup: true, startDate: '2026-01-01', completions: {} }));
    }, CURRENT_ANNOUNCEMENT.id);
    await page.goto('/');
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.evaluate(async () => {
        // Vite adds HMR timestamps: stub the same service instance as the component.
        const source = await (await fetch('/src/components/social/UserDetail.jsx')).text();
        const serviceUrl = source.match(/from "([^"]*\/cloudSync\.js[^"]*)"/)[1];
        const [{ default: React }, { default: ReactDOM }, { UserDetail }, { cloudSync }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
            import('/src/components/social/UserDetail.jsx'), import(serviceUrl),
        ]);
        const levels = Array.from({ length: 10 }, (_, i) => ({ level: i + 1, current: i < 6 ? 20 : (i < 8 ? 1 : 0), max: 30 }));
        cloudSync.loadUserDetailsWithCache = async () => ({ achievements: 8, derivedStats: {
            currentStreak: 20, streakLevel: 6, maxStreak: 30, totalDays: 25, levelStreaks: levels,
            exerciseDoneToday: { pushups: true },
            exerciseLevels: { pushups: { streak: 20, level: 6, levels } },
        } });
        const host = document.createElement('div'); document.body.append(host);
        const root = ReactDOM.createRoot(host);
        window.presentationRoot = root;
        root.render(React.createElement(UserDetail, { entry: { uid: 'fixture', pseudo: 'Camille', isPro: true, isSupporter: true, lastActiveDay: '2026-10-24', totalReps: 1250, weightsTotalReps: 300, exerciseReps: { pushups: 1200, biceps_curl: 300, running: 50 } }, rank: 3, isMe: false, onClose: () => root.unmount() }));
    });
    await expect(page.getByRole('heading', { name: 'Parcours de niveaux' })).toBeVisible();
    await expect(page.getByText('Mes séries par niveau', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Séries par niveau', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Lvl 6', exact: true }).first()).toBeVisible();
    const profile = page.getByRole('dialog', { name: 'Camille' });
    const levelSummary = profile.locator('section').filter({ has: page.getByRole('heading', { name: 'Parcours de niveaux' }) }).last();
    for (const level of [8, 6, 10]) await expect(levelSummary.getByRole('img', { name: `Lvl ${level}`, exact: true }).first()).toBeVisible();
    await expect(profile.getByText(/1[\s\u202f]550/, { exact: true })).toBeVisible();
    await expect(profile.getByText('300', { exact: true }).first()).toBeVisible();
    await expect(profile.getByLabel('Classement #3', { exact: true })).toBeVisible();
    await expect(profile.getByText(/1[\s\u202f]250/, { exact: true })).toBeVisible();
    for (const [label, description] of [['Pro', 'Membre Pro — programmes personnalisés'], ['Soutien', "Soutient l'app par un don"]]) {
        const badge = profile.locator('summary').filter({ hasText: new RegExp(`^${label}$`) });
        await badge.click();
        await expect(profile.getByText(description, { exact: true })).toBeVisible();
        await badge.click();
        await expect(profile.getByText(description, { exact: true })).not.toBeVisible();
    }
    const levelToggle = levelSummary.locator('summary');
    await levelToggle.click();
    await expect(levelSummary.locator('details')).toHaveAttribute('open', '');
    await levelToggle.click();
    await page.screenshot({ path: 'test-results/level-profile-mobile.png', animations: 'disabled' });
    await page.evaluate(async () => {
        const [{ default: React }, { LevelSection }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/src/pages/Settings/components/SettingsPanels.jsx'),
        ]);
        window.presentationRoot.render(React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 99999, background: '#0c0c15', padding: 16, overflow: 'auto' } }, React.createElement(LevelSection)));
    });
    await expect(page.getByText('Exemple de progression', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/level-settings-mobile.png', animations: 'disabled' });
    await page.setViewportSize({ width: 600, height: 1100 });
    await page.evaluate(async () => {
        const [{ default: React }, { ShareCard }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/src/features/share/components/ShareCard.jsx'),
        ]);
        const ref = React.createRef(); window.shareFixtureRef = ref;
        window.presentationRoot.render(React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 99999, background: '#0c0c15', overflow: 'auto', display: 'grid', placeItems: 'start center' } }, React.createElement(ShareCard, {
            cardRef: ref, sessionData: { name: 'Séance du jour', date: '2026-10-24', duration: 600, exercises: [{ id: 'pushups', reps: 30, level: 6 }, { id: 'squats', reps: 50, level: 10 }] },
            stats: { displayStreak: 20, streakLevel: 6, streakActive: true },
            options: { showStreak: true, showExercises: true, showDuration: true, theme: 'dark' }, settings: {}, sessionHistory: [],
        })));
    });
    await expect(page.getByRole('img', { name: 'Lvl 10', exact: true }).last()).toBeVisible();
    const png = await page.evaluate(async () => {
        await document.fonts.ready;
        const { captureElement } = await import('/src/features/share/services/shareService.js');
        return captureElement(window.shareFixtureRef.current, { pixelRatio: 1 });
    });
    expect(png).toMatch(/^data:image\/png;base64,/);
    await writeFile('test-results/level-share-export.png', Buffer.from(png.split(',')[1], 'base64'));
    await testInfo.attach('level-share-export.png', { body: Buffer.from(png.split(',')[1], 'base64'), contentType: 'image/png' });
    await page.screenshot({ path: 'test-results/level-share-preview.png', animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
        const [{ default: React }, { CardioWeeklyGoal }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/src/features/cardio/CardioWeeklyGoal.jsx'),
        ]);
        window.presentationRoot.render(React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 99999, background: '#0c0c15', padding: 24 } },
            React.createElement(CardioWeeklyGoal, { distance: 3, goal: 5, weekNumber: 8 })));
    });
    const cardioProgress = page.getByRole('progressbar', { name: 'Niveaux', exact: true }).last();
    await expect(cardioProgress).toHaveAttribute('aria-valuenow', '6');
    await expect(cardioProgress).toHaveCSS('mask-image', /repeating-linear-gradient/);
    await expect(page.getByRole('img', { name: 'Lvl 6', exact: true }).last()).toBeVisible();
    await page.screenshot({ path: 'test-results/cardio-level-bar-mobile.png', animations: 'disabled' });
    await page.evaluate(async () => {
        const shareSource = await (await fetch('/src/features/share/components/SharePanel.jsx')).text();
        const subscriptionUrl = shareSource.match(/from "([^"]*\/SubscriptionContext\.jsx[^"]*)"/)[1];
        const subscriptionSource = await (await fetch(subscriptionUrl)).text();
        const authUrl = subscriptionSource.match(/from "([^"]*\/AuthContext\.jsx[^"]*)"/)[1];
        const mainSource = await (await fetch('/src/main.jsx')).text();
        const oauthUrl = mainSource.match(/from "([^"]*\/@react-oauth_google\.js[^"]*)"/)[1];
        const [{ default: React }, { SessionDetailModal }, { AuthProvider }, { SubscriptionProvider }, { GoogleOAuthProvider }] = await Promise.all([
            import('/node_modules/.vite/deps/react.js'), import('/src/features/share/components/SessionDetailModal.jsx'),
            import(authUrl), import(subscriptionUrl), import(oauthUrl),
        ]);
        window.presentationRoot.render(React.createElement(GoogleOAuthProvider, { clientId: "fixture" }, React.createElement(AuthProvider, null, React.createElement(SubscriptionProvider, null, React.createElement(SessionDetailModal, { onClose: () => {}, session: {
            id: 'fixture-detail', date: '2026-02-19T12:00:00Z', duration: 600, exercises: [
                { id: 'pushups', reps: 50 }, { id: 'squats', reps: 15, level: 3 }, { id: 'abs', reps: 0, level: 0 },
                { id: 'custom_long', label: 'Développé incliné avec haltères et prise neutre', reps: 125, weight: 22.5, level: 7 },
            ],
        } })))));
    });
    const sessionDetail = page.getByRole('dialog').last();
    for (const level of [10, 3, 0]) await expect(sessionDetail.getByRole('img', { name: `Lvl ${level}`, exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/session-detail-levels-mobile.png', animations: 'disabled' });
    await page.setViewportSize({ width: 320, height: 640 });
    const longName = sessionDetail.getByText('Développé incliné avec haltères et prise neutre', { exact: true });
    await longName.scrollIntoViewIfNeeded();
    expect(await longName.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)).toBe(true);
    expect(await sessionDetail.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(sessionDetail.getByRole('img', { name: 'Lvl 7', exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/session-detail-small-screen.png', animations: 'disabled' });
    expect(errors).toEqual([]);
});
