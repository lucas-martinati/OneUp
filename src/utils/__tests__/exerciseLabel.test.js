import { describe, it, expect, vi } from 'vitest';

// exerciseLabel pulls the full i18n instance — stub it to keep the test fast
vi.mock('../../i18n', () => ({
  default: { t: (key) => `T(${key})` },
}));

import { getExerciseLabel, getExerciseColor, isCustomExercise } from '../exerciseLabel';

describe('getExerciseLabel', () => {
  it('returns empty string for missing exercise', () => {
    expect(getExerciseLabel(null)).toBe('');
    expect(getExerciseLabel(undefined)).toBe('');
  });

  it('uses the stored label for custom exercises (no i18n)', () => {
    expect(getExerciseLabel({ id: 'custom_123', label: 'Mon exo' })).toBe('Mon exo');
  });

  it('falls back to the id for a custom exercise without label', () => {
    expect(getExerciseLabel({ id: 'custom_123' })).toBe('custom_123');
  });

  it('uses a proper stored name when the label is capitalized/accented', () => {
    expect(getExerciseLabel({ id: 'pushups', label: 'Pompes' })).toBe('Pompes');
    expect(getExerciseLabel({ id: 'pushups', label: 'Épaulé' })).toBe('Épaulé');
  });

  it('translates standard exercises through i18n', () => {
    expect(getExerciseLabel({ id: 'pushups' })).toBe('T(exercises.pushups)');
  });
});

describe('getExerciseColor', () => {
  it('returns the exercise color when present', () => {
    expect(getExerciseColor({ color: '#123456' })).toBe('#123456');
  });

  it('falls back to the default color', () => {
    expect(getExerciseColor({})).toBe('#818cf8');
    expect(getExerciseColor(null)).toBe('#818cf8');
  });

  it('honors a custom fallback', () => {
    expect(getExerciseColor(null, '#abcdef')).toBe('#abcdef');
  });
});

describe('isCustomExercise', () => {
  it('recognizes the custom_ prefix', () => {
    expect(isCustomExercise('custom_abc')).toBe(true);
  });

  it('rejects standard ids and bad inputs', () => {
    expect(isCustomExercise('pushups')).toBe(false);
    expect(isCustomExercise('')).toBeFalsy();
    expect(isCustomExercise(null)).toBeFalsy();
    expect(isCustomExercise(undefined)).toBeFalsy();
  });
});
