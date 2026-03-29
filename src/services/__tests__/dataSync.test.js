import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/database — we only need ref/set/get/onValue/serverTimestamp to be callable
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  set: vi.fn(),
  get: vi.fn(),
  onValue: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

// Mock ./firebase — provide fake auth and database instances
vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'test-uid' } })),
  getDatabaseInstance: vi.fn(() => ({})),
  initializeFirebase: vi.fn(),
}));

// Now we can import directly — the mocked Firebase won't blow up
import { mergeData, sanitizeForCloud, saveToCloud, loadFromCloud } from '../dataSyncService';

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

  it('includes lastSyncedAt in result', () => {
    const local = { startDate: '2025-01-01', completions: {} };
    const cloud = { startDate: '2025-01-01', completions: {} };
    const merged = mergeData(local, cloud);
    expect(merged.lastSyncedAt).toBeDefined();
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

  it('strips count from completions, keeps isCompleted/timestamp/timeOfDay', () => {
    const data = {
      startDate: '2025-01-01',
      completions: {
        '2025-01-01': {
          pushups: { isCompleted: true, timestamp: '2025-01-01T10:00:00Z', timeOfDay: 'morning', count: 20 },
          squats: { isCompleted: false, count: 10 }
        }
      }
    };
    const sanitized = sanitizeForCloud(data);
    expect(sanitized.completions['2025-01-01'].pushups).toEqual({
      isCompleted: true, timestamp: '2025-01-01T10:00:00Z', timeOfDay: 'morning'
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
