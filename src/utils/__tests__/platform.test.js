import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isNativePlatform, isAndroidPlatform } from '../platform';

describe('platform utility', () => {
  const originalGlobalThis = globalThis.Capacitor;

  beforeEach(() => {
    // Reset before each test
    delete globalThis.Capacitor;
  });

  afterEach(() => {
    // Restore original
    globalThis.Capacitor = originalGlobalThis;
  });

  it('returns false for native and android when Capacitor is missing', () => {
    expect(isNativePlatform()).toBe(false);
    expect(isAndroidPlatform()).toBe(false);
  });

  it('uses getPlatform() if available', () => {
    globalThis.Capacitor = {
      getPlatform: vi.fn(() => 'android'),
    };
    expect(isNativePlatform()).toBe(true);
    expect(isAndroidPlatform()).toBe(true);

    globalThis.Capacitor.getPlatform.mockReturnValue('web');
    expect(isNativePlatform()).toBe(false);
    expect(isAndroidPlatform()).toBe(false);

    globalThis.Capacitor.getPlatform.mockReturnValue('ios');
    expect(isNativePlatform()).toBe(true);
    expect(isAndroidPlatform()).toBe(false);
  });

  it('falls back to string platform property', () => {
    globalThis.Capacitor = {
      platform: 'ios',
    };
    expect(isNativePlatform()).toBe(true);
    expect(isAndroidPlatform()).toBe(false);
    
    globalThis.Capacitor.platform = 'android';
    expect(isNativePlatform()).toBe(true);
    expect(isAndroidPlatform()).toBe(true);
  });

  it('falls back to isNativePlatform function', () => {
    globalThis.Capacitor = {
      isNativePlatform: vi.fn(() => true),
    };
    expect(isNativePlatform()).toBe(true);
    expect(isAndroidPlatform()).toBe(false); // Can't determine it's android just from isNativePlatform

    globalThis.Capacitor.isNativePlatform.mockReturnValue(false);
    expect(isNativePlatform()).toBe(false);
  });
});
