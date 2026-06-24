import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { createLogger } from '@utils/logger';

const logger = createLogger('GoogleHealth');

const CLIENT_ID = import.meta.env.VITE_GOOGLE_HEALTH_CLIENT_ID || '';
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL
  || `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const API_BASE = 'https://health.googleapis.com/v4';
// Read-only access to recorded exercise/activity (distance, steps, calories…).
const SCOPE = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly';
// OAuth `state` so we (and Strava) can tell whose redirect this is on the shared
// web origin — both come back to the same URL with `?code=`.
const OAUTH_STATE = 'googlehealth';

const INITIAL_LOOKBACK_MS = 365 * 24 * 60 * 60 * 1000;
// Google's exercise data type caps page size at 25.
const PAGE_SIZE = 25;

/** Web redirect URI = app origin + base path (must be an Authorized redirect URI). */
function getRedirectUri() {
  const baseUrl = import.meta.env.BASE_URL;
  const origin = window.location.origin;
  return (origin + baseUrl).replace(/\/$/, '') || origin;
}

/** Google Health exerciseType → OneUp cardio mode. */
function mapExerciseType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('run')) return 'running';
  if (t.includes('bik') || t.includes('cycl') || t.includes('ride') || t.includes('spin')) return 'cycling';
  return 'other';
}

/** Google returns `expires_in` (seconds); convert to an absolute `expires_at` like Strava. */
function normalizeToken(data, prev) {
  const expiresAt = data.expires_at
    || Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  // Refreshes don't return a new refresh_token — keep the previous one.
  return {
    ...prev,
    ...data,
    refresh_token: data.refresh_token || prev?.refresh_token,
    expires_at: expiresAt,
  };
}

/** Parse a protobuf duration string like "900s" → seconds. */
function parseDurationSeconds(activeDuration, interval) {
  if (typeof activeDuration === 'string') {
    const m = activeDuration.match(/^(\d+(?:\.\d+)?)s$/);
    if (m) return Math.round(parseFloat(m[1]));
  }
  if (interval?.startTime && interval?.endTime) {
    return Math.round((new Date(interval.endTime).getTime() - new Date(interval.startTime).getTime()) / 1000);
  }
  return 0;
}

/**
 * Google Health API cardio provider — the WEB counterpart of Health Connect.
 *
 * On native, cardio comes from Health Connect (on-device); on the web (which has
 * no Health Connect API) we read recorded exercises from the Google Health API
 * cloud REST service. Mirrors `stravaService`: web OAuth redirect, token exchange
 * proxied through a Cloud Function (the client secret stays server-side), then
 * data fetched client-side (Google APIs support CORS for bearer-token requests).
 */
class GoogleHealthService {
  constructor() {
    this.token = null;
    this.init();
  }

  async init() {
    const { value } = await Preferences.get({ key: 'google_health_token' });
    if (value) this.token = JSON.parse(value);

    // Web-only. Check whether we just returned from Google's OAuth screen
    // (distinguished from Strava by `state`).
    if (!Capacitor.isNativePlatform()) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code && params.get('state') === OAUTH_STATE) {
        window.history.replaceState({}, document.title, window.location.pathname);
        await this.exchangeToken(code);
      }
    }
  }

  /** Web only, and only when a Google Health client id is configured. */
  isAvailable() {
    return !Capacitor.isNativePlatform() && !!CLIENT_ID;
  }

  async isAuthenticated() {
    if (!this.token) return false;
    if (Date.now() / 1000 > (this.token.expires_at || 0) - 60) {
      return await this.refreshToken();
    }
    return true;
  }

  async connect() {
    if (!this.isAvailable()) {
      logger.warn('Google Health not available (native platform or missing client id)');
      return false;
    }
    const authUrl = `${AUTH_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}`
      + `&redirect_uri=${encodeURIComponent(getRedirectUri())}`
      + `&scope=${encodeURIComponent(SCOPE)}`
      + `&access_type=offline&include_granted_scopes=true&prompt=consent`
      + `&state=${OAUTH_STATE}`;
    window.location.assign(authUrl);
    return true;
  }

  async exchangeToken(code) {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/googleHealthExchangeToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: getRedirectUri() }),
      });
      const data = await response.json();
      if (data.access_token) {
        this.token = normalizeToken(data, this.token);
        await Preferences.set({ key: 'google_health_token', value: JSON.stringify(this.token) });
        logger.success('Google Health connected successfully');
        window.dispatchEvent(new CustomEvent('cardio-source-connected'));
      } else {
        logger.error('Google Health token exchange returned no access_token', data);
      }
    } catch (err) {
      logger.error('Failed to exchange Google Health token', err);
    }
  }

  async refreshToken() {
    if (!this.token?.refresh_token) return false;
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/googleHealthRefreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.token.refresh_token }),
      });
      const data = await response.json();
      if (data.access_token) {
        this.token = normalizeToken(data, this.token);
        await Preferences.set({ key: 'google_health_token', value: JSON.stringify(this.token) });
        return true;
      }
    } catch (err) {
      logger.error('Failed to refresh Google Health token', err);
    }
    return false;
  }

  async getActivities(afterTimestamp) {
    if (!(await this.isAuthenticated())) return [];
    try {
      const after = afterTimestamp ? new Date(afterTimestamp) : new Date(Date.now() - INITIAL_LOOKBACK_MS);
      const filter = encodeURIComponent(`startTime >= ${after.toISOString()}`);
      const url = `${API_BASE}/users/me/dataTypes/exercise/dataPoints?pageSize=${PAGE_SIZE}&filter=${filter}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.token.access_token}` },
      });
      const data = await response.json();
      return (data.dataPoints || [])
        .map(mapDataPoint)
        .filter(a => a.type !== 'other' && a.startTime);
    } catch (err) {
      logger.error('Failed to fetch Google Health exercises', err);
      return [];
    }
  }

  async disconnect() {
    this.token = null;
    await Preferences.remove({ key: 'google_health_token' });
    logger.info('Google Health disconnected');
  }
}

/** Map a Google Health `exercise` dataPoint to OneUp's normalized cardio session. */
function mapDataPoint(dp) {
  const ex = dp.exercise || {};
  const interval = ex.interval || ex.sessionTimeInterval || {};
  const metrics = ex.metricsSummary || {};
  // Distance comes in millimeters (note: Google's sample spells the key
  // `distanceMillimiters`); fall back to `distanceMeters` if present.
  const distanceMm = metrics.distanceMillimeters ?? metrics.distanceMillimiters;
  let distance = 0;
  if (distanceMm != null) distance = Math.round(distanceMm / 1000);
  else if (ex.distanceMeters != null) distance = Math.round(ex.distanceMeters);
  const duration = parseDurationSeconds(ex.activeDuration, interval);
  const startTime = interval.startTime ? new Date(interval.startTime).getTime() : 0;
  const id = (dp.name || '').split('/').pop() || `${startTime}`;

  return {
    id: `gh_${id}`,
    source: 'google_health',
    type: mapExerciseType(ex.exerciseType),
    distance,
    duration,
    movingTime: duration,
    startTime,
    name: ex.displayName || null,
    // GPS would need the location data type / scope; not fetched here.
    gpsTrack: null,
    polyline: null,
    elevation: null,
    averageSpeed: duration > 0 ? distance / duration : 0,
  };
}

export const googleHealthService = new GoogleHealthService();
