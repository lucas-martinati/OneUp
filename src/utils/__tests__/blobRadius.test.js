import { describe, it, expect } from 'vitest';
import { blobRadius } from '../blobRadius';

describe('blobRadius', () => {
  it('returns a valid 8-value CSS border-radius string', () => {
    const value = blobRadius('seed');
    // e.g. "45% 52% 33% 60% / 41% 38% 55% 49%"
    expect(value).toMatch(
      /^\d+% \d+% \d+% \d+% \/ \d+% \d+% \d+% \d+%$/
    );
  });

  it('is deterministic for the same seed', () => {
    expect(blobRadius('alpha')).toBe(blobRadius('alpha'));
  });

  it('produces different shapes for different seeds', () => {
    expect(blobRadius('alpha')).not.toBe(blobRadius('beta'));
  });

  it('keeps every radius within the 32%-68% range', () => {
    for (const seed of ['', 'x', 'theme-dark', 'OneUp', '1234567890']) {
      const radii = blobRadius(seed)
        .replace('/', '')
        .split('%')
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number);

      expect(radii).toHaveLength(8);
      for (const r of radii) {
        expect(r).toBeGreaterThanOrEqual(32);
        expect(r).toBeLessThanOrEqual(68);
      }
    }
  });

  it('handles an empty seed without throwing', () => {
    expect(() => blobRadius('')).not.toThrow();
  });
});
