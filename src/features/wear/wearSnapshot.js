import { getSessionHistory } from '@features/share/services/sessionHistoryService';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { CATEGORIES, CATEGORY_COLORS } from '@config/categories';
import { getProgressGoal, getRecordedReps } from '@shared/exerciseLevels';
import { getLocalDateStr } from '@shared/dateUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { isWorkoutSessionStarted, loadWorkoutSession, getWorkoutSessionId } from '@utils/workoutSessionStorage';
import { WEAR_VERSION } from './wearProtocol';

export function buildWearSnapshot({ progress, exerciseStore, stats, isPro, scope, t, language, userId = progress._userId, now = new Date() }) {
  const date = getLocalDateStr(now);
  const day = progress.getDayNumber(date);
  const ready = !!(progress.isStoreInitialized && exerciseStore.isStoreInitialized && progress.isSetup && day > 0
    && progress._userId === userId && exerciseStore._userId === userId);
  const customs = exerciseStore.customExercises || [];
  const customCategories = exerciseStore.customCategories || [];
  const categories = [
    { id: CATEGORIES.BODYWEIGHT, name: t('common.bodyweight'), color: CATEGORY_COLORS.bodyweight },
    { id: CATEGORIES.WEIGHTS, name: t('common.weights'), color: CATEGORY_COLORS.weights, locked: !isPro },
    { id: CATEGORIES.CUSTOM, name: t('workout.custom'), color: CATEGORY_COLORS.custom, locked: !isPro },
    ...customCategories.filter(cat => cat.id !== 'custom').map(cat => ({ ...cat, locked: !isPro })),
  ];
  const all = [
    ...EXERCISES.map(ex => ({ ...ex, categoryId: CATEGORIES.BODYWEIGHT })),
    ...WEIGHT_EXERCISES.map(ex => ({ ...ex, categoryId: CATEGORIES.WEIGHTS })),
    ...customs.map(ex => ({ ...ex, categoryId: ex.categoryId || CATEGORIES.CUSTOM })),
  ];
  const exercises = ready ? all.map(ex => {
    const entry = progress.completions[date]?.[ex.id];
    const weight = entry?.weight ?? exerciseStore.getWeight(ex.id);
    return {
      id: ex.id, name: getExerciseLabel(ex), icon: ex.icon || 'Dumbbell', color: ex.color || '#818cf8',
      gradient: ex.gradient?.[0] || ex.color || '#667eea', categoryId: ex.categoryId,
      goal: getProgressGoal(ex, day, entry), count: entry?.count ?? getRecordedReps(entry, ex, day),
      type: ex.type === 'timer' ? 'timer' : 'counter',
      ...(Number.isFinite(weight) ? { weight } : {}),
      locked: !!categories.find(cat => cat.id === ex.categoryId)?.locked,
    };
  }) : [];
  const allowed = new Set(exercises.filter(ex => !ex.locked).map(ex => ex.id));
  const saved = isWorkoutSessionStarted() ? loadWorkoutSession() : null;
  const session = saved && saved.queue.every(id => allowed.has(id)) ? {
    id: getWorkoutSessionId(), queue: saved.queue, index: saved.currentIdx,
    startedAt: saved.startTime || now.getTime(), name: saved.name, date,
  } : null;
  return {
    expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime(),
    version: WEAR_VERSION, scope, ready, date, day: Math.max(0, day), language: language || 'en',
    streak: stats?.displayStreak || stats?.yesterdayStreak || 0,
    lastFinishedSessionId: ready ? getSessionHistory()[0]?.id || null : null,
    categories: ready ? categories : [], exercises, receipts: progress.wearReceipts || {}, session,
  };
}
