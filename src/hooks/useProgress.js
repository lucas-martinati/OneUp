import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { cloudSync } from '../services/cloudSync';
import { getLocalDateStr } from '../utils/dateUtils';
import { EXERCISES } from '../config/exercises';

const STORAGE_KEY = 'pushup_challenge_data';
const NOTIFICATION_ID = 1;

/**
 * Migrate legacy flat completions entry to the new per-exercise structure.
 * Old: completions[dateStr] = { done, pushupCount, timestamp, timeOfDay }
 * New: completions[dateStr][exerciseId] = { count, done, timestamp, timeOfDay }
 */
function migrateLegacyEntry(entry) {
  // Already migrated (has exercise keys, not flat done/pushupCount)
  const exerciseIds = EXERCISES.map(e => e.id);
  const hasExerciseKey = exerciseIds.some(id => id in entry);
  if (hasExerciseKey) return entry;

  // Legacy flat entry — migrate pushupCount into pushups exercise
  const migrated = {};
  if (entry.done !== undefined || entry.pushupCount !== undefined) {
    migrated.pushups = {
      count: entry.pushupCount || 0,
      done: entry.done || false,
      timestamp: entry.timestamp || null,
      timeOfDay: entry.timeOfDay || null,
    };
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
    entry[ex.id] = { count: 0, done: true, timestamp: now, timeOfDay: null };
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
    return Object.values(day).some(ex => ex?.done === true);
  };

  /** Toggle global day done status (marks/unmarks ALL exercises) */
  const toggleCompletion = (dateStr) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = newCompletions[dateStr] || {};
      const currentlyDone = Object.values(day).some(ex => ex?.done);

      if (currentlyDone) {
        // Mark all exercises as undone
        const updated = {};
        for (const [exId, exData] of Object.entries(day)) {
          updated[exId] = { ...exData, done: false, timestamp: null, timeOfDay: null };
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

  /** Get the rep count for a specific exercise on a given date */
  const getExerciseCount = (dateStr, exerciseId) => {
    return state.completions[dateStr]?.[exerciseId]?.count || 0;
  };

  /** Get done status for a specific exercise on a specific date */
  const getExerciseDone = (dateStr, exerciseId) => {
    return state.completions[dateStr]?.[exerciseId]?.done || false;
  };

  /** Update rep count for a specific exercise. Marks done if count >= goal. */
  const updateExerciseCount = (dateStr, exerciseId, newCount, dailyGoal) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const day = { ...(newCompletions[dateStr] || {}) };
      const current = day[exerciseId] || {};

      const finalCount = Math.max(0, newCount);
      const isNowDone = Number(finalCount) >= Number(dailyGoal);
      const wasDone = current.done || false;

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
        timestamp = null;
        timeOfDay = null;
      }

      day[exerciseId] = { ...current, count: finalCount, done: isNowDone, timestamp, timeOfDay };
      newCompletions[dateStr] = day;

      return { ...prev, completions: newCompletions };
    });
  };

  /** Total reps logged for a given exercise across the whole year */
  const getTotalReps = (exerciseId) => {
    return Object.keys(state.completions).reduce((total, dateStr) => {
      if (dateStr < state.startDate) return total;
      const ex = state.completions[dateStr]?.[exerciseId];
      if (!ex?.done) return total;
      return total + (ex.count || 0);
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

  const saveToCloud = useCallback(async () => {
    try {
      await cloudSync.saveToCloud(state);
      return { success: true };
    } catch (error) {
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
      const mergedData = await cloudSync.syncData(state);
      setState(validateProgressData(mergedData) || mergedData);
      return { success: true, data: mergedData };
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
      return { success: false, error: error.message };
    }
  }, [state]);

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
  };
}
