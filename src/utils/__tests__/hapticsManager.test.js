import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capacitor plugin (iOS native path).
const hapticsVibrate = vi.fn(() => Promise.resolve());
vi.mock('@capacitor/haptics', () => ({
  Haptics: { vibrate: (...a) => hapticsVibrate(...a) },
}));

// Platform detection — both flags overridable per test.
const isAndroidPlatform = vi.fn(() => false);
const isNativePlatform = vi.fn(() => false);
vi.mock('@utils/platform', () => ({
  isAndroidPlatform: (...a) => isAndroidPlatform(...a),
  isNativePlatform: (...a) => isNativePlatform(...a),
}));

// Native Android bridge (dynamically imported by the manager).
const bridgeVibrate = vi.fn(() => Promise.resolve());
vi.mock('@utils/widgetBridge', () => ({
  getWidgetBridge: () => Promise.resolve({ plugin: { vibrate: (...a) => bridgeVibrate(...a) } }),
}));

// Browser Vibration API (web path).
const navVibrate = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  isAndroidPlatform.mockReturnValue(false);
  isNativePlatform.mockReturnValue(false);
  vi.stubGlobal('navigator', { vibrate: navVibrate });
});
afterEach(() => vi.unstubAllGlobals());

async function load() {
  return import('@utils/hapticsManager');
}

describe('hapticsManager', () => {
  it('uses the browser Vibration API on web', async () => {
    const { haptics } = await load();
    haptics.light();
    expect(navVibrate).toHaveBeenCalledWith(40);
  });

  it('routes through the native bridge on Android', async () => {
    isAndroidPlatform.mockReturnValue(true);
    isNativePlatform.mockReturnValue(true);
    const { haptics } = await load();
    await haptics.light();
    expect(bridgeVibrate).toHaveBeenCalledWith({ duration: 40 });
    expect(navVibrate).not.toHaveBeenCalled();
  });

  it('uses Capacitor Haptics on iOS native', async () => {
    isNativePlatform.mockReturnValue(true); // native but not android
    const { haptics } = await load();
    await haptics.light();
    expect(hapticsVibrate).toHaveBeenCalledWith({ duration: 40 });
    expect(navVibrate).not.toHaveBeenCalled();
  });

  it('fires a solid vibration on success', async () => {
    const { haptics } = await load();
    haptics.success();
    expect(navVibrate).toHaveBeenCalledWith(120);
  });

  it('celebrates with a double buzz', async () => {
    const { haptics } = await load();
    await haptics.celebrate();
    expect(navVibrate).toHaveBeenCalledWith(70);
    expect(navVibrate).toHaveBeenCalledWith(150);
  });

  it('does nothing when haptics are disabled by the settings getter', async () => {
    const { haptics, setHapticsSettingsGetter } = await load();
    setHapticsSettingsGetter(() => ({ hapticsEnabled: false }));
    haptics.light();
    haptics.success();
    expect(navVibrate).not.toHaveBeenCalled();
  });

  it('fires when the settings getter enables haptics', async () => {
    const { haptics, setHapticsSettingsGetter } = await load();
    setHapticsSettingsGetter(() => ({ hapticsEnabled: true }));
    haptics.medium();
    expect(navVibrate).toHaveBeenCalledWith(70);
  });

  it('swallows errors from the vibration call', async () => {
    navVibrate.mockImplementationOnce(() => { throw new Error('no device'); });
    const { haptics } = await load();
    expect(() => haptics.light()).not.toThrow();
  });

  it('is a no-op when the Vibration API is unavailable', async () => {
    vi.stubGlobal('navigator', {}); // no vibrate
    const { haptics } = await load();
    expect(() => haptics.light()).not.toThrow();
  });
});
