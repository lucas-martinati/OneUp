/**
 * Application URL configuration.
 * Centralizes the public app URL to avoid hardcoding it across the codebase.
 */
const RAW_APP_URL = import.meta.env.VITE_APP_URL || '';

/** Full app URL without trailing slash, e.g. "https://oneupme.me". */
export const APP_URL = RAW_APP_URL.replace(/\/$/, '');

/** Display form without protocol or trailing slash, e.g. oneupme.me (host only). */
export const APP_URL_DISPLAY = APP_URL.replace(/^https?:\/\//, '');
