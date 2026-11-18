import { getLocalDateStr } from '@shared/dateUtils';
import { getEntryLevel } from '@shared/exerciseLevels';
import { addSession } from '@features/share/services/sessionHistoryService';
import { generateSessionName } from '@utils/sessionNameGenerator';
import { clearWorkoutSession, getWorkoutSessionId, isWorkoutSessionStarted, saveWorkoutSession } from '@utils/workoutSessionStorage';
import { useExercisesStore } from '@store/useExercisesStore';
import { useUIStore } from '@store/useUIStore';

function detectRoutineName(queue, routines) {
  if (!Array.isArray(routines) || routines.length === 0) return '';
  for (const routine of routines) {
    if (Array.isArray(routine.exerciseIds) && routine.exerciseIds.length === queue.length
      && routine.exerciseIds.every((id, idx) => id === queue[idx])) {
      return routine.name || '';
    }
  }
  return '';
}

/** History is written before the receipt. A deterministic ID makes replay harmless. */
export function applyWearSessionEffect(effect, progress, t) {
  if (!effect) return;
  const { sessionId, queue, startedAt, endedAt, catalog, routineName } = effect;
  const matchedRoutine = routineName || detectRoutineName(queue, useExercisesStore.getState().routines);
  if (effect.type === 'session_start') {
    if (!isWorkoutSessionStarted() && catalog.date === getLocalDateStr(new Date())) {
      saveWorkoutSession({ queue, currentIdx: 0, startTime: startedAt, name: matchedRoutine, activeSlide: 1, showAll: true, sessionId });
      useUIStore.getState().setSessionInProgress(true);
    }
    return;
  }
  const byId = new Map(catalog.exercises.map(ex => [ex.id, ex]));
  const exercises = queue.map(id => {
    const ex = byId.get(id);
    const entry = progress.completions[catalog.date]?.[id];
    return { ...ex, label: ex.name, reps: entry?.count || 0, level: getEntryLevel(entry), goal: entry?.goal || ex.goal };
  });
  const isoDate = new Date(startedAt).toISOString();
  let sessionName = matchedRoutine;
  if (!sessionName && typeof t === 'function') {
    const totalReps = exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
    sessionName = generateSessionName(t, {
      date: isoDate,
      totalReps,
      exerciseCount: exercises.length,
      isPerfectDay: false,
    });
  }
  const saved = addSession({
    id: sessionId, date: isoDate, name: sessionName,
    duration: Math.max(0, Math.round((endedAt - startedAt) / 1000)), source: 'wear',
    exercises,
  });
  if (getWorkoutSessionId() === sessionId) {
    clearWorkoutSession();
    useUIStore.getState().setSessionInProgress(false);
    window.dispatchEvent(new CustomEvent('oneup:wear-session-finished', { detail: { sessionId, session: saved } }));
  }
}
