function getCapacitorPlatform() {
  const capacitor = globalThis?.Capacitor;

  if (!capacitor) return 'web';

  if (typeof capacitor.getPlatform === 'function') {
    return capacitor.getPlatform() || 'web';
  }

  if (typeof capacitor.platform === 'string') {
    return capacitor.platform;
  }

  if (typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) {
    return 'native';
  }

  return 'web';
}

export function isNativePlatform() {
  return getCapacitorPlatform() !== 'web';
}

export function isAndroidPlatform() {
  return getCapacitorPlatform() === 'android';
}
