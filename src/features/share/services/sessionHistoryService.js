const STORAGE_KEY = 'oneup_session_history';
const MAX_SESSIONS = 10;

/**
 * Session History Service
 * Stores the last 10 workout sessions in localStorage.
 * Each session: { id, date, duration, name, type, exercises: [{ id, label, reps, color }] }
 */

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

export function saveSessionHistory(sessions) {
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function addSession({ date, duration, name, type, exercises }) {
  const session = {
    id: generateId(),
    date: date || new Date().toISOString(),
    duration: duration || 0,
    name: name || '',
    type: type || 'bodyweight',
    exercises: (exercises || []).map(ex => ({
      id: ex.id,
      label: ex.label || ex.id,
      reps: ex.reps || ex.goal || 0,
      color: ex.color || '#818cf8',
      type: ex.type || 'counter',
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

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
