import { describe, it, expect } from 'vitest';
import CURRENT_ANNOUNCEMENT from '../announcementConfig';

describe('announcementConfig', () => {
  it('exposes a well-formed announcement object', () => {
    expect(typeof CURRENT_ANNOUNCEMENT.id).toBe('string');
    expect(CURRENT_ANNOUNCEMENT.id.length).toBeGreaterThan(0);
    expect(typeof CURRENT_ANNOUNCEMENT.enabled).toBe('boolean');
    expect(CURRENT_ANNOUNCEMENT.titleKey).toMatch(/^announcement\./);
    expect(CURRENT_ANNOUNCEMENT.bodyKey).toMatch(/^announcement\./);
    expect(CURRENT_ANNOUNCEMENT.ctaKey).toMatch(/^announcement\./);
  });

  it('declares highlights with emoji + i18n key, and an images array', () => {
    expect(Array.isArray(CURRENT_ANNOUNCEMENT.highlights)).toBe(true);
    for (const h of CURRENT_ANNOUNCEMENT.highlights) {
      expect(h.emoji).toBeTruthy();
      expect(h.key).toMatch(/^announcement\.highlights\./);
    }
    expect(Array.isArray(CURRENT_ANNOUNCEMENT.images)).toBe(true);
  });
});
