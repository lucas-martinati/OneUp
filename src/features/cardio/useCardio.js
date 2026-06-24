import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { loadCardioSessions, saveCardioSession } from '@services/cardioService';
import { getAllActivities } from '@services/cardioProviders';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { getLocalDateStr, getWeekBounds, getCurrentWeekNumber } from '@utils/dateUtils';
import { getWeeklyGoalKm } from '@config/exercises';
import { evaluateCardioWeek } from '@utils/cardioStreak';

/**
 * Compute the cardio streak: number of consecutive weeks (ending at current)
 * where the weekly goal was met. The day that "counts" for the streak is the
 * day the user reached or exceeded the weekly goal.
 */
function computeStreak(sessions, mode, challengeStartDate, currentDifficulty, completions = {}) {
  if (!sessions.length) return 0;

  let streak = 0;

  // Walk backwards week by week
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const { weekNum, achieved } = evaluateCardioWeek(sessions, mode, weekOffset, challengeStartDate, currentDifficulty, completions);
    if (weekNum < 1) break;

    if (achieved) {
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
  const completions = useProgressStore(s => s.completions);
  const updateExerciseCount = useProgressStore(s => s.updateExerciseCount);
  const updateCardioSessions = useProgressStore(s => s.updateCardioSessions);
  const cardio = useProgressStore(s => s.cardio);
  const startDate = useProgressStore(s => s.startDate);
  const isStoreInitialized = useProgressStore(s => s.isStoreInitialized);
  const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);

  // We are ready only when the auth loading has finished AND
  // (for signed-in users, when the initial cloud sync is complete; for guests, when the local store is initialized)
  const isReady = !auth.loading && (
    auth.isSignedIn 
      ? (isStoreInitialized && isInitialSyncDone) 
      : isStoreInitialized
  );

  const { getConfig } = useExerciseConfig();
  const [sessions, setSessions] = useState(() => {
    // Initialize from context if available to avoid flicker/wiping during initial load
    return Object.values(cardio?.sessions || {}).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  });
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('running');

  // Sync sessions state with store's sessions once the store & sync are fully initialized
  const hasInitializedFromStore = useRef(false);
  useEffect(() => {
    if (isReady && !hasInitializedFromStore.current) {
      const storeSessions = Object.values(cardio?.sessions || {}).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
      setSessions(storeSessions);
      hasInitializedFromStore.current = true;
      setLoading(false);
    }
  }, [isReady, cardio?.sessions]);

  // Get difficulty multipliers for cardio exercises
  const runningMultiplier = getConfig('running')?.difficulty || 1;
  const cyclingMultiplier = getConfig('cycling')?.difficulty || 1;

  // Fetch sessions from Firebase and Strava, save new Strava sessions to Firebase
  const fetchSessions = useCallback(async () => {
    if (!isReady) return; // Wait for initialization to prevent session wiping or premature writes
    if (!auth.isSignedIn) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // Load existing sessions from Firebase
      const firebaseSessions = await loadCardioSessions();
      const rawFirebase = firebaseSessions || [];

      // Determine the latest session start time to fetch only new Strava activities
      let afterTimestamp = 0;
      if (rawFirebase.length > 0) {
        afterTimestamp = rawFirebase.reduce((max, s) => Math.max(max, s.startTime || 0), 0);
      }

      // Fetch new activities from all connected cardio providers (Strava, Health Connect)
      const providerActivities = await getAllActivities(afterTimestamp);

      // Merge and deduplicate (by ID)
      const all = [...rawFirebase];
      const existingIds = new Set(rawFirebase.map(s => s.id));

      // Save new provider activities to Firebase (with difficulty at time of save)
      const newSessions = [];
      providerActivities.forEach(act => {
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
  }, [auth.isSignedIn, isReady, runningMultiplier, cyclingMultiplier]);

  useEffect(() => {
    if (isReady) {
      fetchSessions();
    }
  }, [fetchSessions, isReady]);

  // Compute total cardio reps: kilometers * 15
  const cardioReps = useMemo(() => {
    if (!sessions.length) return { running: 0, cycling: 0, total: 0 };
    
    const runningKm = sessions.filter(s => s.type === 'running').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
    const cyclingKm = sessions.filter(s => s.type === 'cycling').reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;
    
    const running = Math.floor(runningKm * 15);
    const cycling = Math.floor(cyclingKm * 15);
    
    return { running, cycling, total: running + cycling };
  }, [sessions]);

  // Sync to global progress state for cloud persistence
  useEffect(() => {
    if (updateCardioSessions && !loading && isReady) {
      updateCardioSessions(sessions);
    }
  }, [sessions, updateCardioSessions, loading, isReady]);

  // Helper to find if a week has a completion and return its data.
  // Uses a ref to avoid the sync effect below re-triggering on every completions change.
  const completionsRef = useRef(completions);
  useEffect(() => { completionsRef.current = completions; }, [completions]);

  const getWeeklyCompletion = useCallback((mode, refDate = new Date()) => {
    const currentCompletions = completionsRef.current;
    const { start, end } = getWeekBounds(refDate);
    const loop = new Date(start);
    while (loop <= end) {
      const dateStr = getLocalDateStr(loop);
      const comp = currentCompletions[dateStr]?.[mode];
      if (comp?.isCompleted) return { dateStr, ...comp };
      loop.setDate(loop.getDate() + 1);
    }
    return null;
  }, []);

  // Sync cardio sessions to global completions to update the global streak & firebase.
  // IMPORTANT: `completions` is intentionally NOT in the dependency array to prevent
  // an infinite loop (this effect calls updateExerciseCount which modifies completions).
  // We read completions via completionsRef instead.
  useEffect(() => {
    if (!isReady || !sessions.length || !updateExerciseCount) return;

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
      let goalDifficulty = activeMode === 'running' ? runningMultiplier : cyclingMultiplier;
      if (existingComp) {
        goalDifficulty = existingComp.difficulty || 1;
      }
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
  }, [sessions, updateExerciseCount, activeMode, startDate, runningMultiplier, cyclingMultiplier, getWeeklyCompletion, isReady]);

  // Current week number
  const weekNumber = useMemo(
    () => getCurrentWeekNumber(startDate),
    [startDate]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- completions included for UI reactivity
  const existingWeeklyComp = useMemo(() => getWeeklyCompletion(activeMode), [getWeeklyCompletion, activeMode, completions]);

  // Weekly goal for current week (in km) - apply difficulty multiplier
  const weeklyGoal = useMemo(() => {
    let multiplier = activeMode === 'running' ? runningMultiplier : cyclingMultiplier;
    if (existingWeeklyComp) {
      multiplier = existingWeeklyComp.difficulty || 1;
    }
    const baseGoal = getWeeklyGoalKm(activeMode, weekNumber);
    return baseGoal * multiplier;
  }, [activeMode, weekNumber, runningMultiplier, cyclingMultiplier, existingWeeklyComp]);

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
    () => computeStreak(sessions, activeMode, startDate, activeMode === 'running' ? runningMultiplier : cyclingMultiplier, completions),
    [sessions, activeMode, startDate, runningMultiplier, cyclingMultiplier, completions]
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
    totalReps: cardioReps.total,
    loading,
    refresh: fetchSessions,
    isDifficultyMismatch: !!existingWeeklyComp && existingWeeklyComp.difficulty !== undefined && existingWeeklyComp.difficulty !== (activeMode === 'running' ? runningMultiplier : cyclingMultiplier),
    savedDifficulty: existingWeeklyComp?.difficulty || 1,
    currentDifficulty: activeMode === 'running' ? runningMultiplier : cyclingMultiplier,
    invalidateCurrentWeek: () => {
      if (existingWeeklyComp) {
        updateExerciseCount(existingWeeklyComp.dateStr, activeMode, 0, 1, null, activeMode === 'running' ? runningMultiplier : cyclingMultiplier);
      }
    }
  };
}
