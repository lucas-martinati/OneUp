import { describe, it, expect } from 'vitest';
import { generateSessionName } from '../sessionNameGenerator';

// i18next stub: array pools resolve to "<key>#<index>" entries
const t = (key, opts) => {
  if (opts?.returnObjects) return [`${key}#0`, `${key}#1`, `${key}#2`];
  return key;
};

describe('generateSessionName', () => {
  it('picks from the perfectDay pool on a perfect day', () => {
    const name = generateSessionName(t, {
      date: '2026-06-11T10:00:00',
      totalReps: 100,
      exerciseCount: 5,
      isPerfectDay: true,
    });
    expect(name).toMatch(/^sessionNames\.perfectDay#\d$/);
  });

  it('picks from an intensity/time-of-day pool otherwise', () => {
    const name = generateSessionName(t, {
      date: '2026-06-11T10:00:00',
      totalReps: 100,
      exerciseCount: 5,
      isPerfectDay: false,
    });
    expect(name).toMatch(/^sessionNames\.\w+\.\w+#\d$/);
    expect(name).not.toContain('perfectDay');
  });

  it('is deterministic for identical inputs', () => {
    const params = { date: '2026-06-11T18:30:00', totalReps: 250, exerciseCount: 4 };
    expect(generateSessionName(t, params)).toBe(generateSessionName(t, params));
  });

  it('varies with the seed (date/reps)', () => {
    const names = new Set();
    for (let day = 1; day <= 15; day++) {
      names.add(generateSessionName(t, {
        date: `2026-06-${String(day).padStart(2, '0')}T10:00:00`,
        totalReps: day * 13,
        exerciseCount: 3,
      }));
    }
    // With 15 different seeds we expect more than one distinct name
    expect(names.size).toBeGreaterThan(1);
  });

  it('accepts a Date object and missing fields without crashing', () => {
    expect(() => generateSessionName(t, { date: new Date() })).not.toThrow();
    expect(typeof generateSessionName(t, {})).toBe('string');
  });

  it('falls back to the plain key when the pool is not an array', () => {
    const flatT = (key) => key; // never returns arrays
    const name = generateSessionName(flatT, { date: '2026-06-11T10:00:00', isPerfectDay: true });
    expect(name).toBe('sessionNames.perfectDay');
  });
});
