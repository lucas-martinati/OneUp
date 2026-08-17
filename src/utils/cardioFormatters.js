/**
 * Shared cardio formatting helpers (previously copy-pasted in
 * CardioLastSession, CardioHistory and CardioFullscreenMap).
 */

/**
 * Format seconds to "Xh Ym" or "Ym Zs"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Format meters to km. `decimals` defaults to 1 (app standard); the fullscreen
 * map keeps 2 for finer precision.
 */
export function formatDistance(meters, decimals = 1) {
  if (!meters || meters <= 0) return '—';
  return `${(meters / 1000).toFixed(decimals)}`;
}

/**
 * Format m/s to either Pace (min/km) for running or Speed (km/h) for others.
 * Value-only: callers append the unit via their own i18n labels.
 */
export function formatSpeed(speedMs, type) {
  if (!speedMs || speedMs <= 0) return '—';
  if (type === 'running') {
    const secondsPerKm = 1000 / speedMs;
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return (speedMs * 3.6).toFixed(1);
}