import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  android: true, listener: null, progress: null, exercises: null, pending: [],
  plugin: { configure: vi.fn(), publish: vi.fn(), getPending: vi.fn(), acknowledge: vi.fn(), addListener: vi.fn() },
  stats: { displayStreak: 12 }, i18n: { resolvedLanguage: 'fr' }, t: key => key,
}));
vi.mock('@utils/platform', () => ({ isAndroidPlatform: () => fixture.android }));
vi.mock('@capacitor/core', () => ({ registerPlugin: () => fixture.plugin }));
vi.mock('@contexts/SubscriptionContext', () => ({ useSubscription: () => ({ isPro: true, isSubscriptionLoading: false }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: fixture.t, i18n: fixture.i18n }), initReactI18next: {} }));
vi.mock('@store/useProgressStore', () => ({ useProgressStore: { getState: () => fixture.progress, subscribe: () => () => {} } }));
vi.mock('@store/useExercisesStore', () => ({ useExercisesStore: { getState: () => fixture.exercises, subscribe: () => () => {} } }));
vi.mock('@store/useComputedStatsStore', () => ({ useComputedStatsStore: { getState: () => ({ stats: fixture.stats }), subscribe: () => () => {} } }));
vi.mock('@utils/exerciseLabel', () => ({ getExerciseLabel: ex => ex.id }));
vi.mock('../wearSession', () => ({ applyWearSessionEffect: vi.fn() }));
vi.mock('@features/share/services/sessionHistoryService', () => ({ getSessionHistory: () => [] }));
import { useWearSync } from '../useWearSync';

const auth = { loading: false, user: { uid: 'user-a' } };
async function advance() { await act(async () => { await vi.advanceTimersByTimeAsync(250); }); }
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); fixture.android = true; fixture.pending = []; localStorage.clear();
  fixture.progress = { _userId: 'user-a', isStoreInitialized: true, isSetup: true, getDayNumber: () => 50, completions: {}, wearReceipts: {}, applyWearOperation: vi.fn(async () => 'applied') };
  fixture.exercises = { _userId: 'user-a', isStoreInitialized: true, getWeight: () => null, customExercises: [], customCategories: [] };
  fixture.plugin.configure.mockResolvedValue({ scope: 'scope-a' });
  fixture.plugin.publish.mockResolvedValue({});
  fixture.plugin.getPending.mockImplementation(async () => ({ operations: fixture.pending }));
  fixture.plugin.acknowledge.mockResolvedValue({});
  fixture.plugin.addListener.mockImplementation(async (_name, callback) => { fixture.listener = callback; return { remove: vi.fn() }; });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('native Wear orchestration', () => {
  it('leaves the web app entirely outside the native bridge', async () => {
    fixture.android = false; renderHook(() => useWearSync(auth)); await advance();
    expect(fixture.plugin.configure).not.toHaveBeenCalled();
  });
  it('acknowledges only after durable progress storage completes', async () => {
    const operation = { device: 'watch-a', sequence: 1 };
    fixture.pending = [{ uri: 'wear://watch/operation', operation, catalog: {} }];
    let finishSave;
    fixture.progress.applyWearOperation.mockImplementation(() => new Promise(resolve => { finishSave = resolve; }));
    renderHook(() => useWearSync(auth)); await advance();
    expect(fixture.progress.applyWearOperation).toHaveBeenCalled();
    expect(fixture.plugin.acknowledge).not.toHaveBeenCalled();
    await act(async () => { fixture.progress.wearReceipts = { 'watch-a': 1 }; finishSave('applied'); });
    expect(fixture.plugin.acknowledge).toHaveBeenCalledWith({ uris: ['wear://watch/operation'] });
    expect(fixture.plugin.publish.mock.calls.at(-1)[0].snapshot.receipts).toEqual({ 'watch-a': 1 });
  });
  it('waits for profile initialization before reading the inbox', async () => {
    fixture.exercises._userId = 'previous-user'; renderHook(() => useWearSync(auth)); await advance();
    expect(fixture.plugin.publish.mock.calls.at(-1)[0].snapshot.ready).toBe(false);
    expect(fixture.plugin.getPending).not.toHaveBeenCalled();
  });
});
