import { describe, it, expect } from 'vitest';
import { getShieldFlags } from '../leaderboard';

describe('getShieldFlags', () => {
  it('returns false for shields when shieldDate does not match todayStr', () => {
    const entry = {
      shieldDate: '2026-08-16',
      shieldGreen: true,
      shieldOrange: false
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: false,
      showVerifiedShield: false,
      showSuspiciousShield: false,
    });
  });

  it('returns verified shield when shieldDate matches and shieldGreen is true', () => {
    const entry = {
      shieldDate: '2026-08-17',
      shieldGreen: true,
      shieldOrange: false
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: true,
      showSuspiciousShield: false,
    });
  });

  it('returns suspicious shield when shieldDate matches and shieldOrange is true', () => {
    const entry = {
      shieldDate: '2026-08-17',
      shieldGreen: false,
      shieldOrange: true
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: false,
      showSuspiciousShield: true,
    });
  });

  it('handles missing flags correctly', () => {
    const entry = {
      shieldDate: '2026-08-17'
    };
    const flags = getShieldFlags(entry, '2026-08-17');
    expect(flags).toEqual({
      shieldFresh: true,
      showVerifiedShield: false,
      showSuspiciousShield: false,
    });
  });
});
