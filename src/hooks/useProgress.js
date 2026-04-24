import { useEffect, useCallback, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLocalStorageScoped } from './useLocalStorageScoped';
import { cloudSync } from '../services/cloudSync';
import { getLocalDateStr } from '../utils/dateUtils';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { saveManualBadgesToCloud, loadManualBadgesFromCloud } from '../services/userDataService';
import i18n from '../i18n';

const STORAGE_KEY_BASE = 'pushup_challenge_data';
const NOTIFICATION_ID = 1;

/** Default empty state for signed-out or new users */
function getDefaultState() {
  const currentYear = new Date().getFullYear();
  return {
    startDate: `${currentYear}-01-01`,
    userStartDate: `${currentYear}-01-01`,
    completions: {},
    isSetup: false,
    hasShared: false,
    manualBadges: {},
  };
}

/**
 * Migrate legacy flat completions entry to the new per-exercise structure.
 * Old format 1: completions[dateStr] = { done, pushupCount, timestamp, timeOfDay }
 * Old format 2: completions[dateStr][exerciseId] = { count, done, timestamp, timeOfDay }
 * New: completions[dateStr][exerciseId] = { isCompleted, timestamp, timeOfDay }
 */
function migrateLegacyEntry(entry) {
  // Detect new per-exercise format by checking if ANY value is a nested object
  // with exercise-like properties. This handles bodyweight, weighted, AND custom exercises
  // without needing to hardcode exercise IDs.
  const hasExerciseEntry = Object.values(entry).some(
    val => val && typeof val === 'object' && !Array.isArray(val) &&
      ('isCompleted' in val || 'done' in val || 'count' in val)
  );

  if (!hasExerciseEntry) {
    // Legacy flat entry — migrate pushupCount into pushups exercise
    const migrated = {};
    if (entry.done !== undefined || entry.pushupCount !== undefined || entry.isCompleted !== undefined) {
      migrated.pushups = {
        isCompleted: entry.isCompleted || entry.done || false,
        timestamp: entry.timestamp || null,
        timeOfDay: entry.timeOfDay || null,
        ...(entry.difficulty !== undefined ? { difficulty: entry.difficulty } : {})
      };
    }
    return migrated;
  }

  // Has exercise keys — migrate each from {count, done} to {isCompleted}
  const migrated = {};
  for (const [key, val] of Object.entries(entry)) {
    if (val && typeof val === 'object') {
      migrated[key] = {
        isCompleted: val.isCompleted !== undefined ? val.isCompleted : (val.done || false),
        timestamp: val.timestamp || null,
        ...(val.weight !== undefined ? { weight: val.weight } : {}),
        ...(val.difficulty !== undefined ? { difficulty: val.difficulty } : {})
      };
    }
  }
  return migrated;
}

/**
 * Validate and sanitize progress data loaded from localStorage.
 * Protects against corrupted or partial data, and migrates legacy entries.
 */
function validateProgressData(data) {
  if (!data || typeof data !== 'object') return null;

  const rawCompletions =
    data.completions && typeof data.completions === 'object' && !Array.isArray(data.completions)
      ? data.completions
      : {};

  // Migrate legacy flat entries
  const completions = {};
  for (const [dateStr, entry] of Object.entries(rawCompletions)) {
    if (entry && typeof entry === 'object') {
      completions[dateStr] = migrateLegacyEntry(entry);
    }
  }

  return {
    startDate: typeof data.startDate === 'string' ? data.startDate : `${new Date().getFullYear()}-01-01`,
    userStartDate:
      typeof data.userStartDate === 'string'
        ? data.userStartDate
        : data.startDate || `${new Date().getFullYear()}-01-01`,
    completions,
    isSetup: typeof data.isSetup === 'boolean' ? data.isSetup : false,
    hasShared: typeof data.hasShared === 'boolean' ? data.hasShared : false,
    manualBadges: typeof data.manualBadges === 'object' && data.manualBadges !== null ? data.manualBadges : {},
  };
}

/** Custom parser for progress data — handles year validation and legacy migration */
function parseProgressData(parsed) {
  const validated = validateProgressData(parsed);
  if (!validated) return null;

  const currentYear = new Date().getFullYear();
  const fixedStartDate = `${currentYear}-01-01`;

  if (validated.startDate !== fixedStartDate) {
    return {
      ...getDefaultState(),
      hasShared: validated.hasShared ?? false,
      manualBadges: validated.manualBadges ?? {},
    };
  }

  if (validated.isSetup === undefined) {
    return { ...validated, isSetup: true, userStartDate: validated.startDate, lastCompletionChange: Date.now(), manualBadges: validated.manualBadges ?? {} };
  }

  return { ...validated, lastCompletionChange: Date.now(), hasShared: validated.hasShared ?? false, manualBadges: validated.manualBadges ?? {} };
}

/** Build a "day done" object for all exercises (used in backfill) */
function makeAllDone(selectedExercises = null, difficulties = {}) {
  const entry = {};
  const now = new Date().toISOString();
  const validateTime = Date.now();
  const exercisesToComplete = selectedExercises 
    ? EXERCISES.filter(ex => selectedExercises.includes(ex.id))
    : EXERCISES;
  
  for (const ex of exercisesToComplete) {
    const diff = difficulties[ex.id];
    entry[ex.id] = { 
        isCompleted: true, 
        timestamp: now, 
        validatedAt: validateTime,
        ...((diff !== undefined && diff !== null && diff !== 1.0) ? { difficulty: diff } : {})
    };
  }
  return entry;
}

export function useProgress(userId) {
  const [state, setState] = useLocalStorageScoped(
    STORAGE_KEY_BASE, userId, getDefaultState(), parseProgressData
  );

  // Sync manual badges to cloud when they change
  useEffect(() => {
    if (state.manualBadges && Object.keys(state.manualBadges).length > 0) {
      saveManualBadgesToCloud(state.manualBadges).catch(() => {});
    }
  }, [state.manualBadges]);

  // Load manual badges from cloud on init (for logged-in users)
  useEffect(() => {
    loadManualBadgesFromCloud().then(cloudBadges => {
      if (cloudBadges && Object.keys(cloudBadges).length > 0) {
        setState(prev => ({
          ...prev,
          manualBadges: { ...prev.manualBadges, ...cloudBadges }
        }));
      }
    }).catch(() => {});
  }, [setState]);

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
          newCompletions[getLocalDateStr(loopDate)] = makeAllDone(selectedExercises, difficulties);
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
        const now = new Date().toISOString();
        for (const [exId, exData] of Object.entries(day)) {
          updated[exId] = { ...exData, isCompleted: false, timestamp: now };
        }
        newCompletions[dateStr] = updated;
      } else {
        // Mark all exercises as done
        newCompletions[dateStr] = makeAllDone(null, difficulties);
      }
      return { ...prev, completions: newCompletions, lastCompletionChange: Date.now() };
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
        timestamp = new Date().toISOString();
      } else if (wasDone && !isNowDone) {
        timestamp = new Date().toISOString(); // Keep a timestamp so cloud sync knows it was recently unchecked
      }

      day[exerciseId] = { 
        count: finalCount, 
        isCompleted: isNowDone, 
        timestamp, 
        ...((weight !== null && weight !== undefined) ? { weight } : {}),
        ...((difficulty !== null && difficulty !== undefined && difficulty !== 1.0) ? { difficulty } : {})
      };
      newCompletions[dateStr] = day;

      // Only trigger cloud save when completion status or weight actually changes
      const completionChanged = wasDone !== isNowDone;
      const weightChanged = weight !== null && weight !== (current.weight ?? null);
      const difficultyChanged = difficulty !== null && difficulty !== (current.difficulty ?? null);
      const needsCloudSync = completionChanged || weightChanged || difficultyChanged;
      return {
        ...prev,
        completions: newCompletions,
        ...(needsCloudSync ? { lastCompletionChange: Date.now() } : {}),
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

  const scheduleNotification = async (settings) => {
    try {
      const permission = await LocalNotifications.checkPermissions();

      if (permission.display === 'granted') {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });

        if (settings?.notificationsEnabled) {
          const { hour, minute } = settings.notificationTime;

          const now = new Date();
          let notificationTime = new Date();
          notificationTime.setHours(hour, minute, 0, 0);

          if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }

          let notificationDateStr = getLocalDateStr(notificationTime);
          let safetyCounter = 0;

          // Skip already-done days
          while (isDayDone(notificationDateStr) && safetyCounter < 365) {
            notificationTime.setDate(notificationTime.getDate() + 1);
            notificationDateStr = getLocalDateStr(notificationTime);
            safetyCounter++;
          }

          const dayNum = getDayNumber(notificationDateStr);

          const messages = [
            i18n.t('notifications.body1', { day: dayNum }),
            i18n.t('notifications.body2'),
            i18n.t('notifications.body3'),
            i18n.t('notifications.body4', { day: dayNum }),
          ];
          const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

          await LocalNotifications.schedule({
            notifications: [
              {
                id: NOTIFICATION_ID,
                title: i18n.t('notifications.title'),
                body: selectedMessage,
                schedule: { at: notificationTime, repeats: true, every: 'day' },
                sound: null,
                attachments: null,
                actionTypeId: '',
                extra: null,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.debug('Notification scheduling failed:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.debug('Permission request failed:', error);
    }
  };

  // ─── Cloud Sync ───────────────────────────────────────────────────────────

  // Guard: skip incoming cloud updates triggered by our own writes
  const isLocalWriteRef = useRef(false);
  // Ref to always have the latest state without re-creating callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  // Guard against concurrent saves
  const isSavingRef = useRef(false);

  const saveToCloud = useCallback(async () => {
    if (isSavingRef.current) return { success: false, error: 'Save in progress' };
    isSavingRef.current = true;
    try {
      isLocalWriteRef.current = true;
      await cloudSync.saveToCloud(stateRef.current);
      // Reset after a shorter delay to avoid missing legitimate incoming changes
      setTimeout(() => { isLocalWriteRef.current = false; }, 800);
      return { success: true };
    } catch (error) {
      isLocalWriteRef.current = false;
      console.error('Failed to save to cloud:', error);
      return { success: false, error: error.message };
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const loadFromCloud = useCallback(async () => {
    try {
      const cloudData = await cloudSync.loadFromCloud();
      if (cloudData) {
        setState(() => {
          const validated = validateProgressData(cloudData);
          return {
            startDate: validated.startDate,
            userStartDate: validated.userStartDate,
            completions: validated.completions || {},
            isSetup: validated.isSetup,
            hasShared: validated.hasShared ?? false,
            manualBadges: validated.manualBadges ?? {},
          };
        });
        return { success: true, data: cloudData };
      }
      return { success: false, error: 'No cloud data found' };
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  const syncWithCloud = useCallback(async () => {
    try {
      isLocalWriteRef.current = true;
      const mergedData = await cloudSync.syncData(stateRef.current);
      setState(validateProgressData(mergedData) || mergedData);
      // Reset after a shorter delay
      setTimeout(() => { isLocalWriteRef.current = false; }, 800);
      return { success: true, data: mergedData };
    } catch (error) {
      isLocalWriteRef.current = false;
      console.error('Failed to sync with cloud:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  /**
   * Merges data from the guest (anonymous) account into the current user's state.
   * Useful when a user performs exercises before signing in.
   */
  const mergeWithAnonymousData = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return { success: false, error: 'No guest data found' };
      
      const guestData = JSON.parse(saved);
      const validated = validateProgressData(guestData);
      if (!validated) return { success: false, error: 'Invalid guest data' };

      setState(prev => {
        const merged = cloudSync.mergeData(prev, validated);
        return {
          ...prev,
          startDate: merged.startDate || prev.startDate,
          userStartDate: merged.userStartDate || prev.userStartDate,
          completions: merged.completions || prev.completions,
          isSetup: merged.isSetup || prev.isSetup,
          hasShared: merged.hasShared || prev.hasShared,
          manualBadges: { ...prev.manualBadges, ...merged.manualBadges },
          lastCompletionChange: Date.now(),
        };
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to merge guest data:', error);
      return { success: false, error: error.message };
    }
  }, [setState]);

  /** 
   * Clears the guest (anonymous) data from localStorage.
   * Should be called after a successful merge or when the user chooses to discard guest data.
   */
  const clearAnonymousData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_BASE);
  }, []);

  /**
   * Check if there is significant guest data (e.g. at least one completion).
   */
  const hasGuestData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (!saved) return false;
      const data = JSON.parse(saved);
      return data?.completions && Object.keys(data.completions).length > 0;
    } catch {
      return false;
    }
  }, []);

  /**
   * Start listening to real-time cloud changes (Firebase onValue).
   * When another device writes, this callback fires and merges the incoming data.
   * Returns an unsubscribe function.
   */
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

      const newState = { ...prev, completions: nextCompletions, lastCompletionChange: Date.now() };
      newStateToSync = newState;
      return newState;
    });
    return newStateToSync;
  }, [setState]);

  const startCloudListener = useCallback(() => {
    return cloudSync.listenToCloudChanges((cloudData) => {
      // Skip if this change was triggered by our own write
      if (isLocalWriteRef.current) return;
      if (!cloudData || !cloudData.completions) return;

      setState(prev => {
        const validated = validateProgressData(cloudData);
        // Only update if cloud data actually differs
        const cloudJSON = JSON.stringify(validated.completions);
        const localJSON = JSON.stringify(prev.completions);
        if (cloudJSON === localJSON) return prev;

        console.debug('[Real-time sync] Incoming cloud update applied');
        const merged = cloudSync.mergeData(prev, validated);

        return {
          startDate: merged.startDate || prev.startDate,
          userStartDate: merged.userStartDate || prev.userStartDate,
          completions: merged.completions || prev.completions,
          isSetup: merged.isSetup ?? prev.isSetup,
          hasShared: merged.hasShared ?? prev.hasShared,
          manualBadges: merged.manualBadges || prev.manualBadges,
          lastCompletionChange: Date.now(),
        };
      });
    });
  }, [setState]);

  // ─── Return ───────────────────────────────────────────────────────────────

  const setHasShared = useCallback(() => {
    setState(prev => ({ ...prev, hasShared: true }));
  }, [setState]);

  return {
    startDate: state.startDate,
    completions: state.completions,
    hasShared: state.hasShared,
    manualBadges: state.manualBadges,
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
    mergeWithAnonymousData,
    clearAnonymousData,
    hasGuestData,
    setManualBadge: (badgeId, value) => {
      setState(prev => ({ ...prev, manualBadges: { ...prev.manualBadges, [badgeId]: value } }));
    },
    validateBadge: (badgeId) => {
      setState(prev => ({ ...prev, manualBadges: { ...prev.manualBadges, [badgeId]: true } }));
    },
    invalidateBadge: (badgeId) => {
      setState(prev => ({ ...prev, manualBadges: { ...prev.manualBadges, [badgeId]: false } }));
    },
  };
}
