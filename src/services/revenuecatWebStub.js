/**
 * Stub for `@revenuecat/purchases-js`, used ONLY in native (Capacitor) builds.
 *
 * On native platforms, purchaseService.js loads `@revenuecat/purchases-capacitor`
 * and never reaches the web-SDK import (guarded behind `!isNativePlatform()`).
 * Aliasing the ~626 KB web SDK to this stub keeps it out of the Android APK.
 *
 * Web / PWA / GitHub Pages builds use the real package (no alias applied).
 * Enabled via the `NATIVE_BUILD=true` env flag in the `build:apk*` /
 * `build:bundle` / `deploy:android*` npm scripts — see vite.config.js
 * (resolve.alias).
 */
const unavailable = () => {
  throw new Error(
    '[OneUp] RevenueCat web SDK is stubbed in native builds; it must not run on native.',
  );
};

export const Purchases = {
  configure: unavailable,
  getSharedInstance: unavailable,
};

export default { Purchases };
