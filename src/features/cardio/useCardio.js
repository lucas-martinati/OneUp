import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { loadCardioSessions, saveCardioSession, getSortedCardioSessions } from '@services/cardioService';
import { getAllActivities } from '@services/cardioProviders';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { getLocalDateStr, getWeekBounds, getCurrentWeekNumber } from '@shared/dateUtils';
import { getCardioGoal, getCardioReps, getCardioWeekEntry, getCardioLevelUpdates, computeCardioLevelStreaks } from '@shared/cardioLevels.js';

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

  const weekStartDay = useSettingsStore(s => s.settings.weekStartDay) || 'monday';
  const [sessions, setSessions] = useState(() => {
    // Initialize from context if available to avoid flicker/wiping during initial load
    return getSortedCardioSessions(cardio?.sessions);
  });
  const [loading, setLoading] = useState(true);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState('running');

  // Sync sessions state with store's sessions once the store & sync are fully initialized
  const hasInitializedFromStore = useRef(false);
  useEffect(() => {
    if (isReady && !hasInitializedFromStore.current) {
      const storeSessions = getSortedCardioSessions(cardio?.sessions);
      setSessions(storeSessions);
      hasInitializedFromStore.current = true;
      setLoading(false);
    }
  }, [isReady, cardio?.sessions]);

  // Fetch sessions from Firebase and Strava, save new Strava sessions to Firebase
  const fetchSessions = useCallback(async () => {
    if (!isReady) return; // Wait for initialization to prevent session wiping or premature writes
    if (!auth.isSignedIn) {
      setSessionsLoaded(true);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setSessionsLoaded(false);
      
      // Load existing sessions from Firebase
      const firebaseSessions = await loadCardioSessions();
      const rawFirebase = firebaseSessions || [];

      // Determine the latest session start time to fetch only new Strava activities
      let afterTimestamp = 0;
      if (rawFirebase.length > 0) {
        const latestTime = rawFirebase.reduce((max, s) => Math.max(max, s.startTime || 0), 0);
        // Look back 14 days from our latest known activity to catch retroactive manual entries
        afterTimestamp = Math.max(0, latestTime - (14 * 24 * 60 * 60 * 1000));
      }

      // Fetch new activities from all connected cardio providers (Strava, Health Connect)
      const providerActivities = await getAllActivities(afterTimestamp);

      // Merge and deduplicate (by ID)
      const all = [...rawFirebase];
      const existingIds = new Set(rawFirebase.map(s => s.id));

      // Save new provider activities; levels come from the weekly distance snapshot.
      const newSessions = [];
      providerActivities.forEach(act => {
        if (!existingIds.has(act.id)) {
          all.push(act);
          existingIds.add(act.id);
          newSessions.push({
            ...act,
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
      setSessionsLoaded(true);
    } catch (err) {
      // Keep the previously loaded sessions on a transient error instead of
      // wiping the whole list (and the store) to empty.
      console.error('Failed to load cardio sessions', err);
    } finally {
      setLoading(false);
    }
  }, [auth.isSignedIn, isReady]);

  useEffect(() => {
    if (isReady) {
      fetchSessions();
    }
  }, [fetchSessions, isReady]);

  // The shared conversion keeps profile, ranking and local partial volume identical.
  const cardioReps = useMemo(() => {
    let running = 0;
    let cycling = 0;
    for (const [dateStr, day] of Object.entries(completions)) {
      if (!day || typeof day !== 'object') continue;
      for (const mode of ['running', 'cycling']) {
        const comp = day[mode];
        const weekNum = getCurrentWeekNumber(startDate, dateStr);
        const reps = getCardioReps(comp, mode, weekNum);
        if (mode === 'running') running += reps; else cycling += reps;
      }
    }
    return { running, cycling, total: running + cycling };
  }, [completions, startDate]);

  // Sync to global progress state for cloud persistence
  useEffect(() => {
    if (updateCardioSessions && !loading && isReady && sessionsLoaded) {
      updateCardioSessions(sessions);
    }
  }, [sessions, updateCardioSessions, loading, isReady, sessionsLoaded]);

  // Helper to find if a week has a completion and return its data.
  // Uses a ref to avoid the sync effect below re-triggering on every completions change.
  const completionsRef = useRef(completions);
  useEffect(() => { completionsRef.current = completions; }, [completions]);

  // Persist both sports together, after the authoritative session load completes.
  useEffect(() => {
    if (!isReady || loading || !sessionsLoaded || !updateExerciseCount) return;
    const updates = getCardioLevelUpdates(sessions, completionsRef.current, startDate, weekStartDay);
    updates.forEach(({ date, mode, count, goal }) => updateExerciseCount(date, mode, count, goal));
  }, [sessions, loading, sessionsLoaded, updateExerciseCount, startDate, isReady, weekStartDay]);

  const weekNumber = getCurrentWeekNumber(startDate);
  const today = getLocalDateStr(new Date());
  const existingWeeklyComp = getCardioWeekEntry(completions, activeMode, today, weekStartDay);
  const weeklyGoal = getCardioGoal(activeMode, startDate, today, existingWeeklyComp, weekStartDay) / 1000;

  // Filter sessions by current mode
  const modeSessions = useMemo(
    () => sessions.filter(s => s.type === activeMode),
    [sessions, activeMode]
  );

  // Show actual distance even when it exceeds the level-ten target.
  const weeklyData = useMemo(() => {
    const { start, end } = getWeekBounds(undefined, weekStartDay);
    const weekSessions = modeSessions.filter(
      s => s.startTime >= start && s.startTime <= end
    );
    // Sum actual distances
    const totalDistanceKm = weekSessions.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

    return {
      distance: totalDistanceKm,
      sessionCount: weekSessions.length,
    };
  }, [modeSessions, weekStartDay]);

  // Last session
  const lastSession = useMemo(
    () => modeSessions.length > 0 ? modeSessions[0] : null,
    [modeSessions]
  );

  const levelStats = useMemo(
    () => computeCardioLevelStreaks(completions, activeMode, startDate, today, weekStartDay),
    [completions, activeMode, startDate, today, weekStartDay]
  );

  return {
    activeMode,
    setActiveMode,
    weekNumber,
    weeklyDistance: Math.max(weeklyData.distance, existingWeeklyComp?.legacyCardio ? existingWeeklyComp.count / 1000 : 0),
    weeklyGoal,
    weeklySessionCount: weeklyData.sessionCount,
    lastSession,
    streak: levelStats.streak,
    streakLevel: levelStats.level,
    levelStreaks: levelStats.levels,
    sessions: modeSessions,
    allSessions: sessions,
    totalReps: cardioReps.total,
    loading,
    refresh: fetchSessions,
  };
}
