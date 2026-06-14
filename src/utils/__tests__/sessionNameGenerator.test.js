import { describe, it, expect } from 'vitest';
import { generateSessionName, generateShareTextFromSession } from '../sessionNameGenerator';

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

  it('selects each time-of-day bucket from the hour', () => {
    const bucketFor = (hour) => generateSessionName(t, {
      date: `2026-06-11T${String(hour).padStart(2, '0')}:00:00`,
      totalReps: 100, exerciseCount: 5,
    }).split('#')[0];
    expect(bucketFor(7)).toContain('.morning');
    expect(bucketFor(12)).toContain('.noon');
    expect(bucketFor(15)).toContain('.afternoon');
    expect(bucketFor(20)).toContain('.evening');
    expect(bucketFor(23)).toContain('.night');
  });

  it('selects each intensity tier from reps / exercise count', () => {
    const intensityFor = (totalReps, exerciseCount) => generateSessionName(t, {
      date: '2026-06-11T12:00:00', totalReps, exerciseCount,
    }).split('.').slice(0, 2).join('.');
    expect(intensityFor(30, 5)).toBe('sessionNames.light');      // <=50 reps
    expect(intensityFor(100, 2)).toBe('sessionNames.light');     // <=2 exercises
    expect(intensityFor(150, 4)).toBe('sessionNames.moderate');  // <=200 & <=5 ex
    expect(intensityFor(400, 6)).toBe('sessionNames.intense');   // <=500
    expect(intensityFor(900, 8)).toBe('sessionNames.epic');      // >500
  });
});

describe('generateShareTextFromSession', () => {
  const session = (reps) => ({ date: '2026-06-11T12:00:00', exercises: reps.map(r => ({ reps: r })) });

  it('uses the global pool in global mode', () => {
    const text = generateShareTextFromSession(t, session([100]), 'global');
    expect(text).toMatch(/^shareTexts\.global#\d$/);
  });

  it('uses the perfectDay pool when isPerfectDay is set', () => {
    const text = generateShareTextFromSession(t, session([100, 100]), 'session', true);
    expect(text).toMatch(/^shareTexts\.perfectDay#\d$/);
  });

  it('derives intensity from the summed reps of the session exercises', () => {
    // >500 reps across >2 exercises → epic (>2 exercises avoids the "light" floor)
    const epic = generateShareTextFromSession(t, session([200, 200, 200]), 'session', false);
    expect(epic).toMatch(/^shareTexts\.epic#\d$/);
    const light = generateShareTextFromSession(t, session([10]), 'session', false);
    expect(light).toMatch(/^shareTexts\.light#\d$/);
  });

  it('handles missing session data without crashing', () => {
    expect(typeof generateShareTextFromSession(t, null)).toBe('string');
    expect(typeof generateShareTextFromSession(t, {})).toBe('string');
  });
});
