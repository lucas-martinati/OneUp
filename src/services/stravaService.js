import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { createLogger } from '@utils/logger';
import { APP_URL_DISPLAY } from '@config/app';

const logger = createLogger('Strava');

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID || '';
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL
  || `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

function decodePolyline(encoded) {
  if (!encoded) return null;
  const poly = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
}

function getRedirectUri() {
  if (Capacitor.getPlatform() === 'web') {
    // Use the full URL including the base path (e.g., /OneUp/) for GitHub Pages
    const baseUrl = import.meta.env.BASE_URL;
    const origin = window.location.origin;
    // Combine origin and base, ensuring a clean URL without trailing slash unless it's just root
    const fullUrl = (origin + baseUrl).replace(/\/$/, '') || origin;
    return fullUrl;
  }
  // Custom-scheme deep link whose host is the app domain (from VITE_APP_URL).
  // This host MUST match the Strava dashboard's Authorization Callback Domain
  // and the @string/strava_redirect_host used in AndroidManifest.xml (both come
  // from the same VITE_APP_URL via generate-config.js).
  // This bypasses Android 12+ App Links requirements.
  return `com.lucasm548.oneup://${APP_URL_DISPLAY}/strava-auth`;
}

class StravaService {
  constructor() {
    this.token = null;
    this.init();
  }

  async init() {
    const { value } = await Preferences.get({ key: 'strava_token' });
    if (value) {
      this.token = JSON.parse(value);
    }

    if (Capacitor.isNativePlatform()) {
      // Listen for app opens (deep links) while the app is already running.
      App.addListener('appUrlOpen', async (data) => {
        if (data.url.startsWith(getRedirectUri())) {
          await this.handleCallback(data.url);
        }
      });

      // Cold-start safety net: if the OAuth return relaunched the app (singleTask
      // can recreate the webview), the `appUrlOpen` event may fire before this
      // listener is registered and be lost — which is exactly why the app would
      // "reopen but never connect". getLaunchUrl() recovers the launch intent URL.
      try {
        const launch = await App.getLaunchUrl();
        if (launch?.url && launch.url.startsWith(getRedirectUri())) {
          await this.handleCallback(launch.url);
        }
      } catch (err) {
        logger.error('Failed to read Strava launch URL', err);
      }
    } else {
      // On web, check if we just returned from OAuth. The web origin is shared
      // with Fitbit, so only claim the code when the `state` is ours (or absent,
      // for backward compatibility with older Strava links).
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      if (code && (state === 'strava' || !state)) {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        await this.exchangeToken(code);
      }
    }
  }

  async isAuthenticated() {
    if (!this.token) return false;
    // Check if expired
    if (Date.now() / 1000 > this.token.expires_at - 60) {
      return await this.refreshToken();
    }
    return true;
  }

  async connect() {
    const scope = 'activity:read_all';
    const redirectUri = getRedirectUri();
    const authUrl = `https://www.strava.com/oauth/mobile/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${scope}&state=strava`;
    
    if (Capacitor.getPlatform() === 'web') {
      window.location.assign(authUrl);
    } else {
      await Browser.open({ url: authUrl, windowName: '_self' });
    }
  }

  async handleCallback(url) {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    if (code) {
      logger.info('Received Strava auth code');
      await Browser.close();
      await this.exchangeToken(code);
    }
  }

  async exchangeToken(code) {
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/stravaExchangeToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.token = data;
        await Preferences.set({ key: 'strava_token', value: JSON.stringify(data) });
        logger.success('Strava connected successfully');
        window.dispatchEvent(new CustomEvent('strava-connected'));
      }
    } catch (err) {
      logger.error('Failed to exchange Strava token', err);
    }
  }

  async refreshToken() {
    if (!this.token?.refresh_token) return false;
    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/stravaRefreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.token.refresh_token }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.token = { ...this.token, ...data };
        await Preferences.set({ key: 'strava_token', value: JSON.stringify(this.token) });
        return true;
      }
    } catch (err) {
      logger.error('Failed to refresh Strava token', err);
    }
    return false;
  }

  async getActivities(afterTimestamp) {
    if (!(await this.isAuthenticated())) return [];

    try {
      let url = 'https://www.strava.com/api/v3/athlete/activities?per_page=30';
      if (afterTimestamp) {
        url += `&after=${Math.floor(afterTimestamp / 1000)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.token.access_token}` },
      });

      const activities = await response.json();
      return activities.map(a => {
        let actType = 'other';
        if (a.type === 'Run') {
          actType = 'running';
        } else if (a.type === 'Ride') {
          actType = 'cycling';
        }

        return {
          id: `strava_${a.id}`,
          source: 'strava',
          type: actType,
          distance: a.distance, // meters
          duration: a.moving_time, // seconds
          movingTime: a.moving_time,
          startTime: new Date(a.start_date).getTime(),
          name: a.name,
          gpsTrack: decodePolyline(a.map?.summary_polyline) || decodePolyline(a.map?.polyline) || null,
          polyline: a.map?.summary_polyline || null,
          elevation: a.total_elevation_gain,
          averageSpeed: a.average_speed,
        };
      }).filter(a => a.type !== 'other');
    } catch (err) {
      logger.error('Failed to fetch Strava activities', err);
      return [];
    }
  }

  async disconnect() {
    this.token = null;
    await Preferences.remove({ key: 'strava_token' });
    logger.info('Strava disconnected');
  }
}

export const stravaService = new StravaService();
