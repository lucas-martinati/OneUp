import { describe, it, expect } from 'vitest';
import { PALETTE } from '../palette';

describe('PALETTE', () => {
  it('contains valid hex color codes for fixed theme-independent palette', () => {
    expect(PALETTE).toBeDefined();
    expect(PALETTE.gold).toBe('#ffd700');
    expect(PALETTE.silver).toBe('#e2e8f0');
    expect(PALETTE.bronze).toBe('#cd9b6a');
    expect(PALETTE.amber).toBe('#fbbf24');
    expect(PALETTE.emerald).toBe('#34d399');

    // Ensure all values are non-empty strings matching hex color pattern
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    for (const [key, color] of Object.entries(PALETTE)) {
      expect(color, `Color for ${key} should be a valid 6-character hex code`).toMatch(hexPattern);
    }
  });
});
