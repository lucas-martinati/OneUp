// Haptics manager — light physical feedback on supported devices.
// Mirrors soundManager: a settings getter lets the app gate vibrations behind
// the user's `hapticsEnabled` preference. Failures are logged via logger.error
// (which logs even in production builds) so a missing plugin / unsupported
// device is visible in the native webview console instead of failing silently.
//
// Routing by platform:
//  - Android native: our own WidgetBridge.vibrate, which forces a strong
//    amplitude + VibrationAttributes — the stock @capacitor/haptics vibrate
//    (DEFAULT_AMPLITUDE, no attributes) succeeds at the bridge level but
//    produces no perceptible vibration on several devices (e.g. Samsung/Xiaomi).
//  - iOS native: @capacitor/haptics (Taptic engine).
//  - Web / PWA: the browser Vibration API (navigator.vibrate). Supported on
//    Chrome for Android; a no-op on iOS Safari and most desktop browsers.
import { Haptics } from '@capacitor/haptics';
import { isAndroidPlatform, isNativePlatform } from './platform';
import { createLogger } from './logger';

const logger = createLogger('HapticsManager');

let settingsGetter = null;

// Allow injection of settings getter from the app (see Dashboard wiring).
export function setHapticsSettingsGetter(getter) {
  settingsGetter = getter;
}

function hapticsEnabled() {
  if (!settingsGetter) return true; // default on until the app wires settings
  const settings = settingsGetter();
  return settings?.hapticsEnabled !== false;
}

async function vibrate(duration) {
  if (isAndroidPlatform()) {
    // Imported lazily so the web/test bundle doesn't pull in the native bridge
    // (and its i18n dependency) just to use the web Vibration API.
    const { getWidgetBridge } = await import('./widgetBridge');
    const { plugin } = await getWidgetBridge();
    await plugin.vibrate({ duration });
    return;
  }
  if (isNativePlatform()) {
    // iOS native — Capacitor Haptics (Taptic engine).
    await Haptics.vibrate({ duration });
    return;
  }
  // Web / PWA — browser Vibration API (no-op where unsupported).
  navigator?.vibrate?.(duration);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run a haptic effect, gated by the user's preference. Failures are logged via
// logger.error (which logs even in release builds, unlike logger.debug/warn) so
// an unsupported device surfaces in the native webview console instead of
// failing silently.
async function run(label, effect) {
  if (!hapticsEnabled()) return;
  try {
    await effect();
  } catch (err) {
    logger.error(`Haptic "${label}" failed:`, err?.message || err);
  }
}

// Durations cross the perception threshold of modern LRA motors, which need
// ~40-50ms just to spin up — anything shorter is often unfelt even though the
// native call succeeds.
export const haptics = {
  // Validating a single rep / tapping an action button — a crisp short tap.
  light: () => run('light', () => vibrate(40)),
  // Slightly stronger feedback for secondary confirmations.
  medium: () => run('medium', () => vibrate(70)),
  // Completing an exercise / reaching a goal — a solid pulse.
  success: () => run('success', () => vibrate(120)),
  // Unlocking a badge — a celebratory double buzz.
  celebrate: () => run('celebrate', async () => {
    await vibrate(70);
    await wait(80);
    await vibrate(150);
  }),
};
