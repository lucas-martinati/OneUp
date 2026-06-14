import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/database — we only need these to be callable
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

// Mock ./firebase — provide fake auth and database instances
vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'test-uid' } })),
  getDatabaseInstance: vi.fn(() => ({})),
  initializeFirebase: vi.fn(),
}));

// syncData fires session-history sync as a side effect — keep it inert
vi.mock('../../features/share/services/sessionHistoryService', () => ({
  syncSessionHistory: vi.fn(() => Promise.resolve()),
}));

import { get, update } from 'firebase/database';
import { mergeData, sanitizeForCloud, saveToCloud, loadFromCloud, syncData } from '../dataSyncService';

const snapshot = (val) => ({ exists: () => val != null, val: () => val });

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue();
});

// ── mergeData ───────────────────────────────────────────────────────────

describe('mergeData', () => {
  it('returns localData when cloudData is null', () => {
    const local = { startDate: '2025-01-01', completions: {} };
    expect(mergeData(local, null)).toBe(local);
  });

  it('returns cloudData when localData is null', () => {
    const cloud = { startDate: '2025-01-01', completions: {} };
    expect(mergeData(null, cloud)).toBe(cloud);
  });

  it('merges cloud-only dates into local', () => {
    const local = { startDate: '2025-01-01', completions: { '2025-01-01': { pushups: { isCompleted: true } } } };
    const cloud = { startDate: '2025-01-01', completions: { '2025-01-02': { pushups: { isCompleted: true } } } };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01']).toBeDefined();
    expect(merged.completions['2025-01-02']).toBeDefined();
  });

  it('prefers more recent timestamp when both local and cloud have same date', () => {
    const local = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true, timestamp: '2025-01-01T10:00:00Z', count: 20 } } }
    };
    const cloud = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true, timestamp: '2025-01-01T12:00:00Z' } } }
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].pushups.timestamp).toBe('2025-01-01T12:00:00Z');
  });

  it('prefers cloud when it has timestamp but local does not', () => {
    const local = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true } } }
    };
    const cloud = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true, timestamp: '2025-01-01T12:00:00Z' } } }
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].pushups.timestamp).toBe('2025-01-01T12:00:00Z');
  });

  it('merges different exercises on same date', () => {
    const local = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true } } }
    };
    const cloud = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { squats: { isCompleted: true } } }
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].pushups).toBeDefined();
    expect(merged.completions['2025-01-01'].squats).toBeDefined();
  });

  it('includes lastCompletionChange in result', () => {
    const local = { startDate: '2025-01-01', completions: {}, lastCompletionChange: '2025-01-01T10:00:00Z' };
    const cloud = { startDate: '2025-01-01', completions: {}, lastCompletionChange: '2025-01-01T12:00:00Z' };
    const merged = mergeData(local, cloud);
    expect(merged.lastCompletionChange).toBe('2025-01-01T12:00:00Z');
  });

  it('falls back to local startDate when cloud has none', () => {
    const local = { startDate: '2025-01-01', completions: {} };
    const cloud = { completions: {} };
    const merged = mergeData(local, cloud);
    expect(merged.startDate).toBe('2025-01-01');
  });

  it('merges isSetup flags with OR logic', () => {
    const local = { isSetup: false, completions: {} };
    const cloud = { isSetup: true, completions: {} };
    const merged = mergeData(local, cloud);
    expect(merged.isSetup).toBe(true);
  });

  it('preserves local in-progress count when overwriting with a newer cloud snapshot', () => {
    // Reproduces the "today's reps drop to 0" bug: a confirming serverTimestamp
    // echo makes cloud look newer, triggering the overwrite branch. Cloud never
    // stores `count`, so without re-attachment the in-progress reps are wiped.
    const local = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T12:00:00Z',
      completions: { '2025-01-01': { pushups: { isCompleted: false, count: 15, timestamp: '2025-01-01T12:00:00Z' } } },
    };
    const cloud = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T12:00:01Z', // server-confirmed, slightly later
      completions: { '2025-01-01': { pushups: { isCompleted: false, timestamp: '2025-01-01T12:00:01Z' } } },
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].pushups.count).toBe(15);
  });

  it('does not resurrect a stale count when cloud completion state changed', () => {
    const local = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T12:00:00Z',
      completions: { '2025-01-01': { pushups: { isCompleted: false, count: 15 } } },
    };
    const cloud = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T12:00:01Z',
      completions: { '2025-01-01': { pushups: { isCompleted: true } } }, // completed elsewhere
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].pushups.isCompleted).toBe(true);
    expect(merged.completions['2025-01-01'].pushups.count).toBeUndefined();
  });
});

// ── mergeData: "cloud is newer" overwrite branch ────────────────────────

describe('mergeData — lastCompletionChange arbitration', () => {
  it('overwrites local with cloud when cloud LCC is strictly newer and local is not a pending write', () => {
    const local = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T10:00:00Z',
      completions: { '2025-01-01': { pushups: { isCompleted: false } }, '2025-01-02': { squats: { isCompleted: true } } },
    };
    const cloud = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-02T10:00:00Z', // newer → cloud is ground truth
      completions: { '2025-01-01': { pushups: { isCompleted: true } } },
    };
    const merged = mergeData(local, cloud);
    // Cloud wins wholesale: the local-only 2025-01-02 day is dropped
    expect(merged.completions['2025-01-01'].pushups.isCompleted).toBe(true);
    expect(merged.completions['2025-01-02']).toBeUndefined();
  });

  it('does NOT let cloud overwrite while local holds a pending placeholder write', () => {
    const local = {
      startDate: '2025-01-01',
      lastCompletionChange: { '.sv': 'timestamp' }, // unsynced local edit
      completions: { '2025-01-02': { squats: { isCompleted: true } } },
    };
    const cloud = {
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-02T10:00:00Z',
      completions: { '2025-01-01': { pushups: { isCompleted: true } } },
    };
    const merged = mergeData(local, cloud);
    // Local pending day survives, cloud day is merged in (not an overwrite)
    expect(merged.completions['2025-01-02'].squats.isCompleted).toBe(true);
    expect(merged.completions['2025-01-01'].pushups.isCompleted).toBe(true);
  });

  it('preserves a local-only exercise added offline on a shared day', () => {
    const local = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true }, squats: { isCompleted: true, count: 3 } } },
    };
    const cloud = {
      startDate: '2025-01-01',
      completions: { '2025-01-01': { pushups: { isCompleted: true, timestamp: '2025-01-01T11:00:00Z' } } },
    };
    const merged = mergeData(local, cloud);
    expect(merged.completions['2025-01-01'].squats).toEqual({ isCompleted: true, count: 3 });
  });

  it('unions cardio sessions from both sides', () => {
    const local = { startDate: '2025-01-01', completions: {}, cardio: { sessions: { a: { id: 'a' } } } };
    const cloud = { startDate: '2025-01-01', completions: {}, cardio: { sessions: { b: { id: 'b' } } } };
    const merged = mergeData(local, cloud);
    expect(Object.keys(merged.cardio.sessions).sort()).toEqual(['a', 'b']);
  });
});

// ── saveToCloud ──────────────────────────────────────────────────────────

describe('saveToCloud', () => {
  it('writes sanitized completions plus a lastCompletionChange', async () => {
    const ok = await saveToCloud({
      startDate: '2025-01-01',
      isSetup: true,
      completions: { '2025-01-01': { pushups: { isCompleted: true, count: 20 } } },
      lastCompletionChange: '2025-01-01T10:00:00Z',
    });
    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][1];
    // count is stripped, the day survives, LCC is carried through
    expect(payload.completions['2025-01-01'].pushups.count).toBeUndefined();
    expect(payload.completions['2025-01-01'].pushups.isCompleted).toBe(true);
    expect(payload.lastCompletionChange).toBe('2025-01-01T10:00:00Z');
  });

  it('falls back to a server timestamp when no LCC is provided', async () => {
    await saveToCloud({ isSetup: true, completions: { '2025-01-01': { pushups: { isCompleted: true } } } });
    expect(update.mock.calls[0][1].lastCompletionChange).toBe('SERVER_TIMESTAMP');
  });

  it('refuses to overwrite the cloud with empty completions and no setup (anti-wipe safeguard)', async () => {
    const result = await saveToCloud({ isSetup: false, completions: {} });
    expect(result).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it('still saves an empty-but-set-up account (legit fresh setup)', async () => {
    const result = await saveToCloud({ isSetup: true, completions: {} });
    expect(result).toBe(true);
    expect(update).toHaveBeenCalled();
  });
});

// ── loadFromCloud ────────────────────────────────────────────────────────

describe('loadFromCloud', () => {
  it('returns the snapshot value when it exists', async () => {
    get.mockResolvedValueOnce(snapshot({ startDate: '2025-01-01', completions: {} }));
    const data = await loadFromCloud();
    expect(data).toEqual({ startDate: '2025-01-01', completions: {} });
  });

  it('returns null when there is no cloud data', async () => {
    get.mockResolvedValueOnce(snapshot(null));
    expect(await loadFromCloud()).toBeNull();
  });
});

// ── syncData ─────────────────────────────────────────────────────────────

describe('syncData', () => {
  it('merges local with cloud and writes the result back', async () => {
    get.mockResolvedValueOnce(snapshot({
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T08:00:00Z',
      completions: { '2025-01-02': { squats: { isCompleted: true } } },
    }));
    const merged = await syncData({
      startDate: '2025-01-01',
      lastCompletionChange: '2025-01-01T10:00:00Z', // local newer → genuine merge, not overwrite
      completions: { '2025-01-01': { pushups: { isCompleted: true } } },
    });
    // both days present in the merged result and persisted
    expect(merged.completions['2025-01-01']).toBeDefined();
    expect(merged.completions['2025-01-02']).toBeDefined();
    expect(update).toHaveBeenCalledTimes(1);
  });
});

// ── sanitizeForCloud ────────────────────────────────────────────────────

describe('sanitizeForCloud', () => {
  it('returns data unchanged when completions is missing', () => {
    const data = { startDate: '2025-01-01' };
    expect(sanitizeForCloud(data)).toBe(data);
  });

  it('returns null when data is null', () => {
    expect(sanitizeForCloud(null)).toBeNull();
  });

  it('strips count from completions, keeps isCompleted/timestamp', () => {
    const data = {
      startDate: '2025-01-01',
      completions: {
        '2025-01-01': {
          pushups: { isCompleted: true, timestamp: '2025-01-01T10:00:00Z', count: 20 },
          squats: { isCompleted: false, count: 10 }
        }
      }
    };
    const sanitized = sanitizeForCloud(data);
    expect(sanitized.completions['2025-01-01'].pushups).toEqual({
      isCompleted: true, timestamp: '2025-01-01T10:00:00Z'
    });
    expect(sanitized.completions['2025-01-01'].pushups.count).toBeUndefined();
    expect(sanitized.completions['2025-01-01'].squats.count).toBeUndefined();
  });

  it('skips null exercise entries', () => {
    const data = {
      startDate: '2025-01-01',
      completions: {
        '2025-01-01': { pushups: null, squats: { isCompleted: true } }
      }
    };
    const sanitized = sanitizeForCloud(data);
    expect(sanitized.completions['2025-01-01'].pushups).toBeUndefined();
    expect(sanitized.completions['2025-01-01'].squats).toBeDefined();
  });

  it('skips non-object day entries', () => {
    const data = {
      startDate: '2025-01-01',
      completions: {
        '2025-01-01': { pushups: { isCompleted: true } },
        '2025-01-02': null
      }
    };
    const sanitized = sanitizeForCloud(data);
    expect(sanitized.completions['2025-01-02']).toBeUndefined();
  });

  it('preserves non-completion fields at top level', () => {
    const data = { startDate: '2025-01-01', userStartDate: '2025-01-01', completions: {}, isSetup: true };
    const sanitized = sanitizeForCloud(data);
    expect(sanitized.startDate).toBe('2025-01-01');
    expect(sanitized.userStartDate).toBe('2025-01-01');
    expect(sanitized.isSetup).toBe(true);
  });
});
