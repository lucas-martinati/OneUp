import { ref, set, get, remove, push, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';

const logger = createLogger('Cardio');

// Cardio sessions live in their OWN node, decoupled from `progress`, so their
// (potentially large, location-sensitive) GPS tracks stay private and out of
// the socially-readable progress subtree.
const sessionsPath = uid => `users/${uid}/cardioSessions`;

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

  const snapshot = await get(ref(database, sessionsPath(auth.currentUser.uid)));
  if (snapshot.exists()) {
    const data = snapshot.val();
    const sessions = Object.values(data).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    logger.success(`Loaded ${sessions.length} cardio sessions`);
    return sessions;
  }
  return [];
}

// ── Delete a cardio session ────────────────────────────────────────────

export async function deleteCardioSession(sessionId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await remove(ref(database, `${sessionsPath(auth.currentUser.uid)}/${sessionId}`));
  logger.success('Cardio session deleted');
  return true;
}
