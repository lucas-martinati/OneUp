import { ref, set, get, remove, push } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';

const logger = createLogger('Cardio');

// ── Save a cardio session ──────────────────────────────────────────────

export async function saveCardioSession(session) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  const sessionsRef = ref(database, `users/${auth.currentUser.uid}/cardio/sessions`);
  const newRef = push(sessionsRef);
  const payload = {
    ...session,
    id: session.id || newRef.key, // Use provided ID (Strava ID) or Firebase key
    createdAt: Date.now(),
  };

  await set(newRef, payload);
  logger.success('Cardio session saved');
  return payload;
}

// ── Load all cardio sessions ───────────────────────────────────────────

export async function loadCardioSessions() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return [];

  const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/cardio/sessions`));
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

  await remove(ref(database, `users/${auth.currentUser.uid}/cardio/sessions/${sessionId}`));
  logger.success('Cardio session deleted');
  return true;
}
