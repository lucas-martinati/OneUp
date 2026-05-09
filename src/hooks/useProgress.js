import { useEffect, useCallback, useRef } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';
import { getLocalDateStr } from '../utils/dateUtils';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { saveAchievementsToCloud, loadAchievementsFromCloud } from '../services/userDataService';
import { serverTimestamp } from '../services/firebase';
import { useNotificationManager } from './useNotificationManager';
import { useProgressSync } from './useProgressSync';
import { STORAGE_KEY_BASE, getDefaultState, parseProgressData } from './useProgressStorage';

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
        ...((diff !== undefined && diff !== null && diff !== 1.0) ? { difficulty: diff } : {})
    };
  }
  return entry;
}

export function useProgress(userId) {
  const [state, setState] = useLocalStorageScoped(
    STORAGE_KEY_BASE, userId, getDefaultState(), parseProgressData
  );

  const achievementsLoadedRef = useRef(false);

  // Load manual badges from cloud on init (for logged-in users)
  useEffect(() => {
    if (userId) {
      loadAchievementsFromCloud(userId).then(cloudAch => {
        achievementsLoadedRef.current = true;
        
        const finalAch = cloudAch || {};
        let changed = false;
        
        // Initialize critical manual badges to false if they don't exist in cloud
        if (finalAch.first_share === undefined) { finalAch.first_share = false; changed = true; }
        if (finalAch.white_hat === undefined) { finalAch.white_hat = false; changed = true; }

        if (changed) {
          saveAchievementsToCloud(finalAch, userId).catch(() => {});
        }

        setState(prev => ({
          ...prev,
          achievements: finalAch
        }));
      }).catch(err => {
        achievementsLoadedRef.current = true;
        console.error('[Progress] Failed to load achievements:', err);
      });
    } else {
      achievementsLoadedRef.current = false;
    }
  }, [setState, userId]);

  // ─── Challenge Setup ──────────────────────────────────────────────────────

  const startChallenge = (userStartDate, selectedExercises = null, difficulties = {}) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      let userStartStr = prev.startDate;

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
        ...prev,
        completions: newCompletions,
        isSetup: true,
        userStartDate: userStartStr,
      };
    });
  };

  // ─── Day-level helpers ────────────────────────────────────────────────────

  /** Returns true if ANY exercise is done for the given date */
  const isDayDone = (dateStr) => {
    const day = state.completions[dateStr];
    if (!day) return false;
    return Object.values(day).some(ex => ex?.isCompleted === true);
  };

  /** Toggle global day done status (marks/unmarks ALL exercises) */
  const toggleCompletion = (dateStr, difficulties = {}) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = newCompletions[dateStr] || {};
      const currentlyDone = Object.values(day).some(ex => ex?.isCompleted);

      if (currentlyDone) {
        // Mark all exercises as undone
        const updated = {};
        for (const [exId, exData] of Object.entries(day)) {
          updated[exId] = { ...exData, isCompleted: false, timestamp: serverTimestamp() };
        }
        newCompletions[dateStr] = updated;
      } else {
        // Mark all exercises as done
        newCompletions[dateStr] = makeAllDone(null, difficulties);
      }
      return { ...prev, completions: newCompletions, lastCompletionChange: serverTimestamp() };
    });
  };

  // ─── Exercise-level helpers ───────────────────────────────────────────────

  /** Get the rep count for a specific exercise on a given date (counter UI only, capped at goal) */
  const getExerciseCount = (dateStr, exerciseId) => {
    return state.completions[dateStr]?.[exerciseId]?.count || 0;
  };

  /** Get completion status for a specific exercise on a specific date */
  const getExerciseDone = (dateStr, exerciseId) => {
    return state.completions[dateStr]?.[exerciseId]?.isCompleted || false;
  };

  /**
   * Update rep count for a specific exercise. Caps at dailyGoal.
   * Saves isCompleted boolean + timestamp. Count is kept locally for the counter UI
   * but NOT synced to Firebase (only isCompleted is synced).
   */
  const updateExerciseCount = (dateStr, exerciseId, newCount, dailyGoal, weight = null, difficulty = null) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = { ...(newCompletions[dateStr] || {}) };
      const current = day[exerciseId] || {};

      // Cap at dailyGoal
      const finalCount = Math.max(0, Math.min(newCount, dailyGoal));
      const isNowDone = finalCount >= dailyGoal;
      const wasDone = current.isCompleted || false;
      let timestamp = current.timestamp;

      if (!wasDone && isNowDone) {
        timestamp = serverTimestamp();
      } else if (wasDone && !isNowDone) {
        timestamp = serverTimestamp(); // Keep a timestamp so cloud sync knows it was recently unchecked
      }

      day[exerciseId] = { 
        count: finalCount, 
        isCompleted: isNowDone, 
        timestamp, 
        ...((weight !== null && weight !== undefined) ? { weight } : {}),
        ...((difficulty !== null && difficulty !== undefined && difficulty !== 1.0) ? { difficulty } : {})
      };
      newCompletions[dateStr] = day;

      // Trigger cloud save when completion, count, weight, or difficulty changes
      const completionChanged = wasDone !== isNowDone;
      const countChanged = finalCount !== (current.count || 0);
      const weightChanged = weight !== null && weight !== (current.weight ?? null);
      const difficultyChanged = difficulty !== null && difficulty !== (current.difficulty ?? null);
      const needsCloudSync = completionChanged || countChanged || weightChanged || difficultyChanged;
      return {
        ...prev,
        completions: newCompletions,
        ...(needsCloudSync ? { lastCompletionChange: serverTimestamp() } : {}),
      };
    });
  };

  /** Total reps for a given exercise across the whole year (computed from daily goals on completed days) */
  const getTotalReps = (exerciseId, difficultyMultiplier = 1.0) => {
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
  };

  // ─── Day Number ───────────────────────────────────────────────────────────

  const getDayNumber = (dateStr) => {
    if (!state.startDate) return 0;
    const start = new Date(state.startDate);
    const current = new Date(dateStr);

    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());

    const diffTime = utcCurrent - utcStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  
  const { scheduleNotification, requestNotificationPermission } = useNotificationManager({
    isDayDone,
    getDayNumber
  });

  // ─── Delete Exercise Data (Full Purgation) ──────────────────────────────
  const deleteExerciseHistory = useCallback((exId) => {
    let newStateToSync = null;
    setState(prev => {
      const nextCompletions = { ...prev.completions };
      let changed = false;

      for (const date in nextCompletions) {
        if (nextCompletions[date] && nextCompletions[date][exId]) {
          const newDay = { ...nextCompletions[date] };
          delete newDay[exId];
          nextCompletions[date] = newDay;
          changed = true;
        }
      }

      if (!changed) return prev;

      const newState = { ...prev, completions: nextCompletions, lastCompletionChange: serverTimestamp() };
      newStateToSync = newState;
      return newState;
    });
    return newStateToSync;
  }, [setState]);

  // ─── Cloud Sync ───────────────────────────────────────────────────────────

  const {
    saveToCloud,
    loadFromCloud,
    syncWithCloud,
    mergeWithAnonymousData,
    clearAnonymousData,
    hasGuestData,
    startCloudListener
  } = useProgressSync(state, setState);

  // ─── Return ───────────────────────────────────────────────────────────────

  const setHasShared = useCallback(() => {
    setState(prev => {
      const newAch = { ...prev.achievements, first_share: true };
      if (userId) saveAchievementsToCloud(newAch, userId).catch(() => {});
      return { ...prev, achievements: newAch };
    });
  }, [setState, userId]);

  const updateCardioSessions = useCallback((sessions) => {
    setState(prev => {
      const sessionMap = {};
      if (Array.isArray(sessions)) {
        sessions.forEach(s => { if (s.id) sessionMap[s.id] = s; });
      } else if (sessions && typeof sessions === 'object') {
        Object.entries(sessions).forEach(([id, s]) => { sessionMap[id] = s; });
      }

      const nextCardio = { ...prev.cardio, sessions: sessionMap };
      if (JSON.stringify(nextCardio) === JSON.stringify(prev.cardio)) return prev;

      return { ...prev, cardio: nextCardio };
    });
  }, [setState]);

  return {
    startDate: state.startDate,
    completions: state.completions,
    achievements: state.achievements,
    cardio: state.cardio || {},
    hasShared: !!state.achievements?.first_share,
    lastCompletionChange: state.lastCompletionChange,
    startChallenge,
    toggleCompletion,
    getDayNumber,
    isDayDone,
    getExerciseCount,
    getExerciseDone,
    updateExerciseCount,
    getTotalReps,
    getLocalDateStr,
    isSetup: state.isSetup,
    userStartDate: state.userStartDate || state.startDate,
    scheduleNotification,
    requestNotificationPermission,
    deleteExerciseHistory,
    saveToCloud,
    loadFromCloud,
    syncWithCloud,
    startCloudListener,
    setHasShared,
    updateCardioSessions,
    mergeWithAnonymousData,
    clearAnonymousData,
    hasGuestData,
    setManualBadge: (badgeId, value) => {
      setState(prev => {
        const newAch = { ...prev.achievements, [badgeId]: value };
        if (userId) saveAchievementsToCloud(newAch, userId).catch(() => {});
        return { ...prev, achievements: newAch };
      });
    },
    validateBadge: (badgeId) => {
      setState(prev => {
        const newAch = { ...prev.achievements, [badgeId]: true };
        if (userId) saveAchievementsToCloud(newAch, userId).catch(() => {});
        return { ...prev, achievements: newAch };
      });
    },
    invalidateBadge: (badgeId) => {
      setState(prev => {
        const newAch = { ...prev.achievements, [badgeId]: false };
        if (userId) saveAchievementsToCloud(newAch, userId).catch(() => {});
        return { ...prev, achievements: newAch };
      });
    },
  };
}
