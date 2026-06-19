import { getLocalDateStr, getWeekBounds, getCurrentWeekNumber } from './dateUtils';
import { getWeeklyGoalKm } from '@config/exercises';

/**
 * Évalue une semaine de cardio donnée (décalée de `weekOffset` semaines vers le
 * passé) : calcule l'objectif hebdomadaire pondéré par la difficulté enregistrée
 * et la distance réellement parcourue, puis indique si l'objectif est atteint.
 *
 * Mutualisé entre computeStreak (useCardio), computeCardioCurrentStreak et
 * computeCardioMaxStreak (useComputedStats) afin que ces trois calculs de streak
 * restent strictement cohérents.
 *
 * @returns {{ weekNum: number, achieved: boolean }}
 */
export function evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions = {}) {
  const ref = new Date();
  ref.setDate(ref.getDate() - weekOffset * 7);
  const { start, end } = getWeekBounds(ref);

  const weekNum = getCurrentWeekNumber(challengeStartDate) - weekOffset;

  // Difficulté enregistrée pour la semaine, si présente dans les complétions.
  let weekDifficulty = currentDifficulty;
  const loop = new Date(start);
  while (loop <= end) {
    const dateStr = getLocalDateStr(loop);
    const comp = completions[dateStr]?.[mode];
    if (comp?.isCompleted && comp.difficulty !== undefined) {
      weekDifficulty = comp.difficulty;
      break;
    }
    loop.setDate(loop.getDate() + 1);
  }

  const goalKm = getWeeklyGoalKm(mode, Math.max(1, weekNum)) * weekDifficulty;
  const weekSessions = sessions.filter(
    s => s.type === mode && s.startTime >= start && s.startTime <= end
  );
  const weekDistanceKm = weekSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

  return { weekNum, achieved: weekDistanceKm >= goalKm - 0.01 }; // petite marge d'arrondi
}
