import { getLocalDateStr } from '@shared/dateUtils';
import { getEntryLevel } from '@shared/exerciseLevels';
import { addSession } from '@features/share/services/sessionHistoryService';
import { clearWorkoutSession, getWorkoutSessionId, isWorkoutSessionStarted, saveWorkoutSession } from '@utils/workoutSessionStorage';
import { useUIStore } from '@store/useUIStore';

/** History is written before the receipt. A deterministic ID makes replay harmless. */
export function applyWearSessionEffect(effect, progress) {
  if (!effect) return;
  const { sessionId, queue, startedAt, endedAt, catalog } = effect;
  if (effect.type === 'session_start') {
    if (!isWorkoutSessionStarted() && catalog.date === getLocalDateStr(new Date())) {
      saveWorkoutSession({ queue, currentIdx: 0, startTime: startedAt, name: '', activeSlide: 1, showAll: true, sessionId });
      useUIStore.getState().setSessionInProgress(true);
    }
    return;
  }
  const byId = new Map(catalog.exercises.map(ex => [ex.id, ex]));
  const saved = addSession({
    id: sessionId, date: new Date(startedAt).toISOString(),
    duration: Math.max(0, Math.round((endedAt - startedAt) / 1000)), source: 'wear',
    exercises: queue.map(id => {
      const ex = byId.get(id);
      const entry = progress.completions[catalog.date]?.[id];
      return { ...ex, label: ex.name, reps: entry?.count || 0, level: getEntryLevel(entry), goal: entry?.goal || ex.goal };
    }),
  });
  if (getWorkoutSessionId() === sessionId) {
    clearWorkoutSession();
    useUIStore.getState().setSessionInProgress(false);
    window.dispatchEvent(new CustomEvent('oneup:wear-session-finished', { detail: { sessionId, session: saved } }));
  }
}
