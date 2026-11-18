import { getSessionHistory } from '@features/share/services/sessionHistoryService';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { CATEGORIES, CATEGORY_COLORS } from '@config/categories';
import { THEMES } from '@config/themes';
import { getProgressGoal, getRecordedReps } from '@shared/exerciseLevels';
import { getLocalDateStr } from '@shared/dateUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { isWorkoutSessionStarted, loadWorkoutSession, getWorkoutSessionId } from '@utils/workoutSessionStorage';
import { WEAR_VERSION } from './wearProtocol';

function buildWatchStrings(t) {
  return {
    day: t('dashboard.day'),
    routines: t('routines.title'),
    noRoutines: t('wear.watch.noRoutines'),
    myWorkout: t('wear.watch.myWorkout'),
    openOnPhone: t('wear.watch.openOnPhone'),
    syncSubtitle: t('wear.watch.syncSubtitle'),
    syncBtn: t('wear.watch.syncBtn'),
    proRequired: t('wear.watch.proRequired'),
    activateOnPhone: t('wear.watch.activateOnPhone'),
    noExercises: t('wear.watch.noExercises'),
    addOnPhone: t('wear.watch.addOnPhone'),
    selectedSuffix: t('wear.watch.selectedSuffix'),
    startWorkout: t('wear.watch.startWorkout'),
    resume: t('timer.resume'),
    pause: t('timer.pause'),
    timer: t('customExercises.typeTimer'),
    rest: t('wear.watch.rest'),
    recovery: t('wear.watch.recovery'),
    next: t('common.next'),
    back: t('onboarding.back'),
    continueBtn: t('common.continue'),
    finishBtn: t('cardio.finish'),
    finishSession: t('workout.finish'),
    finishPrompt: t('wear.watch.finishPrompt'),
    workoutDone: t('workout.sessionDone'),
    waitingSync: t('wear.watch.waitingSync'),
    synced: t('wear.watch.synced'),
    home: t('wear.watch.home'),
    reps: t('common.reps'),
  };
}

export function buildWearSnapshot({ progress, exerciseStore, stats, settings, isPro, scope, t, language, userId = progress._userId, now = new Date() }) {
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
  const routines = ready ? (exerciseStore.routines || [])
    .map(r => ({
      id: String(r.id || ''),
      name: String(r.name || '').trim(),
      exerciseIds: Array.isArray(r.exerciseIds) ? r.exerciseIds.filter(id => allowed.has(id)) : [],
    }))
    .filter(r => r.id && r.name && r.exerciseIds.length > 0) : [];
  const themeKey = isPro && settings?.appTheme ? settings.appTheme : 'dark';
  const resolvedTheme = THEMES.find(th => th.key === themeKey) || THEMES[0];
  const saved = isWorkoutSessionStarted() ? loadWorkoutSession() : null;
  const session = saved && saved.queue.every(id => allowed.has(id)) ? {
    id: getWorkoutSessionId(), queue: saved.queue, index: saved.currentIdx,
    startedAt: saved.startTime || now.getTime(), name: saved.name, date,
  } : null;
  return {
    expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime(),
    version: WEAR_VERSION, scope, ready, date, day: Math.max(0, day), language: language || 'en',
    streak: stats?.displayStreak || stats?.yesterdayStreak || 0,
    streakActive: !!stats?.isTodayCompleted,
    streakFrozen: !!stats?.isTodayFrozen,
    theme: { key: resolvedTheme.key, bg: resolvedTheme.color, accent: resolvedTheme.accent, accent2: resolvedTheme.accent2 },
    strings: buildWatchStrings(t),
    lastFinishedSessionId: ready ? getSessionHistory()[0]?.id || null : null,
    categories: ready ? categories : [], exercises, routines, receipts: progress.wearReceipts || {}, session,
  };
}
