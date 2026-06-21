import { describe, it, expect, vi, afterEach } from 'vitest';
import { LANGUAGES, resolveLanguageCode } from '@config/languages';
import { MAP_TILES } from '@config/mapTiles';
import { THEMES } from '@config/themes';

describe('languages config', () => {
  it('exposes the supported languages with code + label', () => {
    expect(LANGUAGES.length).toBeGreaterThan(0);
    expect(LANGUAGES.every(l => l.code && l.label)).toBe(true);
    expect(LANGUAGES.map(l => l.code)).toContain('fr');
  });

  it('resolves regional tags to a supported base code', () => {
    expect(resolveLanguageCode('fr-FR')).toBe('fr');
    expect(resolveLanguageCode('EN')).toBe('en');
  });

  it('falls back to english for unknown or missing tags', () => {
    expect(resolveLanguageCode('xx-YY')).toBe('en');
    expect(resolveLanguageCode(null)).toBe('en');
    expect(resolveLanguageCode(undefined)).toBe('en');
  });
});

describe('mapTiles config', () => {
  it('provides dark and light tile URLs', () => {
    expect(MAP_TILES.dark).toMatch(/^https:\/\//);
    expect(MAP_TILES.light).toMatch(/^https:\/\//);
  });
});

describe('themes config', () => {
  it('lists themes with key/color/accent', () => {
    expect(THEMES.length).toBeGreaterThan(1);
    for (const t of THEMES) {
      expect(t.key).toBeTruthy();
      expect(t.color).toMatch(/^#/);
      expect(t.accent).toMatch(/^#/);
    }
  });
});

describe('admin config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('matches the configured admin email and rejects others', async () => {
    vi.stubEnv('VITE_ADMIN_EMAIL', 'admin@oneup.app');
    vi.resetModules();
    const { isAdminEmail } = await import('@config/admin');
    expect(isAdminEmail('admin@oneup.app')).toBe(true);
    expect(isAdminEmail('other@oneup.app')).toBe(false);
    expect(isAdminEmail('')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it('returns false for everyone when no admin email is configured', async () => {
    vi.stubEnv('VITE_ADMIN_EMAIL', '');
    vi.resetModules();
    const { isAdminEmail } = await import('@config/admin');
    expect(isAdminEmail('anyone@oneup.app')).toBe(false);
  });
});
