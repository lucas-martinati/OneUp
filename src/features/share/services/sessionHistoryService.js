import { ref, set, get } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../../../services/firebase';

const STORAGE_KEY = 'oneup_session_history';
const MAX_SESSIONS = 20;

/**
 * Session History Service
 * Stores the last 20 workout sessions in localStorage and syncs to Firebase.
 * Each session: { id, date, duration, name, type, exercises: [{ id, label, reps, color }] }
 */

function getDefaultExerciseColor() {
  return '#818cf8';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getSessionHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSessionHistoryToCloud(history) {
  try {
    const auth = getAuthInstance();
    const database = getDatabaseInstance();
    if (!auth?.currentUser || !database) return false;
    
    await set(ref(database, `users/${auth.currentUser.uid}/progress/sessionHistory`), history);
    return true;
  } catch (error) {
    console.error('Failed to save session history to cloud', error);
    return false;
  }
}

async function loadSessionHistoryFromCloud() {
  try {
    const auth = getAuthInstance();
    const database = getDatabaseInstance();
    if (!auth?.currentUser || !database) return [];

    const snapshot = await get(ref(database, `users/${auth.currentUser.uid}/progress/sessionHistory`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : [];
    }

    // Migration fallback
    const oldSnapshot = await get(ref(database, `users/${auth.currentUser.uid}/sessionHistory`));
    if (oldSnapshot.exists()) {
      const data = oldSnapshot.val();
      const parsedData = Array.isArray(data) ? data : [];
      await set(ref(database, `users/${auth.currentUser.uid}/progress/sessionHistory`), parsedData);
      await set(ref(database, `users/${auth.currentUser.uid}/sessionHistory`), null);
      return parsedData;
    }

    return [];
  } catch (error) {
    console.error('Failed to load session history from cloud', error);
    return [];
  }
}

export function saveSessionHistory(sessions) {
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  // Async cloud sync
  saveSessionHistoryToCloud(trimmed).catch(() => {});
}

export async function syncSessionHistory() {
  const local = getSessionHistory();
  const cloud = await loadSessionHistoryFromCloud();
  
  if (!cloud || cloud.length === 0) {
    if (local.length > 0) saveSessionHistoryToCloud(local);
    return local;
  }

  // Merge local and cloud by unique ID, then sort by date descending
  const map = new Map();
  cloud.forEach(s => map.set(s.id, s));
  local.forEach(s => {
    if (!map.has(s.id)) {
      map.set(s.id, s);
    } else {
      const existing = map.get(s.id);
      const localUpdated = s.updatedAt || s.date;
      const cloudUpdated = existing.updatedAt || existing.date;
      
      if (new Date(localUpdated) > new Date(cloudUpdated)) {
        map.set(s.id, s);
      }
    }
  });

  const merged = Array.from(map.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_SESSIONS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  saveSessionHistoryToCloud(merged).catch(() => {});
  return merged;
}

export function addSession({ date, duration, name, type, exercises }) {
  const session = {
    id: generateId(),
    date: date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    duration: duration || 0,
    name: name || '',
    type: type || 'bodyweight',
    exercises: (exercises || []).map(ex => ({
      id: ex.id,
      label: ex.label || ex.id,
      reps: ex.reps || ex.goal || 0,
      color: ex.color || getDefaultExerciseColor(),
      icon: ex.icon || 'Dumbbell',
      type: ex.type || 'counter',
      ...(ex.weight ? { weight: ex.weight } : {})
    })),
  };

  const history = getSessionHistory();
  history.unshift(session);
  saveSessionHistory(history);
  return session;
}

export function removeSession(sessionId) {
  const history = getSessionHistory().filter(s => s.id !== sessionId);
  saveSessionHistory(history);
  return history;
}

export function updateSessionName(sessionId, name) {
  const history = getSessionHistory();
  const session = history.find(s => s.id === sessionId);
  if (session) {
    session.name = name;
    session.updatedAt = new Date().toISOString();
    saveSessionHistory(history);
  }
  return history;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
