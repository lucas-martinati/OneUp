import { ref, set, get, remove, push, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';

const logger = createLogger('Cardio');

// Cardio sessions live in their OWN node, decoupled from `progress`, so their
// (potentially large, location-sensitive) GPS tracks stay private and out of
// the socially-readable progress subtree.
const sessionsPath = uid => `users/${uid}/cardioSessions`;
// Legacy location, kept only for read/cleanup during the migration window.
const legacyPath = uid => `users/${uid}/progress/cardio/sessions`;

// ── Save a cardio session ──────────────────────────────────────────────

export async function saveCardioSession(session) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const uid = auth.currentUser.uid;
  const sessionsRef = ref(database, sessionsPath(uid));
  const id = session.id || push(sessionsRef).key;
  const sessionRef = ref(database, `${sessionsPath(uid)}/${id}`);
  const payload = {
    ...session,
    id,
    createdAt: serverTimestamp(),
  };

  await set(sessionRef, payload);
  logger.success('Cardio session saved');
  return payload;
}

// ── Load all cardio sessions ───────────────────────────────────────────

export async function loadCardioSessions() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return [];

  const uid = auth.currentUser.uid;
  // Merge the new node with any not-yet-migrated legacy sessions (new wins).
  const [newSnap, legacySnap] = await Promise.all([
    get(ref(database, sessionsPath(uid))),
    get(ref(database, legacyPath(uid))),
  ]);

  const merged = {
    ...(legacySnap.exists() ? legacySnap.val() : {}),
    ...(newSnap.exists() ? newSnap.val() : {}),
  };

  const sessions = Object.values(merged).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  logger.success(`Loaded ${sessions.length} cardio sessions`);
  return sessions;
}

// ── Delete a cardio session ────────────────────────────────────────────

export async function deleteCardioSession(sessionId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  const uid = auth.currentUser.uid;
  // Remove from both locations to cover not-yet-migrated sessions.
  await Promise.all([
    remove(ref(database, `${sessionsPath(uid)}/${sessionId}`)),
    remove(ref(database, `${legacyPath(uid)}/${sessionId}`)),
  ]);
  logger.success('Cardio session deleted');
  return true;
}
