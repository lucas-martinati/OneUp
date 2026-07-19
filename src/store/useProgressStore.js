import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { serverTimestamp } from '@utils/firebaseTimestamp';
import { EXERCISES, getDailyGoal } from '@config/exercises';
import { createLogger } from '@utils/logger';
import { getLocalDateStr, parseLocalDate, isDayDoneFromCompletions } from '@shared/dateUtils';
import { STORAGE_KEY_BASE, getDefaultState, parseProgressData, validateProgressData } from '@hooks/useProgressStorage';
import { cloudSync } from '@services/cloudSync';

const logger = createLogger('ProgressStore');

// ── Preferences helpers ──────────────────────────────────────────────

function getStorageKey(userId) {
  return userId ? `${STORAGE_KEY_BASE}_${userId}` : STORAGE_KEY_BASE;
}

function getTsMs(t) {
  if (!t) return 0;
  return typeof t === 'number' ? t : new Date(t).getTime();
}

async function loadFromStorage(userId) {
  try {
    const key = getStorageKey(userId);
    const { value: saved } = await Preferences.get({ key });
    
    if (!saved) {
      // 🔄 Seamless migration: if not in Preferences but in localStorage, migrate!
      const legacySaved = localStorage.getItem(key);
      if (legacySaved) {
        logger.info(`Migrating storage to Preferences for ${key}`);
        await Preferences.set({ key, value: legacySaved });
        const parsed = JSON.parse(legacySaved);
        return parseProgressData(parsed) ?? getDefaultState();
      }
      return getDefaultState();
    }
    const parsed = JSON.parse(saved);
    return parseProgressData(parsed) ?? getDefaultState();
  } catch (err) {
    logger.error('Failed to load progress from Preferences:', err);
    return getDefaultState();
  }
}

async function saveToStorage(userId, state) {
  try {
    const key = getStorageKey(userId);
    await Preferences.set({ key, value: JSON.stringify(state) });
  } catch (e) {
    logger.error('Failed to persist progress:', e);
    throw e;
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
      // Capture the device's local hour at completion time. Time-of-day badges
      // (morning/afternoon/evening + the 3-4am "ghost") need the real wall-clock
      // hour, which can't be recovered from the stored UTC timestamp server-side.
      // Both the client and the Cloud Function read this field — see
      // @shared/achievementStats.js — falling back to a UTC approximation only for
      // legacy entries that predate it.
      ...(includeTimestamp ? { timestamp: serverTimestamp(), localHour: new Date().getHours() } : {}),
      // Lock a non-default completion difficulty onto the day so a later global
      // change can't retroactively alter it. 1.0 is the max (full reps) and needs
      // no lock — lowering the goal later still leaves the day done — so it is
      // left unsaved to keep the cloud payload clean.
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
  frozenDays: {},
  streakFreezes: { count: 0, lastRefill: null },
  notes: getDefaultState().notes,
  hasShared: false,
  lastCompletionChange: null,
  isStoreInitialized: false,
  _userId: null,
  _achievementsLoaded: false,
  _isSaving: false,
  _initRequestId: null,

  // ── Initialisation ───────────────────────────────────────────────────

  /**
   * Initialise the store for a given user.
   * Loads progress from localStorage and achievements from cloud.
   */
  initForUser: async (userId) => {
    const requestId = Symbol('init');
    const defaults = getDefaultState();
    set({
      ...defaults,
      hasShared: false,
      lastCompletionChange: null,
      _userId: userId,
      _achievementsLoaded: false,
      isStoreInitialized: false,
      _initRequestId: requestId,
    });

    const loaded = await loadFromStorage(userId);
    if (get()._initRequestId !== requestId) return;

    const finalAch = { ...(loaded.achievements || {}) };
    if (!userId) {
      finalAch.first_share = false;
      finalAch.white_hat = false;
    }
    set({
      startDate: loaded.startDate,
      userStartDate: loaded.userStartDate || loaded.startDate,
      completions: loaded.completions || {},
      isSetup: loaded.isSetup || false,
      achievements: finalAch,
      cardio: loaded.cardio || {},
      frozenDays: loaded.frozenDays || {},
      streakFreezes: loaded.streakFreezes || { count: 0, lastRefill: null },
      notes: loaded.notes || {},
      hasShared: !!finalAch.first_share,
      lastCompletionChange: loaded.lastCompletionChange || null,
      isStoreInitialized: true,
    });

    // Load achievements from cloud (async, non-blocking)
    if (userId) {
      cloudSync.loadAchievementsFromCloud(userId).then(cloudAch => {
        if (get()._initRequestId !== requestId) return;

        const finalAch = { ...(cloudAch || {}) };
        let changed = false;

        if (finalAch.first_share === undefined) { finalAch.first_share = false; changed = true; }
        if (finalAch.white_hat === undefined) { finalAch.white_hat = false; changed = true; }

        if (changed) {
          cloudSync.saveAchievementsToCloud(finalAch, userId).catch(() => {});
        }

        set({
          achievements: finalAch,
          hasShared: !!finalAch.first_share,
          _achievementsLoaded: true,
        });
      }).catch(err => {
        logger.error('Failed to load achievements:', err);
        if (get()._initRequestId === requestId) {
          set({ _achievementsLoaded: true });
        }
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
      isStoreInitialized: false,
      _initRequestId: null,
    });
  },

  // ── Persistence helper ──────────────────────────────────────────────

  /** Persist the current state to Preferences. Called after every mutation. */
  _persist: () => {
    const s = get();
    saveToStorage(s._userId, {
      startDate: s.startDate,
      userStartDate: s.userStartDate,
      completions: s.completions,
      isSetup: s.isSetup,
      achievements: s.achievements,
      cardio: s.cardio,
      frozenDays: s.frozenDays,
      streakFreezes: s.streakFreezes,
      notes: s.notes,
      lastCompletionChange: s.lastCompletionChange,
    }).catch(err => logger.error('Async background persist failed:', err));
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
    return isDayDoneFromCompletions(get().completions, dateStr);
  },

  toggleCompletion: (dateStr, difficulties = {}) => {
    set((state) => {
      const newCompletions = { ...state.completions };
      const day = newCompletions[dateStr] || {};
      const currentlyDone = isDayDoneFromCompletions(newCompletions, dateStr);

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

  // ── Streak Freeze ───────────────────────────────────────────────────

  /**
   * Apply the monthly freeze refill and auto-consume freezes to protect the
   * streak across a gap of missed days ending yesterday. Idempotent and safe to
   * call repeatedly (on load and at each day rollover). Returns the list of days
   * newly frozen this run, so the caller can surface a notification/toast.
   */


  // Streak freezes are a signed-in-only feature. When the user is a guest (or
  // signs out) we wipe the local inventory so guests never hold freezes. Cloud
  // data is re-merged on the next sign-in, so this only clears the local view.
  clearStreakFreezes: () => {
    const state = get();
    if (!state.streakFreezes?.count && !state.streakFreezes?.lastRefill) return;
    set({ streakFreezes: { count: 0, lastRefill: null } });
    get()._persist();
  },

  // ── Notes ───────────────────────────────────────────────────────────

  setNote: (dateStr, text) => {
    set((state) => {
      const newNotes = { ...state.notes };
      if (text && text.trim().length > 0) {
        newNotes[dateStr] = text;
      } else {
        delete newNotes[dateStr];
      }
      return { notes: newNotes, lastCompletionChange: serverTimestamp() };
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
      // Preserve the local hour across count edits; refresh it only when the
      // exercise transitions to done (see makeAllDone for the rationale).
      let localHour = current.localHour;

      if (wasDone !== isNowDone) {
        timestamp = serverTimestamp();
        if (isNowDone) localHour = new Date().getHours();
      }

      // Lock the completion-time difficulty onto the day so later global changes
      // can't retroactively alter it; preserve the existing value when none is
      // supplied. 1.0 is the max (full reps) and needs no lock, so it's left
      // unsaved to keep the cloud payload clean.
      const lockedDifficulty = (difficulty !== null && difficulty !== undefined) ? difficulty : current.difficulty;
      day[exerciseId] = {
        count: finalCount,
        isCompleted: isNowDone,
        timestamp,
        ...(Number.isInteger(localHour) ? { localHour } : {}),
        ...((weight !== null && weight !== undefined) ? { weight } : {}),
        ...((lockedDifficulty !== null && lockedDifficulty !== undefined && lockedDifficulty !== 1.0) ? { difficulty: lockedDifficulty } : {}),
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
    const start = parseLocalDate(startDate);
    const current = parseLocalDate(dateStr);

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
    const start = parseLocalDate(state.startDate);
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    return Object.keys(state.completions).reduce((total, dateStr) => {
      if (dateStr < state.startDate) return total;
      const ex = state.completions[dateStr]?.[exerciseId];
      if (!ex?.isCompleted) return total;
      const current = parseLocalDate(dateStr);
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
      if (_userId) cloudSync.saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch, hasShared: true };
    });
    get()._persist();
  },

  setManualBadge: (badgeId, value) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: value };
      if (_userId) cloudSync.saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch };
    });
    get()._persist();
  },

  validateBadge: (badgeId) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: true };
      if (_userId) cloudSync.saveAchievementsToCloud(newAch, _userId).catch(() => {});
      return { achievements: newAch };
    });
    get()._persist();
  },

  invalidateBadge: (badgeId) => {
    const { _userId } = get();
    set((state) => {
      const newAch = { ...state.achievements, [badgeId]: false };
      if (_userId) cloudSync.saveAchievementsToCloud(newAch, _userId).catch(() => {});
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
      completions: validated.completions,
      isSetup: validated.isSetup,
      cardio: validated.cardio,
      frozenDays: validated.frozenDays,
      streakFreezes: validated.streakFreezes,
      notes: validated.notes,
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
    if (!cloudData) return;
    const validated = validateProgressData(cloudData);
    set((state) => {
      const cloudJSON = JSON.stringify(validated.completions);
      const localJSON = JSON.stringify(state.completions);
      
      const nextSessions = { ...(state.cardio?.sessions || {}), ...(validated.cardio?.sessions || {}) };
      const cardioChanged = JSON.stringify(state.cardio?.sessions) !== JSON.stringify(nextSessions);
      
      if (cloudJSON === localJSON && !cardioChanged) return state;

      logger.info('[Real-time sync] Incoming cloud update applied');
      const merged = cloudSync.mergeData(state, validated);
      return {
        startDate: merged.startDate,
        userStartDate: merged.userStartDate,
        completions: merged.completions,
        isSetup: merged.isSetup,
        lastCompletionChange: merged.lastCompletionChange,
        cardio: { ...state.cardio, sessions: nextSessions },
        frozenDays: merged.frozenDays,
        streakFreezes: merged.streakFreezes,
        notes: merged.notes,
      };
    });
    get()._persist();
  },

  /** Merge guest (anonymous) data into the current user. */
  mergeWithAnonymousData: async () => {
    try {
      // Try to load guest data from Preferences, fallback to legacy localStorage
      const { value: saved } = await Preferences.get({ key: STORAGE_KEY_BASE });
      const legacySaved = localStorage.getItem(STORAGE_KEY_BASE);
      const raw = saved || legacySaved;
      
      if (!raw) return { success: false, error: 'No guest data found' };
      const guestData = JSON.parse(raw);
      const validated = validateProgressData(guestData);
      if (!validated) return { success: false, error: 'Invalid guest data' };

      set((state) => {
        const mergedCompletions = { ...state.completions };
        Object.keys(validated.completions).forEach(dateStr => {
          if (!mergedCompletions[dateStr]) {
            mergedCompletions[dateStr] = { ...validated.completions[dateStr] };
          } else {
            const guestDay = validated.completions[dateStr];
            const userDay = { ...mergedCompletions[dateStr] };
            
            const allExIds = new Set([...Object.keys(guestDay), ...Object.keys(userDay)]);
            for (const exId of allExIds) {
              const guestEx = guestDay[exId];
              const userEx = userDay[exId];
              
              if (!userEx) {
                userDay[exId] = guestEx;
              } else if (guestEx) {
                // Conflict resolution:
                // 1. Prefer completed state
                const isCompleted = !!userEx.isCompleted || !!guestEx.isCompleted;
                
                // 2. Prefer higher rep count
                const count = Math.max(userEx.count || 0, guestEx.count || 0);
                
                // 3. Prefer weight and difficulty if present
                const weight = guestEx.weight !== undefined && guestEx.weight !== null ? guestEx.weight : userEx.weight;
                const difficulty = guestEx.difficulty !== undefined && guestEx.difficulty !== null ? guestEx.difficulty : userEx.difficulty;
                
                // 4. Prefer newer timestamp — and keep the localHour that was
                // captured alongside it so time-of-day badges stay coherent.
                const userTs = getTsMs(userEx.timestamp);
                const guestTs = getTsMs(guestEx.timestamp);
                const preferGuest = guestTs > userTs;
                const timestamp = preferGuest ? guestEx.timestamp : userEx.timestamp;
                const primaryLocalHour = preferGuest ? guestEx.localHour : userEx.localHour;
                const fallbackLocalHour = preferGuest ? userEx.localHour : guestEx.localHour;
                const localHour = Number.isInteger(primaryLocalHour) ? primaryLocalHour : fallbackLocalHour;

                userDay[exId] = {
                  isCompleted,
                  ...(count > 0 ? { count } : {}),
                  ...(weight !== undefined && weight !== null ? { weight } : {}),
                  ...(difficulty !== undefined && difficulty !== null ? { difficulty } : {}),
                  ...(timestamp ? { timestamp } : {}),
                  ...(Number.isInteger(localHour) ? { localHour } : {}),
                };
              }
            }
            mergedCompletions[dateStr] = userDay;
          }
        });

        return {
          startDate: [validated.startDate, state.startDate].filter(Boolean).sort()[0],
          userStartDate: [validated.userStartDate, state.userStartDate].filter(Boolean).sort()[0],
          completions: mergedCompletions,
          isSetup: validated.isSetup || state.isSetup,
          // Union frozen days; keep the inventory with the most recent refill.
          frozenDays: { ...validated.frozenDays, ...state.frozenDays },
          streakFreezes: (state.streakFreezes.lastRefill || '') >= (validated.streakFreezes.lastRefill || '')
            ? state.streakFreezes
            : validated.streakFreezes,
          notes: { ...state.notes, ...validated.notes },
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

  clearAnonymousData: async () => {
    try {
      await Preferences.remove({ key: STORAGE_KEY_BASE });
    } catch (e) {
      logger.error('Failed to clear guest data in Preferences:', e);
    }
    localStorage.removeItem(STORAGE_KEY_BASE);
  },

  hasGuestData: async () => {
    try {
      const { value: saved } = await Preferences.get({ key: STORAGE_KEY_BASE });
      const legacySaved = localStorage.getItem(STORAGE_KEY_BASE);
      const raw = saved || legacySaved;
      if (!raw) return false;
      const data = JSON.parse(raw);
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
        frozenDays: state.frozenDays,
        streakFreezes: state.streakFreezes,
        notes: state.notes,
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
        frozenDays: state.frozenDays,
        streakFreezes: state.streakFreezes,
        notes: state.notes,
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

}));
