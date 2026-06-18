import { describe, it, expect } from 'vitest';
import { getIcon, Dumbbell, Flame } from '../icons';

describe('getIcon', () => {
  it('returns the requested icon when it exists', () => {
    expect(getIcon('Flame')).toBe(Flame);
  });

  it('falls back to Dumbbell when name is empty/undefined', () => {
    expect(getIcon()).toBe(Dumbbell);
    expect(getIcon('')).toBe(Dumbbell);
    expect(getIcon(null)).toBe(Dumbbell);
  });

  it('uses the provided fallback for an unknown icon name', () => {
    expect(getIcon('TotallyNotAnIcon', 'Flame')).toBe(Flame);
  });

  it('falls back to the default Dumbbell when both name and fallback are unknown', () => {
    expect(getIcon('Nope', 'AlsoNope')).toBe(Dumbbell);
  });

  it('resolves aliases (Pencil maps to a real component)', () => {
    expect(getIcon('Pencil')).toBeDefined();
    expect(typeof getIcon('Pencil')).not.toBe('undefined');
  });
});
