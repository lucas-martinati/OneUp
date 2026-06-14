import { describe, it, expect } from 'vitest';
import {
  getLocalDateStr,
  calculateStreak,
  calculateExerciseStreak,
  calculateMaxStreak,
  isDayDoneFromCompletions,
  formatTime,
  formatDuration,
  getCurrentWeekNumber,
  getWeekBounds,
  parseTimestamp,
  MAX_STREAK_WINDOW,
} from '../dateUtils';

// ── Helpers ─────────────────────────────────────────────────────────────

function makeCompletions(dayEntries) {
  // dayEntries: [['2025-01-01', { pushups: { isCompleted: true } }], ...]
  const completions = {};
  for (const [date, exercises] of dayEntries) {
    completions[date] = exercises;
  }
  return completions;
}

// ── MAX_STREAK_WINDOW ───────────────────────────────────────────────────

describe('MAX_STREAK_WINDOW', () => {
  it('is 365', () => {
    expect(MAX_STREAK_WINDOW).toBe(365);
  });
});

// ── getLocalDateStr ─────────────────────────────────────────────────────

describe('getLocalDateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(getLocalDateStr(new Date(2025, 0, 1))).toBe('2025-01-01');
    expect(getLocalDateStr(new Date(2025, 11, 31))).toBe('2025-12-31');
    expect(getLocalDateStr(new Date(2024, 1, 29))).toBe('2024-02-29'); // leap year
  });

  it('pads single-digit months and days', () => {
    expect(getLocalDateStr(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(getLocalDateStr(new Date(2025, 8, 3))).toBe('2025-09-03');
  });
});

// ── formatTime ──────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats 0 seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(5)).toBe('0:05');
  });

  it('formats exactly one minute', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats over an hour', () => {
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(3661)).toBe('61:01');
  });
});

// ── isDayDoneFromCompletions ────────────────────────────────────────────

describe('isDayDoneFromCompletions', () => {
  it('returns false for missing date', () => {
    expect(isDayDoneFromCompletions({}, '2025-01-01')).toBe(false);
  });

  it('returns false when no exercise is completed', () => {
    const c = makeCompletions([['2025-01-01', { pushups: { isCompleted: false } }]]);
    expect(isDayDoneFromCompletions(c, '2025-01-01')).toBe(false);
  });

  it('returns true when at least one exercise is completed', () => {
    const c = makeCompletions([['2025-01-01', { pushups: { isCompleted: true }, squats: { isCompleted: false } }]]);
    expect(isDayDoneFromCompletions(c, '2025-01-01')).toBe(true);
  });

  it('handles null entries gracefully', () => {
    const c = { '2025-01-01': { pushups: null, squats: { isCompleted: true } } };
    expect(isDayDoneFromCompletions(c, '2025-01-01')).toBe(true);
  });
});

// ── calculateStreak ─────────────────────────────────────────────────────

describe('calculateStreak', () => {
  it('returns 0 for empty completions', () => {
    expect(calculateStreak({}, '2025-01-10')).toBe(0);
  });

  it('returns 1 when only today is done', () => {
    const c = makeCompletions([['2025-01-10', { pushups: { isCompleted: true } }]]);
    expect(calculateStreak(c, '2025-01-10')).toBe(1);
  });

  it('counts consecutive days backwards from today', () => {
    const c = makeCompletions([
      ['2025-01-10', { pushups: { isCompleted: true } }],
      ['2025-01-09', { pushups: { isCompleted: true } }],
      ['2025-01-08', { pushups: { isCompleted: true } }],
    ]);
    expect(calculateStreak(c, '2025-01-10')).toBe(3);
  });

  it('stops at first gap', () => {
    const c = makeCompletions([
      ['2025-01-10', { pushups: { isCompleted: true } }],
      ['2025-01-09', { pushups: { isCompleted: true } }],
      // 2025-01-08 missing
      ['2025-01-07', { pushups: { isCompleted: true } }],
    ]);
    expect(calculateStreak(c, '2025-01-10')).toBe(2);
  });

  it('returns 0 when today is not done', () => {
    const c = makeCompletions([
      ['2025-01-09', { pushups: { isCompleted: true } }],
    ]);
    expect(calculateStreak(c, '2025-01-10')).toBe(0);
  });
});

// ── calculateExerciseStreak ─────────────────────────────────────────────

describe('calculateExerciseStreak', () => {
  it('returns 0 for empty completions', () => {
    expect(calculateExerciseStreak({}, '2025-01-10', 'pushups')).toBe(0);
  });

  it('counts only the specified exercise', () => {
    const c = makeCompletions([
      ['2025-01-10', { pushups: { isCompleted: true }, squats: { isCompleted: true } }],
      ['2025-01-09', { squats: { isCompleted: true } }], // no pushups
    ]);
    expect(calculateExerciseStreak(c, '2025-01-10', 'pushups')).toBe(1);
    expect(calculateExerciseStreak(c, '2025-01-10', 'squats')).toBe(2);
  });

  it('stops at first day where exercise is not completed', () => {
    const c = makeCompletions([
      ['2025-01-10', { pushups: { isCompleted: true } }],
      ['2025-01-09', { pushups: { isCompleted: false } }],
      ['2025-01-08', { pushups: { isCompleted: true } }],
    ]);
    expect(calculateExerciseStreak(c, '2025-01-10', 'pushups')).toBe(1);
  });
});

// ── calculateMaxStreak ──────────────────────────────────────────────────

describe('calculateMaxStreak', () => {
  it('returns 0 for empty completions', () => {
    expect(calculateMaxStreak({})).toBe(0);
  });

  it('returns 1 for a single day', () => {
    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const c = makeCompletions([[todayStr, { pushups: { isCompleted: true } }]]);
    expect(calculateMaxStreak(c)).toBe(1);
  });

  it('finds longest consecutive sequence', () => {
    const today = new Date();
    const entries = [];
    // 3-day streak ending today
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      entries.push([getLocalDateStr(d), { pushups: { isCompleted: true } }]);
    }
    // 5-day streak ending 10 days ago
    for (let i = 10; i < 15; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      entries.push([getLocalDateStr(d), { pushups: { isCompleted: true } }]);
    }
    const c = makeCompletions(entries);
    expect(calculateMaxStreak(c)).toBe(5);
  });
});

// ── formatDuration ───────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('returns "0s" for zero or negative input', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(-10)).toBe('0s');
    expect(formatDuration(null)).toBe('0s');
  });

  it('formats seconds under a minute', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats whole minutes (dropping leftover seconds)', () => {
    expect(formatDuration(90)).toBe('1m');
    expect(formatDuration(150)).toBe('2m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});

// ── getCurrentWeekNumber ─────────────────────────────────────────────────

describe('getCurrentWeekNumber', () => {
  it('defaults to week 1 when no start date is given', () => {
    expect(getCurrentWeekNumber(null)).toBe(1);
  });

  it('is week 1 on the start day and within the first 7 days', () => {
    expect(getCurrentWeekNumber('2025-01-01', new Date('2025-01-01'))).toBe(1);
    expect(getCurrentWeekNumber('2025-01-01', new Date('2025-01-07'))).toBe(1);
  });

  it('rolls to week 2 after 7 days and week 3 after 14', () => {
    expect(getCurrentWeekNumber('2025-01-01', new Date('2025-01-08'))).toBe(2);
    expect(getCurrentWeekNumber('2025-01-01', new Date('2025-01-14'))).toBe(2);
    expect(getCurrentWeekNumber('2025-01-01', new Date('2025-01-15'))).toBe(3);
  });

  it('never returns less than 1 for dates before the start', () => {
    expect(getCurrentWeekNumber('2025-01-10', new Date('2025-01-01'))).toBe(1);
  });
});

// ── getWeekBounds ────────────────────────────────────────────────────────

describe('getWeekBounds', () => {
  it('returns Monday 00:00 → Sunday 23:59 for a midweek date', () => {
    const { start, end } = getWeekBounds(new Date(2025, 0, 15)); // Wed Jan 15 2025
    const s = new Date(start);
    const e = new Date(end);
    expect(s.getDay()).toBe(1);   // Monday
    expect(s.getDate()).toBe(13);
    expect(s.getHours()).toBe(0);
    expect(e.getDay()).toBe(0);   // Sunday
    expect(e.getDate()).toBe(19);
    expect(e.getHours()).toBe(23);
  });

  it('maps a Sunday back to the Monday that starts its week', () => {
    const { start } = getWeekBounds(new Date(2025, 0, 19)); // Sunday
    expect(new Date(start).getDate()).toBe(13); // same Monday Jan 13
  });
});

// ── isDayDoneFromCompletions — week-wide cardio rule ─────────────────────

describe('isDayDoneFromCompletions — weekly cardio carries the day', () => {
  it('marks a day done when running was completed earlier the same week', () => {
    const wed = '2025-01-15';
    const { start } = getWeekBounds(new Date(wed));
    const mondayStr = getLocalDateStr(new Date(start));
    const completions = { [mondayStr]: { running: { isCompleted: true } } };
    expect(isDayDoneFromCompletions(completions, wed)).toBe(true);
  });

  it('does not mark a day done from cardio in a different week', () => {
    const completions = { '2025-01-06': { cycling: { isCompleted: true } } };
    // 2025-01-15 is the following week → not carried over
    expect(isDayDoneFromCompletions(completions, '2025-01-15')).toBe(false);
  });
});

// ── parseTimestamp ───────────────────────────────────────────────────────

describe('parseTimestamp', () => {
  it('returns a valid date for null / falsy input', () => {
    expect(parseTimestamp(null)).toBeInstanceOf(Date);
    expect(Number.isNaN(parseTimestamp(null).getTime())).toBe(false);
  });

  it('treats a Firebase serverTimestamp placeholder as "now"', () => {
    const d = parseTimestamp({ '.sv': 'timestamp' });
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });

  it('parses an epoch number and an ISO string', () => {
    expect(parseTimestamp(1700000000000).getTime()).toBe(1700000000000);
    expect(parseTimestamp('2025-01-01T00:00:00.000Z').getTime())
      .toBe(new Date('2025-01-01T00:00:00.000Z').getTime());
  });

  it('falls back to a valid date for unparseable input', () => {
    const d = parseTimestamp('definitely-not-a-date');
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});
