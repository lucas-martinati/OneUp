import { describe, it, expect } from 'vitest';
import {
  getLocalDateStr,
  calculateStreak,
  calculateExerciseStreak,
  calculateMaxStreak,
  isDayDoneFromCompletions,
  formatTime,
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
