import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Health } from 'capacitor-health';
import { createLogger } from '@utils/logger';

const logger = createLogger('HealthConnect');

// JS-side permission names from `capacitor-health`. The plugin maps these to the
// native Health Connect permissions declared in AndroidManifest.xml
// (READ_WORKOUTS -> health.READ_EXERCISE, READ_ROUTE -> health.READ_EXERCISE_ROUTE, ...).
const PERMISSIONS = ['READ_WORKOUTS', 'READ_DISTANCE', 'READ_ROUTE'];

// How far back to look for workouts on the very first sync (no prior session).
const INITIAL_LOOKBACK_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Normalize a Health Connect workout type string to OneUp's cardio modes.
 * Health Connect uses values like RUNNING / RUNNING_TREADMILL / BIKING /
 * BIKING_STATIONARY, so we match loosely to stay resilient across versions.
 */
function mapWorkoutType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('run')) return 'running';
  if (t.includes('cycl') || t.includes('bik')) return 'cycling';
  return 'other';
}

/**
 * Google Health Connect cardio provider.
 *
 * Mirrors the public surface of `stravaService` (isAuthenticated / connect /
 * getActivities / disconnect) so both can sit behind the cardio provider
 * registry. Unlike Strava there is NO OAuth and NO deep-link redirect: access is
 * granted through the native Health Connect permission dialog, which sidesteps
 * the whole class of OAuth-return bugs.
 *
 * Health Connect permissions are owned by the OS and cannot be revoked
 * programmatically, so we keep a local `enabled` flag to give the user a real
 * on/off toggle inside OneUp.
 */
class HealthConnectService {
  constructor() {
    this.enabled = false;
    this.init();
  }

  async init() {
    const { value } = await Preferences.get({ key: 'health_connect_enabled' });
    this.enabled = value === 'true';
  }

  async isAvailable() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { available } = await Health.isHealthAvailable();
      return available;
    } catch (err) {
      logger.error('Health Connect availability check failed', err);
      return false;
    }
  }

  /** True when the user enabled the source in-app AND the OS permission is granted. */
  async isAuthenticated() {
    if (!this.enabled) return false;
    if (!(await this.isAvailable())) return false;
    try {
      const res = await Health.checkHealthPermissions({ permissions: PERMISSIONS });
      return isWorkoutsGranted(res);
    } catch (err) {
      logger.error('Health Connect permission check failed', err);
      return false;
    }
  }

  async connect() {
    if (!(await this.isAvailable())) {
      logger.warn('Health Connect not available, opening Play Store');
      try { await Health.showHealthConnectInPlayStore(); } catch { /* best effort */ }
      return false;
    }
    try {
      const res = await Health.requestHealthPermissions({ permissions: PERMISSIONS });
      const granted = isWorkoutsGranted(res);
      if (granted) {
        this.enabled = true;
        await Preferences.set({ key: 'health_connect_enabled', value: 'true' });
        logger.success('Health Connect connected successfully');
        window.dispatchEvent(new CustomEvent('cardio-source-connected'));
      } else {
        logger.warn('Health Connect permissions not granted');
      }
      return granted;
    } catch (err) {
      logger.error('Health Connect permission request failed', err);
      return false;
    }
  }

  async getActivities(afterTimestamp) {
    if (!(await this.isAuthenticated())) return [];
    try {
      const start = afterTimestamp
        ? new Date(afterTimestamp)
        : new Date(Date.now() - INITIAL_LOOKBACK_MS);
      const { workouts } = await Health.queryWorkouts({
        startDate: start.toISOString(),
        endDate: new Date().toISOString(),
        includeHeartRate: false,
        includeRoute: true,
        includeSteps: false,
      });

      return (workouts || [])
        .map(mapWorkout)
        .filter(a => a.type !== 'other');
    } catch (err) {
      logger.error('Failed to fetch Health Connect workouts', err);
      return [];
    }
  }

  async disconnect() {
    // We can't revoke the OS permission; just stop pulling from this source.
    this.enabled = false;
    await Preferences.set({ key: 'health_connect_enabled', value: 'false' });
    logger.info('Health Connect disconnected');
  }
}

/**
 * Whether the workouts permission was granted. The Android plugin returns a map
 * `{ permissions: { READ_WORKOUTS: true, READ_DISTANCE: true, ... } }` (keys are
 * the permission names). We also tolerate the array-of-objects shape described by
 * the plugin's TypeScript types, in case a future version changes it.
 */
function isWorkoutsGranted(res) {
  const perms = res?.permissions;
  if (!perms) return false;
  if (Array.isArray(perms)) return perms.some(entry => entry?.READ_WORKOUTS === true);
  return perms.READ_WORKOUTS === true;
}

/** Map a Health Connect workout to OneUp's normalized cardio session shape. */
function mapWorkout(w) {
  const type = mapWorkoutType(w.workoutType);
  const startTime = new Date(w.startDate).getTime();
  const endTime = new Date(w.endDate).getTime();
  // Derive duration from the session bounds to stay independent of plugin units.
  const duration = Math.max(0, Math.round((endTime - startTime) / 1000));
  const distance = w.distance || 0; // meters, like Strava
  const gpsTrack = Array.isArray(w.route) && w.route.length
    ? w.route.map(p => ({ lat: p.lat, lng: p.lng }))
    : null;
  // Health Connect session ids are stable UUIDs; fall back to start time so the
  // dedup-by-id in useCardio still works if an id is missing.
  const uid = w.id || `${startTime}`;

  return {
    id: `hc_${uid}`,
    source: 'health_connect',
    type,
    distance,
    duration,
    movingTime: duration,
    startTime,
    name: w.sourceName || null,
    gpsTrack,
    polyline: null,
    elevation: null,
    averageSpeed: duration > 0 ? distance / duration : 0,
  };
}

export const healthConnectService = new HealthConnectService();
