import { healthConnectService } from './healthConnectService';

/**
 * Cardio provider registry.
 *
 * Exposes Google Health Connect normalized sessions with unique, 
 * source-prefixed ids (`hc_…`). Keeping it behind this registry means 
 * dropping or adding other providers is a one-line change here.
 */
const cardioProviders = [healthConnectService];

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
