import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── In-memory Capacitor Preferences ─────────────────────────────────────
vi.mock('@capacitor/preferences', () => {
  const mem = new Map();
  return {
    Preferences: {
      get: vi.fn(async ({ key }) => ({ value: mem.has(key) ? mem.get(key) : null })),
      set: vi.fn(async ({ key, value }) => { mem.set(key, value); }),
      remove: vi.fn(async ({ key }) => { mem.delete(key); }),
      _mem: mem,
    },
  };
});

// ── Firebase / services mocks ───────────────────────────────────────────
const FIXED_TS = '2026-06-11T12:00:00.000Z';
vi.mock('@services/firebase', () => ({
  serverTimestamp: vi.fn(() => FIXED_TS),
}));
vi.mock('@utils/firebaseTimestamp', () => ({
  serverTimestamp: vi.fn(() => FIXED_TS),
  setServerTimestampFn: vi.fn(),
}));

vi.mock('@services/userDataService', () => ({
  saveAchievementsToCloud: vi.fn(async () => {}),
  loadAchievementsFromCloud: vi.fn(async () => null),
}));

vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    saveToCloud: vi.fn(async () => {}),
    loadFromCloud: vi.fn(async () => null),
    syncData: vi.fn(async () => null),
    listenToCloudChanges: vi.fn(() => () => {}),
    mergeData: vi.fn((local, cloud) => ({
      ...local,
      ...cloud,
      completions: { ...(local.completions || {}), ...(cloud.completions || {}) },
    })),
    loadAchievementsFromCloud: vi.fn(async () => null),
    saveAchievementsToCloud: vi.fn(async () => {}),
  },
}));

import { Preferences } from '@capacitor/preferences';
import { cloudSync } from '@services/cloudSync';
import { useProgressStore } from '../useProgressStore';
import { STORAGE_KEY_BASE } from '@hooks/useProgressStorage';
import { getLocalDateStr } from '@shared/dateUtils';

const currentYear = new Date().getFullYear();
const fixedStart = `${currentYear}-01-01`;
const today = getLocalDateStr(new Date());

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  Preferences._mem.clear();
  localStorage.clear();
  vi.clearAllMocks();
  useProgressStore.getState().reset();
});

// ── initForUser ─────────────────────────────────────────────────────────

describe('initForUser', () => {
  it('starts from the default state when nothing is stored', async () => {
    await useProgressStore.getState().initForUser(null);
    const s = useProgressStore.getState();
    expect(s.isStoreInitialized).toBe(true);
    expect(s.isSetup).toBe(false);
    expect(s.completions).toEqual({});
    expect(s.startDate).toBe(fixedStart);
  });

  it('loads persisted progress for a user', async () => {
    Preferences._mem.set(`${STORAGE_KEY_BASE}_uid1`, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true } } },
    }));
    await useProgressStore.getState().initForUser('uid1');
    const s = useProgressStore.getState();
    expect(s.isSetup).toBe(true);
    expect(s.completions[`${currentYear}-02-01`].pushups.isCompleted).toBe(true);
    expect(s._userId).toBe('uid1');
  });

  it('migrates legacy localStorage data into Preferences', async () => {
    localStorage.setItem(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: {},
    }));
    await useProgressStore.getState().initForUser(null);
    expect(useProgressStore.getState().isSetup).toBe(true);
    expect(Preferences._mem.has(STORAGE_KEY_BASE)).toBe(true);
  });

  it('hydrates achievements from the cloud for signed-in users', async () => {
    cloudSync.loadAchievementsFromCloud.mockResolvedValueOnce({ first_share: true, my_badge: true });
    await useProgressStore.getState().initForUser('uid1');
    await flush();
    const s = useProgressStore.getState();
    expect(s.achievements.my_badge).toBe(true);
    expect(s.hasShared).toBe(true);
    expect(s._achievementsLoaded).toBe(true);
  });

  it('immediately clears achievements and resets to defaults when initialization starts', () => {
    useProgressStore.setState({
      isStoreInitialized: true,
      _userId: 'uid1',
      achievements: { first_share: true, white_hat: true, custom: true },
      hasShared: true,
      completions: { '2026-03-01': { pushups: { isCompleted: true } } }
    });

    const initPromise = useProgressStore.getState().initForUser(null);
    const s = useProgressStore.getState();

    // Verify synchronous cleanup
    expect(s.isStoreInitialized).toBe(false);
    expect(s._userId).toBe(null);
    expect(s.achievements).toEqual({});
    expect(s.hasShared).toBe(false);
    expect(s.completions).toEqual({});

    return initPromise; // keep vitest happy by waiting for completion
  });

  it('guards against race conditions by discarding late-resolving cloud achievements', async () => {
    let resolveCloud;
    const cloudPromise = new Promise((resolve) => {
      resolveCloud = () => resolve({ first_share: true, my_badge: true });
    });
    cloudSync.loadAchievementsFromCloud.mockReturnValueOnce(cloudPromise);

    // 1. Trigger initialization for user 1
    const p1 = useProgressStore.getState().initForUser('uid1');
    await flush(); // let loadFromStorage resolve

    // 2. Trigger logout / initialization for guest before cloud load resolves
    const p2 = useProgressStore.getState().initForUser(null);
    await p2; // wait for guest storage load to complete

    // 3. Resolve the user 1 cloud load
    resolveCloud();
    await p1; // let p1 finish

    // 4. Verify user 1's achievements were discarded and not applied to guest
    const s = useProgressStore.getState();
    expect(s._userId).toBe(null);
    expect(s.achievements.my_badge).toBeUndefined();
    expect(s.achievements.first_share).toBe(false);
  });
});

// ── Day helpers ─────────────────────────────────────────────────────────

describe('day helpers', () => {
  it('isDayDone reflects completions', () => {
    useProgressStore.setState({
      completions: {
        '2026-03-01': { pushups: { isCompleted: true } },
        '2026-03-02': { pushups: { isCompleted: false } },
      },
    });
    const { isDayDone } = useProgressStore.getState();
    expect(isDayDone('2026-03-01')).toBe(true);
    expect(isDayDone('2026-03-02')).toBe(false);
    expect(isDayDone('2026-03-03')).toBe(false);
  });

  it('getDayNumber counts from startDate (day 1 inclusive)', () => {
    useProgressStore.setState({ startDate: '2026-01-01' });
    const { getDayNumber } = useProgressStore.getState();
    expect(getDayNumber('2026-01-01')).toBe(1);
    expect(getDayNumber('2026-01-31')).toBe(31);
    expect(getDayNumber('2026-04-10')).toBe(100);
  });
});

// ── updateExerciseCount ─────────────────────────────────────────────────

describe('updateExerciseCount', () => {
  it('stores the count and marks completion at the goal', () => {
    const { updateExerciseCount } = useProgressStore.getState();
    updateExerciseCount(today, 'pushups', 50, 100);
    expect(useProgressStore.getState().completions[today].pushups).toMatchObject({
      count: 50,
      isCompleted: false,
    });

    updateExerciseCount(today, 'pushups', 100, 100);
    const ex = useProgressStore.getState().completions[today].pushups;
    expect(ex.isCompleted).toBe(true);
    expect(ex.timestamp).toBe(FIXED_TS);
  });

  it('clamps the count between 0 and the daily goal', () => {
    const { updateExerciseCount, getExerciseCount } = useProgressStore.getState();
    updateExerciseCount(today, 'pushups', 999, 100);
    expect(getExerciseCount(today, 'pushups')).toBe(100);
    updateExerciseCount(today, 'pushups', -5, 100);
    expect(getExerciseCount(today, 'pushups')).toBe(0);
  });

  it('stores weight, and locks difficulty only when below the 1.0 max', () => {
    const { updateExerciseCount } = useProgressStore.getState();
    // 1.0 is the max (full reps): no lock needed, left unsaved to keep cloud clean.
    updateExerciseCount(today, 'bench', 10, 100, 42.5, 1.0);
    let ex = useProgressStore.getState().completions[today].bench;
    expect(ex.weight).toBe(42.5);
    expect(ex.difficulty).toBeUndefined();

    // A reduced difficulty is locked onto the day.
    updateExerciseCount(today, 'bench', 20, 100, 42.5, 0.5);
    ex = useProgressStore.getState().completions[today].bench;
    expect(ex.difficulty).toBe(0.5);
  });

  it('preserves the locked difficulty when none is supplied on a later edit', () => {
    const { updateExerciseCount } = useProgressStore.getState();
    updateExerciseCount(today, 'bench', 20, 100, 42.5, 0.5);
    // Subsequent edit without a difficulty must keep the recorded 0.5.
    updateExerciseCount(today, 'bench', 30, 100, 42.5);
    const ex = useProgressStore.getState().completions[today].bench;
    expect(ex.difficulty).toBe(0.5);
  });

  it('flags lastCompletionChange when something changed', () => {
    useProgressStore.setState({ lastCompletionChange: null });
    useProgressStore.getState().updateExerciseCount(today, 'pushups', 10, 100);
    expect(useProgressStore.getState().lastCompletionChange).toBe(FIXED_TS);
  });
});

// ── Guest data (mode invité) ────────────────────────────────────────────

describe('hasGuestData', () => {
  it('is false with no stored data', async () => {
    expect(await useProgressStore.getState().hasGuestData()).toBe(false);
  });

  it('is false when guest data has no completions', async () => {
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify({ startDate: fixedStart, completions: {} }));
    expect(await useProgressStore.getState().hasGuestData()).toBe(false);
  });

  it('is true when guest data has completions (Preferences)', async () => {
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true } } },
    }));
    expect(await useProgressStore.getState().hasGuestData()).toBe(true);
  });

  it('is true when guest data lives in legacy localStorage', async () => {
    localStorage.setItem(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true } } },
    }));
    expect(await useProgressStore.getState().hasGuestData()).toBe(true);
  });

  it('survives corrupted guest JSON', async () => {
    localStorage.setItem(STORAGE_KEY_BASE, '{broken');
    expect(await useProgressStore.getState().hasGuestData()).toBe(false);
  });
});

describe('mergeWithAnonymousData', () => {
  it('fails cleanly when there is no guest data', async () => {
    const result = await useProgressStore.getState().mergeWithAnonymousData();
    expect(result.success).toBe(false);
  });

  it('copies guest days the user does not have', async () => {
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true, count: 30 } } },
    }));
    useProgressStore.setState({ completions: {}, isSetup: false });

    const result = await useProgressStore.getState().mergeWithAnonymousData();
    expect(result.success).toBe(true);
    const s = useProgressStore.getState();
    expect(s.completions[`${currentYear}-02-01`].pushups.count).toBe(30);
    expect(s.isSetup).toBe(true);
  });

  it('resolves day conflicts: completed wins, highest count wins, newest timestamp wins', async () => {
    const day = `${currentYear}-02-01`;
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      completions: {
        [day]: {
          pushups: { isCompleted: true, count: 30, timestamp: '2026-02-01T18:00:00.000Z' },
          squats: { isCompleted: false, count: 5 },
        },
      },
    }));
    useProgressStore.setState({
      completions: {
        [day]: {
          pushups: { isCompleted: false, count: 50, timestamp: '2026-02-01T09:00:00.000Z' },
          dips: { isCompleted: true },
        },
      },
    });

    await useProgressStore.getState().mergeWithAnonymousData();
    const merged = useProgressStore.getState().completions[day];

    // completed (guest) + highest count (user) + newest timestamp (guest)
    expect(merged.pushups).toMatchObject({
      isCompleted: true,
      count: 50,
      timestamp: '2026-02-01T18:00:00.000Z',
    });
    // exercises only on one side are kept
    expect(merged.squats.isCompleted).toBe(false);
    expect(merged.dips.isCompleted).toBe(true);
  });

  it('resolves day conflicts correctly for weight and difficulty', async () => {
    const day = `${currentYear}-02-02`;
    Preferences._mem.set(STORAGE_KEY_BASE, JSON.stringify({
      startDate: fixedStart,
      completions: {
        [day]: {
          bench: { isCompleted: true, count: 10, weight: 60, difficulty: 0.8 },
          pullups: { isCompleted: false, count: 5 } // Guest has no weight/difficulty
        },
      },
    }));
    
    useProgressStore.setState({
      completions: {
        [day]: {
          bench: { isCompleted: false, count: 8 }, // User has no weight/difficulty
          pullups: { isCompleted: true, count: 10, weight: 15, difficulty: 0.5 }, // User has weight/difficulty
          dips: { isCompleted: false, count: 5 }
        },
      },
    });

    await useProgressStore.getState().mergeWithAnonymousData();
    const merged = useProgressStore.getState().completions[day];

    expect(merged.bench.weight).toBe(60); // guest wins because user doesn't have it
    expect(merged.bench.difficulty).toBeCloseTo(0.8);
    
    expect(merged.pullups.weight).toBe(15); // user wins because guest doesn't have it
    expect(merged.pullups.difficulty).toBeCloseTo(0.5);
  });
});

describe('clearAnonymousData', () => {
  it('removes guest data from both storages', async () => {
    Preferences._mem.set(STORAGE_KEY_BASE, '{"completions":{}}');
    localStorage.setItem(STORAGE_KEY_BASE, '{"completions":{}}');
    await useProgressStore.getState().clearAnonymousData();
    expect(Preferences._mem.has(STORAGE_KEY_BASE)).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY_BASE)).toBe(null);
  });
});

// ── Cloud delegation ────────────────────────────────────────────────────

describe('saveToCloud', () => {
  it('sends the current progress payload to the cloud', async () => {
    useProgressStore.setState({ isSetup: true, lastCompletionChange: 'lcc' });
    const result = await useProgressStore.getState().saveToCloud();
    expect(result.success).toBe(true);
    expect(cloudSync.saveToCloud).toHaveBeenCalledWith(expect.objectContaining({
      isSetup: true,
      lastCompletionChange: 'lcc',
    }));
  });

  it('reports failure when the service throws (data stays local)', async () => {
    cloudSync.saveToCloud.mockRejectedValueOnce(new Error('offline'));
    const result = await useProgressStore.getState().saveToCloud();
    expect(result.success).toBe(false);
    expect(result.error).toBe('offline');
    expect(useProgressStore.getState()._isSaving).toBe(false);
  });

  it('refuses concurrent saves', async () => {
    useProgressStore.setState({ _isSaving: true });
    const result = await useProgressStore.getState().saveToCloud();
    expect(result.success).toBe(false);
    expect(cloudSync.saveToCloud).not.toHaveBeenCalled();
  });
});

describe('loadFromCloud', () => {
  it('applies cloud data locally on success', async () => {
    cloudSync.loadFromCloud.mockResolvedValueOnce({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-03-01`]: { pushups: { isCompleted: true } } },
    });
    const result = await useProgressStore.getState().loadFromCloud();
    expect(result.success).toBe(true);
    const s = useProgressStore.getState();
    expect(s.isSetup).toBe(true);
    expect(s.completions[`${currentYear}-03-01`].pushups.isCompleted).toBe(true);
  });

  it('reports failure when the cloud is empty (local data untouched)', async () => {
    useProgressStore.setState({ isSetup: true });
    cloudSync.loadFromCloud.mockResolvedValueOnce(null);
    const result = await useProgressStore.getState().loadFromCloud();
    expect(result.success).toBe(false);
    expect(useProgressStore.getState().isSetup).toBe(true);
  });

  it('reports failure when the service throws', async () => {
    cloudSync.loadFromCloud.mockRejectedValueOnce(new Error('TIMEOUT'));
    const result = await useProgressStore.getState().loadFromCloud();
    expect(result.success).toBe(false);
    expect(result.error).toBe('TIMEOUT');
  });
});

describe('syncWithCloud', () => {
  it('applies the merged result and preserves local achievements', async () => {
    useProgressStore.setState({ achievements: { local_badge: true } });
    cloudSync.syncData.mockResolvedValueOnce({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-03-02`]: { squats: { isCompleted: true } } },
      achievements: { cloud_badge: true },
    });
    const result = await useProgressStore.getState().syncWithCloud();
    expect(result.success).toBe(true);
    const s = useProgressStore.getState();
    expect(s.completions[`${currentYear}-03-02`].squats.isCompleted).toBe(true);
    expect(s.achievements).toEqual({ local_badge: true });
  });

  it('skips applySyncedData if mergedData is null', async () => {
    const applySpy = vi.spyOn(useProgressStore.getState(), 'applySyncedData');
    cloudSync.syncData.mockResolvedValueOnce(null);
    const result = await useProgressStore.getState().syncWithCloud();
    expect(result.success).toBe(true);
    expect(applySpy).not.toHaveBeenCalled();
    applySpy.mockRestore();
  });

  it('reports failure when the service throws', async () => {
    cloudSync.syncData.mockRejectedValueOnce(new Error('network'));
    const result = await useProgressStore.getState().syncWithCloud();
    expect(result.success).toBe(false);
  });
});

describe('applyRealtimeUpdate', () => {
  it('ignores identical incoming data', () => {
    const completions = { [`${currentYear}-03-01`]: { pushups: { isCompleted: true, timestamp: null } } };
    // Note: cardio.sessions must exist, otherwise the change detection always fires
    useProgressStore.setState({ completions, cardio: { sessions: {} } });
    const before = useProgressStore.getState().completions;
    useProgressStore.getState().applyRealtimeUpdate({ startDate: fixedStart, completions });
    expect(cloudSync.mergeData).not.toHaveBeenCalled();
    expect(useProgressStore.getState().completions).toBe(before);
  });

  it('merges genuinely new cloud data', () => {
    useProgressStore.setState({
      completions: { [`${currentYear}-03-01`]: { pushups: { isCompleted: true, timestamp: null } } },
    });
    useProgressStore.getState().applyRealtimeUpdate({
      startDate: fixedStart,
      completions: { [`${currentYear}-03-02`]: { squats: { isCompleted: true } } },
    });
    expect(cloudSync.mergeData).toHaveBeenCalled();
    const s = useProgressStore.getState();
    expect(s.completions[`${currentYear}-03-02`].squats.isCompleted).toBe(true);
  });
});

describe('startCloudListener', () => {
  it('wires the realtime listener and returns its unsubscribe', () => {
    const unsub = useProgressStore.getState().startCloudListener();
    expect(cloudSync.listenToCloudChanges).toHaveBeenCalled();
    expect(typeof unsub).toBe('function');
  });
});

// ── startChallenge ──────────────────────────────────────────────────────

describe('startChallenge', () => {
  it('marks setup and backfills days before today', () => {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    useProgressStore.getState().startChallenge(start, ['pushups']);
    const s = useProgressStore.getState();
    expect(s.isSetup).toBe(true);
    // 3 backfilled days (start → yesterday), today not backfilled
    expect(Object.keys(s.completions)).toHaveLength(3);
    const firstDay = s.completions[getLocalDateStr(start)];
    expect(firstDay.pushups.isCompleted).toBe(true);
    expect(firstDay.squats).toBeUndefined();
  });

  it('without a start date, only marks setup', () => {
    useProgressStore.getState().startChallenge(null);
    const s = useProgressStore.getState();
    expect(s.isSetup).toBe(true);
    expect(s.completions).toEqual({});
  });
});

// ── exercise count helpers ───────────────────────────────────────────────

describe('exercise count helpers', () => {
  it('getExerciseCount / getExerciseDone read per-exercise state', () => {
    const store = useProgressStore.getState();
    store.updateExerciseCount(today, 'pushups', 8, 10);
    expect(useProgressStore.getState().getExerciseCount(today, 'pushups')).toBe(8);
    expect(useProgressStore.getState().getExerciseDone(today, 'pushups')).toBe(false);

    store.updateExerciseCount(today, 'pushups', 10, 10);
    expect(useProgressStore.getState().getExerciseDone(today, 'pushups')).toBe(true);
  });

  it('default to 0 / false for an untouched day', () => {
    const store = useProgressStore.getState();
    expect(store.getExerciseCount('1999-01-01', 'pushups')).toBe(0);
    expect(store.getExerciseDone('1999-01-01', 'pushups')).toBe(false);
  });
});

// ── toggleCompletion ─────────────────────────────────────────────────────

describe('toggleCompletion', () => {
  it('marks every standard exercise done, then clears them on a second toggle', () => {
    const store = useProgressStore.getState();
    store.toggleCompletion(today);
    let day = useProgressStore.getState().completions[today];
    expect(Object.values(day).every(ex => ex.isCompleted)).toBe(true);
    expect(useProgressStore.getState().isDayDone(today)).toBe(true);

    store.toggleCompletion(today);
    day = useProgressStore.getState().completions[today];
    expect(Object.values(day).every(ex => ex.isCompleted === false)).toBe(true);
    expect(useProgressStore.getState().isDayDone(today)).toBe(false);
  });
});

// ── getTotalReps ─────────────────────────────────────────────────────────

describe('getTotalReps', () => {
  it('sums the daily goal of completed days from the start date', () => {
    const store = useProgressStore.getState();
    // Day 1 (Jan 1) → pushups goal 1, Day 11 (Jan 11) → goal 11
    store.toggleCompletion(fixedStart);
    store.toggleCompletion(`${currentYear}-01-11`);
    expect(useProgressStore.getState().getTotalReps('pushups', 1.0)).toBe(1 + 11);
  });

  it('applies the difficulty multiplier', () => {
    const store = useProgressStore.getState();
    store.toggleCompletion(`${currentYear}-01-11`); // day 11
    expect(useProgressStore.getState().getTotalReps('pushups', 2.0)).toBe(22);
  });

  it('returns 0 for an unknown exercise', () => {
    expect(useProgressStore.getState().getTotalReps('not_real')).toBe(0);
  });
});

// ── deleteExerciseHistory ────────────────────────────────────────────────

describe('deleteExerciseHistory', () => {
  it('removes one exercise across every day, leaving the others intact', () => {
    const store = useProgressStore.getState();
    store.updateExerciseCount(today, 'pushups', 10, 10);
    store.updateExerciseCount(today, 'squats', 10, 10);
    store.updateExerciseCount('2026-01-05', 'pushups', 10, 10);

    store.deleteExerciseHistory('pushups');
    const s = useProgressStore.getState();
    expect(s.completions[today].pushups).toBeUndefined();
    expect(s.completions[today].squats).toBeDefined();
    expect(s.completions['2026-01-05'].pushups).toBeUndefined();
  });
});

// ── updateCardioSessions ─────────────────────────────────────────────────

describe('updateCardioSessions', () => {
  it('normalises an array of sessions into a keyed map', () => {
    useProgressStore.getState().updateCardioSessions([
      { id: 'a', distance: 1000 },
      { id: 'b', distance: 2000 },
    ]);
    expect(useProgressStore.getState().cardio.sessions).toEqual({
      a: { id: 'a', distance: 1000 },
      b: { id: 'b', distance: 2000 },
    });
  });

  it('accepts an already-keyed object', () => {
    useProgressStore.getState().updateCardioSessions({ x: { id: 'x', distance: 500 } });
    expect(useProgressStore.getState().cardio.sessions.x.distance).toBe(500);
  });
});

// ── applyCloudData / applySyncedData ─────────────────────────────────────

describe('applyCloudData', () => {
  it('validates and replaces local state from a cloud snapshot', () => {
    useProgressStore.getState().applyCloudData({
      startDate: fixedStart,
      completions: { [today]: { pushups: { isCompleted: true, count: 5 } } },
      isSetup: true,
    });
    const s = useProgressStore.getState();
    expect(s.isSetup).toBe(true);
    expect(s.completions[today].pushups.isCompleted).toBe(true);
  });

  it('ignores a null payload', () => {
    const before = useProgressStore.getState().completions;
    useProgressStore.getState().applyCloudData(null);
    expect(useProgressStore.getState().completions).toBe(before);
  });
});

describe('applySyncedData', () => {
  it('applies merged data but keeps local achievements', () => {
    useProgressStore.getState().validateBadge('first_blood');
    useProgressStore.getState().applySyncedData({
      startDate: fixedStart,
      completions: { [today]: { squats: { isCompleted: true } } },
      isSetup: true,
    });
    const s = useProgressStore.getState();
    expect(s.completions[today].squats.isCompleted).toBe(true);
    expect(s.achievements.first_blood).toBe(true);
  });
});

// ── achievement setters ──────────────────────────────────────────────────

describe('achievement setters', () => {
  it('setHasShared flips first_share and hasShared, and pushes to cloud when signed in', async () => {
    await useProgressStore.getState().initForUser('uid1');
    await flush();
    vi.clearAllMocks();
    useProgressStore.getState().setHasShared();
    const s = useProgressStore.getState();
    expect(s.hasShared).toBe(true);
    expect(s.achievements.first_share).toBe(true);
    expect(cloudSync.saveAchievementsToCloud).toHaveBeenCalled();
  });

  it('validateBadge and invalidateBadge set the boolean value', () => {
    useProgressStore.getState().validateBadge('ghost');
    expect(useProgressStore.getState().achievements.ghost).toBe(true);
    useProgressStore.getState().invalidateBadge('ghost');
    expect(useProgressStore.getState().achievements.ghost).toBe(false);
  });

  it('setManualBadge stores an arbitrary value', () => {
    useProgressStore.getState().setManualBadge('beast', true);
    expect(useProgressStore.getState().achievements.beast).toBe(true);
  });
});

// ── Error handling / edge cases ─────────────────────────────────────────

describe('error handling / edge cases', () => {
  it('initForUser -> loadFromStorage handles Preferences.get error', async () => {
    Preferences.get.mockRejectedValueOnce(new Error('PrefError'));
    await useProgressStore.getState().initForUser(null);
    expect(useProgressStore.getState().isStoreInitialized).toBe(true);
  });

  it('_persist -> saveToStorage handles Preferences.set error', async () => {
    Preferences.set.mockRejectedValueOnce(new Error('SetError'));
    useProgressStore.getState()._persist();
    await flush(); // Should not throw
  });

  it('initForUser handles loadAchievementsFromCloud error and unblocks', async () => {
    cloudSync.loadAchievementsFromCloud.mockRejectedValueOnce(new Error('AchError'));
    await useProgressStore.getState().initForUser('uid2');
    await flush();
    expect(useProgressStore.getState()._achievementsLoaded).toBe(true);
  });

  it('mergeWithAnonymousData handles Preferences.get error', async () => {
    Preferences.get.mockRejectedValueOnce(new Error('MergePrefError'));
    const res = await useProgressStore.getState().mergeWithAnonymousData();
    expect(res.success).toBe(false);
  });

  it('clearAnonymousData handles Preferences.remove error', async () => {
    Preferences.remove.mockRejectedValueOnce(new Error('RemovePrefError'));
    await useProgressStore.getState().clearAnonymousData();
    await flush(); // Should not throw
  });

  it('startCloudListener callback applyRealtimeUpdate gets called', () => {
    cloudSync.listenToCloudChanges.mockImplementationOnce((cb) => {
        cb({ startDate: '2026-01-01', completions: {} });
        return () => {};
    });
    useProgressStore.getState().startCloudListener();
    expect(useProgressStore.getState().startDate).toBe('2026-01-01');
  });
});

