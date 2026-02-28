import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { cloudSync } from '../services/cloudSync';
import { getLocalDateStr } from '../utils/dateUtils';
import { EXERCISES } from '../config/exercises';

const STORAGE_KEY = 'pushup_challenge_data';
const NOTIFICATION_ID = 1;

/**
 * Migrate legacy flat completions entry to the new per-exercise structure.
 * Old format 1: completions[dateStr] = { done, pushupCount, timestamp, timeOfDay }
 * Old format 2: completions[dateStr][exerciseId] = { count, done, timestamp, timeOfDay }
 * New: completions[dateStr][exerciseId] = { isCompleted, timestamp, timeOfDay }
 */
function migrateLegacyEntry(entry) {
  const exerciseIds = EXERCISES.map(e => e.id);
  const hasExerciseKey = exerciseIds.some(id => id in entry);

  if (!hasExerciseKey) {
    // Legacy flat entry — migrate pushupCount into pushups exercise
    const migrated = {};
    if (entry.done !== undefined || entry.pushupCount !== undefined || entry.isCompleted !== undefined) {
      migrated.pushups = {
        isCompleted: entry.isCompleted || entry.done || false,
        timestamp: entry.timestamp || null,
        timeOfDay: entry.timeOfDay || null,
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
        timeOfDay: val.timeOfDay || null,
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
  };
}

/** Build a "day done" object for all exercises (used in backfill) */
function makeAllDone() {
  const entry = {};
  const now = new Date().toISOString();
  for (const ex of EXERCISES) {
    entry[ex.id] = { isCompleted: true, timestamp: now, timeOfDay: null };
  }
  return entry;
}

export function useProgress() {

  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let parsed = null;

    try {
      parsed = saved ? validateProgressData(JSON.parse(saved)) : null;
    } catch {
      parsed = null;
    }

    const currentYear = new Date().getFullYear();
    const fixedStartDate = `${currentYear}-01-01`;

    if (!parsed || parsed.startDate !== fixedStartDate) {
      return {
        startDate: fixedStartDate,
        userStartDate: fixedStartDate,
        completions: {},
        isSetup: false,
      };
    }

    // Legacy support
    if (parsed.isSetup === undefined) {
      return { ...parsed, isSetup: true, userStartDate: parsed.startDate };
    }

    return parsed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ─── Challenge Setup ──────────────────────────────────────────────────────

  const startChallenge = (userStartDate) => {
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
          newCompletions[getLocalDateStr(loopDate)] = makeAllDone();
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
  const toggleCompletion = (dateStr) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = newCompletions[dateStr] || {};
      const currentlyDone = Object.values(day).some(ex => ex?.isCompleted);

      if (currentlyDone) {
        // Mark all exercises as undone
        const updated = {};
        const now = new Date().toISOString();
        for (const [exId, exData] of Object.entries(day)) {
          updated[exId] = { ...exData, isCompleted: false, timestamp: now, timeOfDay: null };
        }
        newCompletions[dateStr] = updated;
      } else {
        // Mark all exercises as done
        newCompletions[dateStr] = makeAllDone();
      }
      return { ...prev, completions: newCompletions };
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
  const updateExerciseCount = (dateStr, exerciseId, newCount, dailyGoal) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = { ...(newCompletions[dateStr] || {}) };
      const current = day[exerciseId] || {};

      // Cap at dailyGoal
      const finalCount = Math.max(0, Math.min(newCount, dailyGoal));
      const isNowDone = finalCount >= dailyGoal;
      const wasDone = current.isCompleted || false;

      let timestamp = current.timestamp;
      let timeOfDay = current.timeOfDay;

      if (!wasDone && isNowDone) {
        const now = new Date();
        timestamp = now.toISOString();
        const hour = now.getHours();
        if (hour < 12) timeOfDay = 'morning';
        else if (hour < 18) timeOfDay = 'afternoon';
        else timeOfDay = 'evening';
      } else if (wasDone && !isNowDone) {
        timestamp = new Date().toISOString(); // Keep a timestamp so cloud sync knows it was recently unchecked
        timeOfDay = null;
      }

      day[exerciseId] = { count: finalCount, isCompleted: isNowDone, timestamp, timeOfDay };
      newCompletions[dateStr] = day;

      return { ...prev, completions: newCompletions };
    });
  };

  /** Total reps for a given exercise across the whole year (computed from daily goals on completed days) */
  const getTotalReps = (exerciseId) => {
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
      return total + Math.max(1, Math.ceil(dayNum * exercise.multiplier));
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
            `🎯 Jour ${dayNum} — Des exercices t'attendent ! 💪`,
            `💥 Challenge : maintiens ta série ! 🔥`,
            `⚡ Entraîne-toi aujourd'hui et garde le cap ! ✨`,
            `🚀 ${dayNum} reps pour garder la flamme ! 🏆`,
          ];
          const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

          await LocalNotifications.schedule({
            notifications: [
              {
                id: NOTIFICATION_ID,
                title: '💪 OneUp — Défi du jour !',
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

  const saveToCloud = useCallback(async () => {
    try {
      isLocalWriteRef.current = true;
      await cloudSync.saveToCloud(state);
      // Reset after a short delay (Firebase onValue fires almost instantly)
      setTimeout(() => { isLocalWriteRef.current = false; }, 1500);
      return { success: true };
    } catch (error) {
      isLocalWriteRef.current = false;
      console.error('Failed to save to cloud:', error);
      return { success: false, error: error.message };
    }
  }, [state]);

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
          };
        });
        return { success: true, data: cloudData };
      }
      return { success: false, error: 'No cloud data found' };
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const syncWithCloud = useCallback(async () => {
    try {
      isLocalWriteRef.current = true;
      const mergedData = await cloudSync.syncData(state);
      setState(validateProgressData(mergedData) || mergedData);
      setTimeout(() => { isLocalWriteRef.current = false; }, 1500);
      return { success: true, data: mergedData };
    } catch (error) {
      isLocalWriteRef.current = false;
      console.error('Failed to sync with cloud:', error);
      return { success: false, error: error.message };
    }
  }, [state]);

  /**
   * Start listening to real-time cloud changes (Firebase onValue).
   * When another device writes, this callback fires and merges the incoming data.
   * Returns an unsubscribe function.
   */
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

        console.log('[Real-time sync] Incoming cloud update applied');
        const merged = cloudSync.mergeData(prev, validated);

        return {
          startDate: merged.startDate || prev.startDate,
          userStartDate: merged.userStartDate || prev.userStartDate,
          completions: merged.completions || prev.completions,
          isSetup: merged.isSetup ?? prev.isSetup,
        };
      });
    });
  }, []);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    startDate: state.startDate,
    completions: state.completions,
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
    saveToCloud,
    loadFromCloud,
    syncWithCloud,
    startCloudListener,
  };
}
