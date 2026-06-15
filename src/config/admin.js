/**
 * Admin configuration.
 * Centralizes admin identification to avoid hardcoding emails across the codebase.
 */
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

/**
 * Check if a given email belongs to an admin.
 * @param {string|undefined|null} email
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (!email || !ADMIN_EMAIL) return false;
  return email === ADMIN_EMAIL;
}
