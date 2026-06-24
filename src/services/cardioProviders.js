import { stravaService } from './stravaService';
import { healthConnectService } from './healthConnectService';
import { googleHealthService } from './googleHealthService';

/**
 * Cardio provider registry.
 *
 * Both Strava and Google Health Connect expose the same surface
 * (isAuthenticated / connect / getActivities / disconnect) and emit normalized
 * sessions with unique, source-prefixed ids (`strava_…` / `hc_…`). Keeping them
 * behind this registry means the day Strava becomes paid, dropping it is a
 * one-line change here — the UI and sync logic don't move.
 */
const cardioProviders = [stravaService, healthConnectService, googleHealthService];

/**
 * Fetch new activities from every connected provider, concatenated and
 * deduplicated by id. Providers that aren't connected return [] cheaply.
 */
export async function getAllActivities(afterTimestamp) {
  const results = await Promise.all(
    cardioProviders.map(p => p.getActivities(afterTimestamp).catch(() => []))
  );

  const byId = new Map();
  for (const activity of results.flat()) {
    if (activity?.id && !byId.has(activity.id)) {
      byId.set(activity.id, activity);
    }
  }
  return Array.from(byId.values());
}
