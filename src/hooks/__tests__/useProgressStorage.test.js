import { describe, it, expect } from 'vitest';
import { getDefaultState, validateProgressData, parseProgressData } from '../useProgressStorage';

const currentYear = new Date().getFullYear();
const fixedStart = `${currentYear}-01-01`;

// ── getDefaultState ─────────────────────────────────────────────────────

describe('getDefaultState', () => {
  it('starts on January 1st of the current year, not set up', () => {
    const state = getDefaultState();
    expect(state.startDate).toBe(fixedStart);
    expect(state.userStartDate).toBe(fixedStart);
    expect(state.isSetup).toBe(false);
    expect(state.completions).toEqual({});
    expect(state.achievements).toEqual({});
  });
});

// ── validateProgressData ────────────────────────────────────────────────

describe('validateProgressData', () => {
  it('rejects non-objects', () => {
    expect(validateProgressData(null)).toBe(null);
    expect(validateProgressData('string')).toBe(null);
    expect(validateProgressData(42)).toBe(null);
  });

  it('sanitizes a minimal valid payload', () => {
    const out = validateProgressData({ startDate: '2026-01-01', isSetup: true });
    expect(out.startDate).toBe('2026-01-01');
    expect(out.isSetup).toBe(true);
    expect(out.completions).toEqual({});
  });

  it('falls back when fields have wrong types', () => {
    const out = validateProgressData({ startDate: 123, isSetup: 'yes', completions: [] });
    expect(out.startDate).toBe(fixedStart);
    expect(out.isSetup).toBe(false);
    expect(out.completions).toEqual({});
  });

  it('migrates legacy flat day entries to per-exercise structure', () => {
    const out = validateProgressData({
      startDate: fixedStart,
      completions: {
        '2026-03-01': { done: true, pushupCount: 50, timestamp: 'ts' },
      },
    });
    expect(out.completions['2026-03-01'].pushups).toMatchObject({
      isCompleted: true,
      count: 50,
      timestamp: 'ts',
    });
  });

  it('normalizes modern entries that still use the old "done" flag', () => {
    const out = validateProgressData({
      startDate: fixedStart,
      completions: {
        '2026-03-02': { squats: { done: true, count: 10 } },
      },
    });
    expect(out.completions['2026-03-02'].squats).toMatchObject({
      isCompleted: true,
      count: 10,
    });
  });

  it('keeps isCompleted entries untouched', () => {
    const out = validateProgressData({
      startDate: fixedStart,
      completions: {
        '2026-03-03': { pushups: { isCompleted: true, count: 80, weight: 12 } },
      },
    });
    expect(out.completions['2026-03-03'].pushups).toMatchObject({
      isCompleted: true,
      count: 80,
      weight: 12,
    });
  });

  it('merges legacy manualBadges into achievements', () => {
    const out = validateProgressData({
      startDate: fixedStart,
      achievements: { real_badge: true },
      manualBadges: { manual_badge: true },
    });
    expect(out.achievements).toMatchObject({ real_badge: true, manual_badge: true });
  });

  it('converts legacy hasShared flag into the first_share achievement', () => {
    const out = validateProgressData({ startDate: fixedStart, hasShared: true });
    expect(out.achievements.first_share).toBe(true);
  });
});

// ── parseProgressData ───────────────────────────────────────────────────

describe('parseProgressData', () => {
  it('passes through data from the current challenge year', () => {
    const out = parseProgressData({
      startDate: fixedStart,
      isSetup: true,
      completions: { [`${currentYear}-02-01`]: { pushups: { isCompleted: true } } },
      lastCompletionChange: 'lcc',
    });
    expect(out.isSetup).toBe(true);
    expect(out.lastCompletionChange).toBe('lcc');
    expect(Object.keys(out.completions)).toHaveLength(1);
  });

  it('resets progress from a previous year but keeps achievements', () => {
    const out = parseProgressData({
      startDate: `${currentYear - 1}-01-01`,
      isSetup: true,
      completions: { [`${currentYear - 1}-05-01`]: { pushups: { isCompleted: true } } },
      achievements: { veteran: true },
      lastCompletionChange: 'lcc',
    });
    expect(out.startDate).toBe(fixedStart);
    expect(out.isSetup).toBe(false);
    expect(out.completions).toEqual({});
    expect(out.achievements).toMatchObject({ veteran: true });
    expect(out.lastCompletionChange).toBe('lcc');
  });

  it('returns null for invalid input', () => {
    expect(parseProgressData(null)).toBe(null);
  });
});
