import { create } from 'zustand';
import { serverTimestamp } from '../services/firebase';
import { EXERCISES, getDailyGoal, CARDIO_EXERCISES } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';
import { saveAchievementsToCloud, loadAchievementsFromCloud } from '../services/userDataService';
import { createLogger } from '../utils/logger';
import { getLocalDateStr, isDayDoneFromCompletions } from '../utils/dateUtils';
import { loadCachedEntitlements } from '../utils/entitlements';
import { STORAGE_KEY_BASE, getDefaultState, parseProgressData, validateProgressData } from '../hooks/useProgressStorage';
import { cloudSync } from '../services/cloudSync';

const logger = createLogger('ProgressStore');

// ── localStorage helpers ──────────────────────────────────────────────

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_BASE}_${userId}` : STORAGE_KEY_BASE;
}

function loadFromStorage(userId) {
  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return getDefaultState();
    const parsed = JSON.parse(saved);
    return parseProgressData(parsed) ?? getDefaultState();
  } catch {
    return getDefaultState();
  }
}

function saveToStorage(userId, state) {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    logger.error('Failed to persist progress:', e);
  }
}

/** Build a "day done" object for all exercises (used in backfill) */
function makeAllDone(selectedExercises = null, difficulties = {}, includeTimestamp = true) {
  const entry = {};
  const exercisesToComplete = selectedExercises
    ? EXERCISES.filter(ex => selectedExercises.includes(ex.id))
    : EXERCISES;

  for (const ex of exercisesToComplete) {
    const diff = difficulties[ex.id];
    entry[ex.id] = {
      isCompleted: true,
      ...(includeTimestamp ? { timestamp: serverTimestamp() } : {}),
      ...((diff !== undefined && diff !== null && diff !== 1.0) ? { difficulty: diff } : {}),
    };
  }
  return entry;
}

/**
 * Zustand store for user progress data.
 *
 * Replaces the old useProgress hook + the progress slice of ProgressContext.
 * Handles completions, achievements, day numbers, and exercise counts.
 */
export const useProgressStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────
  startDate: getDefaultState().startDate,
  userStartDate: getDefaultState().userStartDate,
  completions: {},
  isSetup: false,
  achievements: {},
  cardio: {},
  hasShared: false,
  lastCompletionChange: null,
  _userId: null,
  _achievementsLoaded: false,
  _isSaving: false,

  // ── Initialisation ───────────────────────────────────────────────────

  /**
   * Initialise the store for a given user.
   * Loads progress from localStorage and achievements from cloud.
   */
  initForUser: (userId) => {
    const loaded = loadFromStorage(userId);
    set({
      startDate: loaded.startDate,
      userStartDate: loaded.userStartDate || loaded.startDate,
      completions: loaded.completions || {},
      isSetup: loaded.isSetup || false,
      achievements: loaded.achievements || {},
      cardio: loaded.cardio || {},
      hasShared: !!loaded.achievements?.first_share,
      lastCompletionChange: loaded.lastCompletionChange || null,
      _userId: userId,
      _achievementsLoaded: false,
    });

    // Load achievements from cloud (async, non-blocking)
    if (userId) {
      loadAchievementsFromCloud(userId).then(cloudAch => {
        const finalAch = cloudAch || {};
        let changed = false;

        if (finalAch.first_share === undefined) { finalAch.first_share = false; changed = true; }
        if (finalAch.white_hat === undefined) { finalAch.white_hat = false; changed = true; }

        if (changed) {
          saveAchievementsToCloud(finalAch, userId).catch(() => {});
        }

        set({
          achievements: finalAch,
          hasShared: !!finalAch.first_share,
          _achievementsLoaded: true,
        });
      }).catch(err => {
        logger.error('Failed to load achievements:', err);
        set({ _achievementsLoaded: true });
      });
    }
  },

  /**
   * Reset to defaults (e.g. on sign-out).
   */
  reset: () => {
    const defaults = getDefaultState();
    set({
      ...defaults,
      hasShared: false,
      lastCompletionChange: null,
      _userId: null,
      _achievementsLoaded: false,
    });
  },

  // ── Persistence helper ──────────────────────────────────────────────

  /** Persist the current state to localStorage. Called after every mutation. */
  _persist: () => {
    const s = get();
    saveToStorage(s._userId, {
      startDate: s.startDate,
      userStartDate: s.userStartDate,
      completions: s.completions,
      isSetup: s.isSetup,
      achievements: s.achievements,
      cardio: s.cardio,
      lastCompletionChange: s.lastCompletionChange,
    });
  },

  // ── Challenge Setup ─────────────────────────────────────────────────

  startChallenge: (userStartDate, selectedExercises = null, difficulties = {}) => {
    set((state) => {
      const newCompletions = { ...state.completions };
      let userStartStr = state.startDate;

      if (userStartDate) {
        const startYear = userStartDate.getFullYear();
        const startMonth = userStartDate.getMonth();
        const startDay = userStartDate.getDate();

        const start = new Date(startYear, startMonth, startDay);
        userStartStr = getLocalDateStr(start);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const loopDate = new Date(start);
        while (loopDate < today) {
          newCompletions[getLocalDateStr(loopDate)] = makeAllDone(selectedExercises, difficulties, false);
          loopDate.setDate(loopDate.getDate() + 1);
        }
      }
      return {
        completions: newCompletions,
        isSetup: true,
        userStartDate: userStartStr,
      };
    });
    get()._persist();
  },

  // ── Day-level helpers ───────────────────────────────────────────────

  isDayDone: (dateStr) => {
    const day = get().completions[dateStr];
    if (!day) return false;
    return Object.values(day).some(ex => ex?.isCompleted === true);
  },

  toggleCompletion: (dateStr, difficulties = {}) => {
    set((state) => {
      const newCompletions = { ...state.completions };
      const day = newCompletions[dateStr] || {};
      const currentlyDone = Object.values(day).some(ex => ex?.isCompleted);

      if (currentlyDone) {
        const updated = {};
        for (const [exId, exData] of Object.entries(day)) {
          updated[exId] = { ...exData, isCompleted: false, timestamp: serverTimestamp() };
        }
        newCompletions[dateStr] = updated;
      } else {
        newCompletions[dateStr] = makeAllDone(null, difficulties);
      }
      return { completions: newCompletions, lastCompletionChange: serverTimestamp() };
    });
    get()._persist();
  },

  // ── Exercise-level helpers ──────────────────────────────────────────

  getExerciseCount: (dateStr, exerciseId) => {
    return get().completions[dateStr]?.[exerciseId]?.count || 0;
  },

  getExerciseDone: (dateStr, exerciseId) => {
    return get().completions[dateStr]?.[exerciseId]?.isCompleted || false;
  },

  updateExerciseCount: (dateStr, exerciseId, newCount, dailyGoal, weight = null, difficulty = null) => {
    set((state) => {
      const newCompletions = { ...state.completions };
      const day = { ...(newCompletions[dateStr] || {}) };
      const current = day[exerciseId] || {};

      const finalCount = Math.max(0, Math.min(newCount, dailyGoal));
      const isNowDone = finalCount >= dailyGoal;
      const wasDone = current.isCompleted || false;
      let timestamp = current.timestamp;

      if (!wasDone && isNowDone) {
        timestamp = serverTimestamp();
      } else if (wasDone && !isNowDone) {
        timestamp = serverTimestamp();
      }

      day[exerciseId] = {
        count: finalCount,
        isCompleted: isNowDone,
        timestamp,
        ...((weight !== null && weight !== undefined) ? { weight } : {}),
        ...((difficulty !== null && difficulty !== undefined && difficulty !== 1.0) ? { difficulty } : {}),
      };
      newCompletions[dateStr] = day;

      const completionChanged = wasDone !== isNowDone;
      const countChanged = finalCount !== (current.count || 0);
      const weightChanged = weight !== null && weight !== (current.weight ?? null);
      const difficultyChanged = difficulty !== null && difficulty !== (current.difficulty ?? null);
      const needsCloudSync = completionChanged || countChanged || weightChanged || difficultyChanged;
      return {
        completions: newCompletions,
        ...(needsCloudSync ? { lastCompletionChange: serverTimestamp() } : {}),
      };
    });
    get()._persist();
  },

  // ── Day Number ──────────────────────────────────────────────────────

  getDayNumber: (dateStr) => {
    const { startDate } = get();
    if (!startDate) return 0;
    const start = new Date(startDate);
    const current = new Date(dateStr);

    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());

    const diffTime = utcCurrent - utcStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  },

  // ── Total Reps ──────────────────────────────────────────────────────

  getTotalReps: (exerciseId, difficultyMultiplier = 1.0) => {
    const state = get();
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (!exercise || !state.startDate) return 0;
    const start = new Date(state.startDate);
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    return Object.keys(state.completions).reduce((total, dateStr) => {
      if (dateStr < state.startDate) return total;
      const ex = state.completions[dateStr]?.[exerciseId];
      if (!ex?.isCompleted) return total;
      const current = new Date(dateStr);
      const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
      const dayNum = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
      return total + getDailyGoal(exercise, dayNum, difficultyMultiplier);
    }, 0);
  },

  // ── Delete Exercise Data ────────────────────────────────────────────

  deleteExerciseHistory: (exId) => {
    let changed = false;
    set((state) => {
      const nextCompletions = { ...state.completions };
      for (const date in nextCompletions) {
        if (nextCompletions[date]?.[exId]) {
          const newDay = { ...nextCompletions[date] };
          delete newDay[exId];
          nextCompletions[date] = newDay;
          changed = true;
        }
      }
      if (!changed) return state;
      return { completions: nextCompletions, lastCompletionChange: serverTimestamp() };
    });
    if (changed) get()._persist();
  },

  // ── Achievements ────────────────────────────────────────────────────

  setHasShared: () => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, first_share: true };
      if (_userId) saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch, hasShared: true };
    });
    get()._persist();
  },

  setManualBadge: (badgeId, value) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: value };
      if (_userId) saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch };
    });
    get()._persist();
  },

  validateBadge: (badgeId) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: true };
      if (_userId) saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch };
    });
    get()._persist();
  },

  invalidateBadge: (badgeId) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: false };
      if (_userId) saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch };
    });
    get()._persist();
  },

  // ── Cardio ──────────────────────────────────────────────────────────

  updateCardioSessions: (sessions) => {
    set((state) => {
      const sessionMap = {};
      if (Array.isArray(sessions)) {
        sessions.forEach(s => { if (s.id) sessionMap[s.id] = s; });
      } else if (sessions && typeof sessions === 'object') {
        Object.entries(sessions).forEach(([id, s]) => { sessionMap[id] = s; });
      }

      const nextCardio = { ...state.cardio, sessions: sessionMap };
      if (JSON.stringify(nextCardio) === JSON.stringify(state.cardio)) return state;
      return { cardio: nextCardio };
    });
    get()._persist();
  },

  // ── Cloud Sync helpers ──────────────────────────────────────────────

  /** Apply data loaded from cloud (loadFromCloud). */
  applyCloudData: (cloudData) => {
    if (!cloudData) return;
    const validated = validateProgressData(cloudData);
    set(() => ({
      startDate: validated.startDate,
      userStartDate: validated.userStartDate,
      completions: validated.completions || {},
      isSetup: validated.isSetup,
    }));
    get()._persist();
  },

  /** Apply merged data from syncWithCloud. */
  applySyncedData: (mergedData) => {
    if (!mergedData) return;
    const validated = validateProgressData(mergedData);
    set((state) => ({
      ...validated,
      achievements: state.achievements, // preserve local achievements
    }));
    get()._persist();
  },

  /** Apply incoming real-time cloud data. */
  applyRealtimeUpdate: (cloudData) => {
    if (!cloudData?.completions) return;
    const validated = validateProgressData(cloudData);
    set((state) => {
      const cloudJSON = JSON.stringify(validated.completions);
      const localJSON = JSON.stringify(state.completions);
      if (cloudJSON === localJSON) return state;

      logger.info('[Real-time sync] Incoming cloud update applied');
      const merged = cloudSync.mergeData(state, validated);
      return {
        startDate: merged.startDate || state.startDate,
        userStartDate: merged.userStartDate || state.userStartDate,
        completions: merged.completions || state.completions,
        isSetup: merged.isSetup ?? state.isSetup,
        lastCompletionChange: merged.lastCompletionChange,
      };
    });
    get()._persist();
  },

  /** Merge guest (anonymous) data into the current user. */
  mergeWithAnonymousData: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return { success: false, error: 'No guest data found' };
      const guestData = JSON.parse(saved);
      const validated = validateProgressData(guestData);
      if (!validated) return { success: false, error: 'Invalid guest data' };

      set((state) => {
        const mergedCompletions = { ...state.completions };
        Object.keys(validated.completions || {}).forEach(dateStr => {
          if (!mergedCompletions[dateStr]) {
            mergedCompletions[dateStr] = { ...validated.completions[dateStr] };
          } else {
            mergedCompletions[dateStr] = {
              ...mergedCompletions[dateStr],
              ...validated.completions[dateStr]
            };
          }
        });

        return {
          startDate: validated.startDate || state.startDate,
          userStartDate: validated.userStartDate || state.userStartDate,
          completions: mergedCompletions,
          isSetup: validated.isSetup || state.isSetup,
          lastCompletionChange: serverTimestamp(),
        };
      });
      get()._persist();
      return { success: true };
    } catch (error) {
      logger.error('Failed to merge guest data:', error);
      return { success: false, error: error.message };
    }
  },

  clearAnonymousData: () => {
    localStorage.removeItem(STORAGE_KEY_BASE);
  },

  hasGuestData: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return false;
      const data = JSON.parse(saved);
      return data?.completions && Object.keys(data.completions).length > 0;
    } catch {
      return false;
    }
  },

  // ── Cloud save/load/sync (delegates to cloudSync service) ───────────

  saveToCloud: async () => {
    const state = get();
    if (state._isSaving) return { success: false, error: 'Save in progress' };
    set({ _isSaving: true });
    try {
      await cloudSync.saveToCloud({
        startDate: state.startDate,
        userStartDate: state.userStartDate,
        completions: state.completions,
        isSetup: state.isSetup,
        lastCompletionChange: state.lastCompletionChange,
        cardio: state.cardio,
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to save to cloud:', error);
      return { success: false, error: error.message };
    } finally {
      set({ _isSaving: false });
    }
  },

  loadFromCloud: async () => {
    try {
      const cloudData = await cloudSync.loadFromCloud();
      if (cloudData) {
        get().applyCloudData(cloudData);
        return { success: true, data: cloudData };
      }
      return { success: false, error: 'No cloud data found' };
    } catch (error) {
      logger.error('Failed to load from cloud:', error);
      return { success: false, error: error.message };
    }
  },

  syncWithCloud: async () => {
    try {
      const state = get();
      const mergedData = await cloudSync.syncData({
        startDate: state.startDate,
        userStartDate: state.userStartDate,
        completions: state.completions,
        isSetup: state.isSetup,
        lastCompletionChange: state.lastCompletionChange,
        cardio: state.cardio,
      });
      if (mergedData) {
        get().applySyncedData(mergedData);
      }
      return { success: true, data: mergedData };
    } catch (error) {
      logger.error('Failed to sync with cloud:', error);
      return { success: false, error: error.message };
    }
  },

  startCloudListener: () => {
    return cloudSync.listenToCloudChanges((cloudData) => {
      get().applyRealtimeUpdate(cloudData);
    });
  },

  // ── Leaderboard Publishing ──────────────────────────────────────────

  /**
   * Publish current stats to the leaderboard.
   * @param {Object} deps - { auth, computedStats, settings }
   */
  publishLeaderboardNow: async (deps) => {
    const { auth, computedStats, settings } = deps;
    try {
      if (!auth.isSignedIn) return;
      const { completions } = get();
      const classicTotalReps = EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const weightsTotalReps = WEIGHT_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const computedCardioReps = CARDIO_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const todayStr = getLocalDateStr(new Date());
      const lastActiveDay = computedStats.todayDone
        ? todayStr
        : computedStats.sortedDates.slice().reverse().find(d => isDayDoneFromCompletions(completions, d)) || null;

      const { isPro, isSupporter } = loadCachedEntitlements();

      await cloudSync.publishToLeaderboard({
        pseudo: settings.leaderboardPseudo || auth.user?.displayName || 'Anonyme',
        totalReps: classicTotalReps + computedCardioReps,
        weightsTotalReps,
        cardioTotalReps: computedCardioReps,
        exerciseReps: computedStats.exerciseReps,
        exerciseDifficulties: settings.exerciseDifficulties,
        achievements: computedStats.badgeCount,
        isPublic: !!settings.leaderboardEnabled,
        lastActiveDay,
        isPerfectToday: computedStats.isPerfectToday,
        localPublishDate: todayStr,
        isPro,
        isSupporter,
      });
    } catch (e) {
      logger.error('Leaderboard publish failed:', e);
    }
  },
}));
