// Haptics manager — light physical feedback on supported devices.
// Mirrors soundManager: a settings getter lets the app gate vibrations behind
// the user's `hapticsEnabled` preference. Failures are logged via logger.error.
//
// Routing by platform:
//  - Android native: WidgetBridge.vibrate for customized amplitude.
//  - iOS native: @capacitor/haptics Impact & Vibrate (Taptic engine).
//  - Web / PWA: browser Vibration API (navigator.vibrate).
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isAndroidPlatform, isNativePlatform } from './platform';
import { createLogger } from './logger';

const logger = createLogger('HapticsManager');

let settingsGetter = null;

export function setHapticsSettingsGetter(getter) {
  settingsGetter = getter;
}

function hapticsEnabled() {
  if (!settingsGetter) return true; // default on until the app wires settings
  try {
    const settings = settingsGetter();
    return settings?.hapticsEnabled !== false;
  } catch {
    return true;
  }
}

async function vibrate(duration, impactStyle = ImpactStyle?.Light || 'LIGHT') {
  if (isAndroidPlatform()) {
    try {
      const { getWidgetBridge } = await import('./widgetBridge');
      const { plugin } = await getWidgetBridge();
      if (plugin?.vibrate) {
        await plugin.vibrate({ duration });
        return;
      }
    } catch {
      // Fall through to Capacitor / Web
    }
  }

  if (isNativePlatform()) {
    // Try Taptic Engine impact first for iOS/Android native
    try {
      if (typeof Haptics?.impact === 'function') {
        await Haptics.impact({ style: impactStyle });
        return;
      }
    } catch {
      // Ignore and fall back to vibrate below
    }
    // Fallback/standard Capacitor vibrate call
    if (typeof Haptics?.vibrate === 'function') {
      await Haptics.vibrate({ duration });
      return;
    }
  }

  // Web / PWA — browser Vibration API
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch {
      // Silent
    }
  }
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run(label, effect) {
  if (!hapticsEnabled()) return;
  try {
    await effect();
  } catch (err) {
    logger.error(`Haptic "${label}" failed:`, err?.message || err);
  }
}

export const haptics = {
  light: () => run('light', () => vibrate(40, ImpactStyle?.Light || 'LIGHT')),
  medium: () => run('medium', () => vibrate(70, ImpactStyle?.Medium || 'MEDIUM')),
  success: () => run('success', () => vibrate(120, ImpactStyle?.Heavy || 'HEAVY')),
  celebrate: () => run('celebrate', async () => {
    await vibrate(70, ImpactStyle?.Medium || 'MEDIUM');
    await wait(80);
    await vibrate(150, ImpactStyle?.Heavy || 'HEAVY');
  }),
};
