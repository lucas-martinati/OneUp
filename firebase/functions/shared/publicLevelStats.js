import { EXERCISES, WEIGHT_EXERCISES, CARDIO_EXERCISES } from './exerciseRules.js';
import { computeLevelStreaks } from './exerciseLevels.js';
import { computeCardioLevelStreaks } from './cardioLevels.js';

// All known exercise ids (standard + weights + cardio), as a flat list.
const ALL_EX_OBJECTS = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES];

export function computeExerciseDerived(completions, anchorDateStr, frozenDays = {}, startDate = null, weekStartDay = 'monday') {
  // Per-exercise total days completed. Dates before the challenge start are
  // excluded — e.g. cardio weeks retroactively marked "completed" from
  // historical Health Connect/Strava imports that predate the user's own
  // challenge (see the reps loop in recomputeLeaderboardEntry for the same rule).
  const exerciseDays = {};
  for (const ex of ALL_EX_OBJECTS) exerciseDays[ex.id] = 0;
  for (const [dateStr, day] of Object.entries(completions)) {
    if (!day || typeof day !== 'object') continue;
    if (startDate && dateStr < startDate) continue;
    for (const ex of ALL_EX_OBJECTS) {
      if (day[ex.id]?.isCompleted) exerciseDays[ex.id]++;
    }
  }

  const globalLevels = computeLevelStreaks(completions, anchorDateStr, { frozenDays, startDate, weekStartDay });
  const exerciseLevels = {};
  const exerciseStreaks = {};
  const exerciseDoneToday = {};
  for (const ex of ALL_EX_OBJECTS) {
    const levels = ex.id === 'running' || ex.id === 'cycling'
      ? computeCardioLevelStreaks(completions, ex.id, startDate, anchorDateStr, weekStartDay)
      : computeLevelStreaks(completions, anchorDateStr, { exerciseId: ex.id, startDate });
    exerciseDoneToday[ex.id] = levels.active ?? !!completions[anchorDateStr]?.[ex.id]?.isCompleted;
    exerciseStreaks[ex.id] = exerciseDoneToday[ex.id] ? levels.streak : 0;
    exerciseLevels[ex.id] = levels;
  }
  return { exerciseDays, exerciseStreaks, exerciseDoneToday, globalLevels, exerciseLevels };
}
