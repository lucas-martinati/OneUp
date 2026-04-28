import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadCardioSessions, saveCardioSession } from '../../services/cardioService';
import { stravaService } from '../../services/stravaService';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressContext } from '../../contexts/ProgressContext';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';
import { getLocalDateStr } from '../../utils/dateUtils';

/**
 * Weekly increment in METERS per activity type.
 * Running: +100 m/week cumulative (week N → N × 100 m)
 * Cycling: +210 m/week cumulative (week N → N × 210 m)
 */
const WEEKLY_INCREMENT = {
  running: 450,   // meters
  cycling: 750,   // meters
};

/**
 * Returns the ISO week boundaries (Monday 00:00 → Sunday 23:59) for a given date.
 */
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.getTime(), end: sunday.getTime() };
}

/**
 * Compute the current ISO week number relative to the challenge start date.
 * Week 1 = the first Monday-Sunday period that includes or follows startDate.
 * Optional param targetDate allows computing the week number for a specific past date.
 */
function getCurrentWeekNumber(startDate, targetDate = new Date()) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/**
 * Compute the weekly goal for the current week.
 * Formula: weekNumber × increment (in km)
 */
function getWeeklyGoalKm(mode, weekNumber) {
  const incrementM = WEEKLY_INCREMENT[mode];
  return (weekNumber * incrementM) / 1000;
}

/**
 * Compute the cardio streak: number of consecutive weeks (ending at current)
 * where the weekly goal was met. The day that "counts" for the streak is the
 * day the user reached or exceeded the weekly goal.
 */
function computeStreak(sessions, mode, challengeStartDate, currentDifficulty) {
  if (!sessions.length) return 0;

  const now = new Date();
  let streak = 0;

  // Walk backwards week by week
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const ref = new Date(now);
    ref.setDate(ref.getDate() - weekOffset * 7);
    const { start, end } = getWeekBounds(ref);

    // Compute what week number this was relative to start
    const weekNum = getCurrentWeekNumber(challengeStartDate) - weekOffset;
    if (weekNum < 1) break;

    // Use current difficulty for goal comparison
    const goalKm = getWeeklyGoalKm(mode, weekNum) * currentDifficulty;

    const weekSessions = sessions.filter(
      s => s.type === mode && s.startTime >= start && s.startTime <= end
    );
    const weekDistanceKm = weekSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

    if (weekDistanceKm >= goalKm) {
      streak++;
    } else if (weekOffset > 0) {
      // Current week can be incomplete, skip it for break detection
      break;
    }
  }

  return streak;
}

/**
 * Hook providing cardio data and computations.
 */
export function useCardio() {
  const auth = useAuth();
  const { startDate } = useProgressContext();
  const { getConfig } = useExerciseConfig();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('running');

  // Get difficulty multipliers for cardio exercises
  const runningMultiplier = getConfig('running')?.difficulty || 1;
  const cyclingMultiplier = getConfig('cycling')?.difficulty || 1;

  // Fetch sessions from Firebase and Strava, save new Strava sessions to Firebase
  const fetchSessions = useCallback(async () => {
    if (!auth.isSignedIn) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // Load from Firebase and Strava in parallel
      const [firebaseSessions, stravaActivities] = await Promise.all([
        loadCardioSessions(),
        stravaService.getActivities()
      ]);

      // Merge and deduplicate (by ID)
      const rawFirebase = firebaseSessions || [];
      const all = [];
      const existingIds = new Set();
      
      // First, filter out any duplicates already present in Firebase
      rawFirebase.forEach(s => {
        if (!existingIds.has(s.id)) {
          all.push(s);
          existingIds.add(s.id);
        }
      });

      // Save new Strava activities to Firebase (with difficulty at time of save)
      const newSessions = [];
      stravaActivities.forEach(act => {
        if (!existingIds.has(act.id)) {
          all.push(act);
          existingIds.add(act.id);
          newSessions.push({
            ...act,
            difficulty: act.type === 'running' ? runningMultiplier : cyclingMultiplier,
          });
        }
      });

      // Batch save new sessions to Firebase
      if (newSessions.length > 0) {
        await Promise.all(newSessions.map(s => saveCardioSession(s)));
      }

      // Sort by time descending
      all.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
      setSessions(all);
    } catch (err) {
      console.error('Failed to load cardio sessions', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [auth.isSignedIn, runningMultiplier, cyclingMultiplier]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const { settings, updateSettings, completions, updateExerciseCount } = useProgressContext();

  // Compute total cardio reps: each valid session gives (its weekNumber * 7) reps
  useEffect(() => {
    if (!sessions.length || !startDate) return;
    
    let totalReps = 0;
    // Map of week numbers already counted to avoid duplicates if multiple sessions in same week
    // Actually, we want to count EACH session's contribution to total reps?
    // User says: "chaque session valide donne (weekNum * 7) reps"
    // Wait, if I have 3 sessions in Week 4, do I get 3 * 28 = 84 reps?
    // Current logic does this. I'll keep it as is unless asked otherwise.
    sessions.forEach(s => {
      const weekNum = getCurrentWeekNumber(startDate, new Date(s.startTime));
      totalReps += (weekNum * 7);
    });

    if (settings && settings.cardioTotalReps !== totalReps) {
      updateSettings({ ...settings, cardioTotalReps: totalReps });
    }
  }, [sessions, startDate, settings, updateSettings]);

  // Helper to find if a week has a completion and return its data
  const getWeeklyCompletion = useCallback((mode, refDate = new Date()) => {
    const { start, end } = getWeekBounds(refDate);
    const loop = new Date(start);
    while (loop <= end) {
      const dateStr = getLocalDateStr(loop);
      const comp = completions[dateStr]?.[mode];
      if (comp?.isCompleted) return { dateStr, ...comp };
      loop.setDate(loop.getDate() + 1);
    }
    return null;
  }, [completions]);

  // Sync cardio sessions to global completions to update the global streak & firebase
  useEffect(() => {
    if (!sessions.length || !completions || !updateExerciseCount) return;

    // Group sessions by week to validate the goal only once per week
    const sessionsByWeek = {};
    sessions.forEach(s => {
      if (!s.startTime) return;
      const { start } = getWeekBounds(new Date(s.startTime));
      if (!sessionsByWeek[start]) sessionsByWeek[start] = [];
      sessionsByWeek[start].push(s);
    });

    Object.keys(sessionsByWeek).forEach(weekStart => {
      const weekSessions = sessionsByWeek[weekStart];
      const weekStartNum = parseInt(weekStart);
      const modeSessions = weekSessions.filter(s => s.type === activeMode);
      if (modeSessions.length === 0) return;

      const totalDistanceKm = modeSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
      const weekNum = getCurrentWeekNumber(startDate, new Date(weekStartNum));
      
      const existingComp = getWeeklyCompletion(activeMode, new Date(weekStartNum));
      const goalDifficulty = existingComp ? (existingComp.difficulty || 1) : (activeMode === 'running' ? runningMultiplier : cyclingMultiplier);
      const goalKm = getWeeklyGoalKm(activeMode, weekNum) * goalDifficulty;

      const isGoalReached = totalDistanceKm >= goalKm;

      if (isGoalReached && !existingComp) {
        // Mark the LAST session's date as completed
        const lastSession = modeSessions.sort((a, b) => b.startTime - a.startTime)[0];
        const dateStr = getLocalDateStr(new Date(lastSession.startTime));
        updateExerciseCount(dateStr, activeMode, 1, 1, null, goalDifficulty);
      } else if (!isGoalReached && existingComp) {
        // Unmark if distance dropped below goal (session deleted or difficulty increased)
        updateExerciseCount(existingComp.dateStr, activeMode, 0, 1, null, goalDifficulty);
      }
    });
  }, [sessions, completions, updateExerciseCount, activeMode, startDate, runningMultiplier, cyclingMultiplier, getWeeklyCompletion]);

  // Current week number
  const weekNumber = useMemo(
    () => getCurrentWeekNumber(startDate),
    [startDate]
  );

  // Weekly goal for current week (in km) - apply difficulty multiplier
  const weeklyGoal = useMemo(() => {
    const existingComp = getWeeklyCompletion(activeMode);
    const multiplier = existingComp ? (existingComp.difficulty || 1) : (activeMode === 'running' ? runningMultiplier : cyclingMultiplier);
    const baseGoal = getWeeklyGoalKm(activeMode, weekNumber);
    return baseGoal * multiplier;
  }, [activeMode, weekNumber, runningMultiplier, cyclingMultiplier, getWeeklyCompletion]);

  // Filter sessions by current mode
  const modeSessions = useMemo(
    () => sessions.filter(s => s.type === activeMode),
    [sessions, activeMode]
  );

  // Weekly computations (show actual distance, goal is adjusted by difficulty)
  const weeklyData = useMemo(() => {
    const { start, end } = getWeekBounds();
    const weekSessions = modeSessions.filter(
      s => s.startTime >= start && s.startTime <= end
    );
    // Sum actual distances
    const totalDistanceKm = weekSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

    return {
      distance: totalDistanceKm,
      sessionCount: weekSessions.length,
    };
  }, [modeSessions]);

  // Last session
  const lastSession = useMemo(
    () => modeSessions.length > 0 ? modeSessions[0] : null,
    [modeSessions]
  );

  // Streak
  const streak = useMemo(
    () => computeStreak(sessions, activeMode, startDate, activeMode === 'running' ? runningMultiplier : cyclingMultiplier),
    [sessions, activeMode, startDate, runningMultiplier, cyclingMultiplier]
  );

  return {
    activeMode,
    setActiveMode,
    weekNumber,
    weeklyDistance: weeklyData.distance,
    weeklyGoal,
    weeklySessionCount: weeklyData.sessionCount,
    lastSession,
    streak,
    sessions: modeSessions,
    allSessions: sessions,
    loading,
    refresh: fetchSessions,
  };
}
