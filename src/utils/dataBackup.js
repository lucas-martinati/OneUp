import { createLogger } from './logger';

const logger = createLogger('DataBackup');

const BACKUP_MARKER = 'oneup-backup';
const BACKUP_VERSION = 1;

/**
 * Collect every localStorage entry into a portable backup object.
 *
 * On the web, ALL app data (progress, settings, routines, custom exercises,
 * Strava token, …) lives in origin-scoped localStorage — including the
 * `CapacitorStorage.`-prefixed Preferences values (see src/utils/preferences.js).
 * Since localStorage cannot cross domains, a full snapshot is the only reliable
 * way for a signed-out user to carry their data to a new domain.
 */
export function buildBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key == null) continue;
    data[key] = localStorage.getItem(key);
  }
  return {
    app: BACKUP_MARKER,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    origin: typeof window !== 'undefined' ? window.location.origin : null,
    data,
  };
}

/**
 * Serialize a backup and trigger a JSON file download in the browser.
 * @returns {number} number of keys included in the backup.
 */
export function downloadBackup() {
  const backup = buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = backup.exportedAt.slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `oneup-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return Object.keys(backup.data).length;
}

/**
 * Validate + parse a backup file's text content.
 * @throws {Error} with code 'invalid-json' or 'invalid-backup' on failure.
 */
export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  if (!parsed || parsed.app !== BACKUP_MARKER || typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('invalid-backup');
  }
  return parsed;
}

/**
 * Restore a parsed backup into localStorage, replacing the current store so the
 * imported state is authoritative. The caller should confirm with the user and
 * then reload the app so every store re-reads from localStorage.
 * @returns {number} number of keys written.
 */
export function restoreBackup(parsed) {
  localStorage.clear();
  let count = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
      count++;
    }
  }
  logger.info(`Restored ${count} keys from backup`);
  return count;
}

/** Read a File object's text content (Promise wrapper around FileReader). */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.readAsText(file);
  });
}
