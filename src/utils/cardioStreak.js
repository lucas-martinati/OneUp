import { getLocalDateStr, getWeekBounds, getCurrentWeekNumber } from '@shared/dateUtils';
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
export function evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions = {}, weekStartDay = 'monday') {
  const ref = new Date();
  ref.setDate(ref.getDate() - weekOffset * 7);
  const { start, end } = getWeekBounds(ref, weekStartDay);

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

/**
 * Streak cardio actuel : nombre de semaines consécutives (en terminant par la
 * semaine en cours) où l'objectif hebdomadaire a été atteint. La semaine en
 * cours peut être incomplète : elle ne casse pas la série si non atteinte.
 * Mutualisé entre useCardio et useComputedStats pour rester strictement
 * cohérent (et notamment ignorer les semaines antérieures au début du défi).
 */
export function computeCardioCurrentStreak(sessions, mode, challengeStartDate, currentDifficulty, completions = {}, weekStartDay = 'monday') {
  if (!sessions.length) return 0;

  let streak = 0;
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const { weekNum, achieved } = evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions, weekStartDay);
    if (weekNum < 1) break;
    if (achieved) {
      streak++;
    } else if (weekOffset > 0) {
      // Semaine manquée : la série s'arrête.
      break;
    }
  }
  return streak;
}

/**
 * Streak cardio maximal : plus longue série de semaines consécutives atteintes
 * (en remettant à zéro à chaque semaine manquée, tout en continuant à
 * parcourir l'historique complet).
 */
export function computeCardioMaxStreak(sessions, mode, challengeStartDate, currentDifficulty, completions = {}, weekStartDay = 'monday') {
  if (!sessions.length) return 0;

  let maxStreak = 0;
  let streak = 0;
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const { weekNum, achieved } = evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions, weekStartDay);
    if (weekNum < 1) break;
    if (achieved) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (weekOffset > 0) {
      // Semaine manquée : on remet à zéro mais on continue pour trouver d'anciens streaks.
      streak = 0;
    }
  }
  return maxStreak;
}
