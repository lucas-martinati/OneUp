import { describe, it, expect } from 'vitest';
import { Z_INDEX } from '../zIndex';

describe('Z_INDEX', () => {
  it('defines all expected layers', () => {
    expect(Z_INDEX.MODAL).toBeDefined();
    expect(Z_INDEX.TOAST).toBeDefined();
    expect(Z_INDEX.TIMER_OVERLAY).toBeDefined();
    expect(Z_INDEX.DELETE_OVERLAY).toBeDefined();
    expect(Z_INDEX.DELETE_MODAL).toBeDefined();
  });

  it('layers are in ascending order of priority', () => {
    expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.TOAST);
    expect(Z_INDEX.TOAST).toBeLessThan(Z_INDEX.TIMER_OVERLAY);
    expect(Z_INDEX.TIMER_OVERLAY).toBeLessThan(Z_INDEX.DELETE_OVERLAY);
    expect(Z_INDEX.DELETE_OVERLAY).toBeLessThan(Z_INDEX.DELETE_MODAL);
  });

  it('all values are numbers', () => {
    for (const [key, val] of Object.entries(Z_INDEX)) {
      expect(typeof val, `Z_INDEX.${key} should be a number`).toBe('number');
    }
  });
});
