import { describe, it, expect, vi } from 'vitest';

vi.mock('../logger', () => ({
  createLogger: () => ({ info() {}, debug() {}, warn() {}, error() {} }),
}));

import { sanitizeForCloud, mergeData } from '../syncUtils';

// ── sanitizeForCloud ────────────────────────────────────────────────────

describe('sanitizeForCloud', () => {
  it('returns the input untouched when there is nothing to sanitize', () => {
    expect(sanitizeForCloud(null)).toBe(null);
    const noCompletions = { startDate: '2026-01-01' };
    expect(sanitizeForCloud(noCompletions)).toBe(noCompletions);
  });

  it('normalizes exercise entries and defaults missing fields', () => {
    const out = sanitizeForCloud({
      completions: { '2026-01-01': { push: { isCompleted: true, timestamp: 123 } } },
    });
    expect(out.completions['2026-01-01'].push).toEqual({ isCompleted: true, timestamp: 123 });
  });

  it('defaults isCompleted to false and timestamp to null', () => {
    const out = sanitizeForCloud({ completions: { d: { push: {} } } });
    expect(out.completions.d.push).toEqual({ isCompleted: false, timestamp: null });
  });

  it('keeps weight and difficulty only when defined', () => {
    const out = sanitizeForCloud({
      completions: { d: { bench: { isCompleted: true, weight: 40, difficulty: 0.8 } } },
    });
    expect(out.completions.d.bench).toMatchObject({ weight: 40, difficulty: 0.8 });
  });

  it('skips non-object day entries and non-object exercise entries', () => {
    const out = sanitizeForCloud({
      completions: { bad: 'oops', d: { ghost: null, push: { isCompleted: true } } },
    });
    expect(out.completions.bad).toBeUndefined();
    expect(out.completions.d.ghost).toBeUndefined();
    expect(out.completions.d.push.isCompleted).toBe(true);
  });

  it('strips achievements, hasShared and cardio from the payload', () => {
    const out = sanitizeForCloud({
      completions: {},
      achievements: ['a'],
      hasShared: true,
      cardio: { sessions: { s1: { id: 's1' } } },
      startDate: '2026-01-01',
    });
    expect(out.achievements).toBeUndefined();
    expect(out.hasShared).toBeUndefined();
    // cardio lives in users/{uid}/cardioSessions — never written under progress.
    expect(out.cardio).toBeUndefined();
    expect(out.startDate).toBe('2026-01-01');
  });
});

// ── mergeData ───────────────────────────────────────────────────────────

describe('mergeData', () => {
  it('returns the other side when one is missing', () => {
    const local = { completions: {} };
    const cloud = { completions: {} };
    expect(mergeData(local, null)).toBe(local);
    expect(mergeData(null, cloud)).toBe(cloud);
  });

  it('overwrites local with cloud when cloud is strictly newer', () => {
    const local = { startDate: 'L', completions: { d: { push: { isCompleted: true, count: 5 } } }, lastCompletionChange: 1000 };
    const cloud = {
      startDate: 'C', userStartDate: 'CU', isSetup: true,
      completions: { d: { push: { isCompleted: true } } }, // no count
      lastCompletionChange: 2000,
      cardio: { sessions: { s1: { id: 's1' } } },
    };
    const out = mergeData(local, cloud);
    expect(out.startDate).toBe('C');
    expect(out.isSetup).toBe(true);
    // reattachLocalCounts: local count is re-attached when cloud lacks it and isCompleted matches
    expect(out.completions.d.push.count).toBe(5);
    expect(out.cardio.sessions.s1).toEqual({ id: 's1' });
  });

  it('defaults cardio to an empty sessions map when cloud has none (overwrite path)', () => {
    const local = { completions: {}, lastCompletionChange: 1 };
    const cloud = { startDate: 'C', completions: {}, lastCompletionChange: 2 };
    expect(mergeData(local, cloud).cardio).toEqual({ sessions: {} });
  });

  it('does NOT overwrite when local has a pending placeholder, even if cloud ts looks newer', () => {
    const local = {
      startDate: 'L', isSetup: true,
      completions: { d: { push: { isCompleted: true, timestamp: 5 } } },
      lastCompletionChange: { '.sv': 'timestamp' }, // placeholder → ts 0
    };
    const cloud = {
      startDate: 'C',
      completions: { d: { push: { isCompleted: true, timestamp: 5 } } },
      lastCompletionChange: 2000,
    };
    const out = mergeData(local, cloud);
    // Took the merge path (kept local startDate), not the overwrite path.
    expect(out.startDate).toBe('L');
    // finalLCC: placeholder local + real cloud → cloud wins
    expect(out.lastCompletionChange).toBe(2000);
  });

  it('adds cloud-only days during a merge', () => {
    const local = { startDate: 'L', completions: {}, lastCompletionChange: 1000 };
    const cloud = { completions: { d2: { push: { isCompleted: true } } }, lastCompletionChange: 1000 };
    const out = mergeData(local, cloud);
    expect(out.completions.d2.push.isCompleted).toBe(true);
  });

  it('merges exercises within a shared day with the right precedence', () => {
    const local = {
      startDate: 'L',
      completions: {
        d: {
          older: { isCompleted: true, timestamp: 1000 },       // cloud newer → replaced
          noTs: { isCompleted: false },                         // local has no ts → cloud wins
          localOnly: { isCompleted: true, timestamp: 500 },     // preserved (not in cloud)
        },
      },
      lastCompletionChange: 1000,
    };
    const cloud = {
      completions: {
        d: {
          older: { isCompleted: true, timestamp: 9999 },
          noTs: { isCompleted: true, timestamp: 800 },
          cloudOnly: { isCompleted: true, timestamp: 700 },     // added (!localEx)
        },
      },
      lastCompletionChange: 1000,
    };
    const out = mergeData(local, cloud).completions.d;
    expect(out.older.timestamp).toBe(9999);     // cloudIsNewer
    expect(out.noTs.timestamp).toBe(800);       // localHasNoTimestamp
    expect(out.localOnly.timestamp).toBe(500);  // preserved local-only
    expect(out.cloudOnly.timestamp).toBe(700);  // cloud-only added
  });

  it('replaces a local placeholder timestamp with the matching cloud value', () => {
    const local = {
      startDate: 'L',
      completions: { d: { push: { isCompleted: true, timestamp: { '.sv': 'timestamp' } } } },
      lastCompletionChange: 1000,
    };
    const cloud = {
      completions: { d: { push: { isCompleted: true, timestamp: 4242 } } },
      lastCompletionChange: 1000,
    };
    const out = mergeData(local, cloud);
    expect(out.completions.d.push.timestamp).toBe(4242); // cloudReplacesPlaceholder
  });

  it('merges cardio sessions from both sides', () => {
    const local = { startDate: 'L', completions: {}, lastCompletionChange: 1000, cardio: { sessions: { a: { id: 'a' } } } };
    const cloud = { completions: {}, lastCompletionChange: 1000, cardio: { sessions: { b: { id: 'b' } } } };
    const out = mergeData(local, cloud);
    expect(Object.keys(out.completions)).toEqual([]);
    expect(out.cardio.sessions).toEqual({ a: { id: 'a' }, b: { id: 'b' } });
  });

  it('keeps the local lastCompletionChange when it is not older than the cloud', () => {
    const local = { startDate: 'L', completions: {}, lastCompletionChange: 5000 };
    const cloud = { completions: {}, lastCompletionChange: 1000 };
    expect(mergeData(local, cloud).lastCompletionChange).toBe(5000);
  });
});
