import { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useComputedStats } from './hooks/useComputedStats';
import { useUserDetailsCache } from './hooks/useUserDetailsCache';
import { useRoutines } from './hooks/useRoutines';
import { useCustomExercises } from './hooks/useCustomExercises';
import { cloudSync } from './services/cloudSync';
import {
  initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases,
  checkClubStatus, purchaseClub, checkProStatus, purchasePro
} from './services/purchaseService';
import { EXERCISES } from './config/exercises';
import { WEIGHT_EXERCISES } from './config/weights';
import { createLogger } from './utils/logger';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Onboarding = lazy(() => import('./components/settings/Onboarding').then(module => ({ default: module.Onboarding })));

const logger = createLogger('App');

function App() {
  const { t } = useTranslation();
  const progress = useProgress();
  const { settings, updateSettings } = useSettings();
  const googleAuth = useGoogleAuth();
  const { routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines } = useRoutines();
  const customExercisesHook = useCustomExercises();

  const [conflictData, setConflictData] = useState(null);
  const [conflictCheckDone, setConflictCheckDone] = useState(false);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSyncPaused, setIsSyncPaused] = useState(false);

  // Subscription tiers
  const [isSupporter, setIsSupporter] = useState(() => localStorage.getItem('oneup_supporter') === 'true');
  const [isClub, setIsClub] = useState(() => localStorage.getItem('oneup_club') === 'true');
  const [isPro, setIsPro] = useState(() => localStorage.getItem('oneup_pro') === 'true');

  // Refs to always read latest subscription state (avoid stale closures)
  const isSupporterRef = useRef(isSupporter);
  const isClubRef = useRef(isClub);
  const isProRef = useRef(isPro);
  useEffect(() => { isSupporterRef.current = isSupporter; }, [isSupporter]);
  useEffect(() => { isClubRef.current = isClub; }, [isClub]);
  useEffect(() => { isProRef.current = isPro; }, [isPro]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const {
    startDate, completions, startChallenge, toggleCompletion,
    getDayNumber, getTotalReps, isDayDone, isSetup, userStartDate,
    scheduleNotification, requestNotificationPermission,
    getExerciseCount, updateExerciseCount,
    saveToCloud, loadFromCloud, syncWithCloud, startCloudListener, deleteExerciseHistory
  } = progress;

  const computedStats = useComputedStats(completions, settings, getDayNumber, customExercisesHook.customExercises);
  const userDetailsCache = useUserDetailsCache(cloudSync);

  // ── Helper: publish leaderboard with current state ────────────────────
  const publishLeaderboardNow = useCallback(async () => {
    try {
      if (!googleAuth.isSignedIn) return;
      const classicTotalReps = EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const weightsTotalReps = WEIGHT_EXERCISES.reduce((sum, ex) => sum + (computedStats.exerciseReps[ex.id] || 0), 0);
      const lastActiveDay = computedStats.sortedDates.find(d => completions[d] && EXERCISES.some(ex => completions[d][ex.id]?.isCompleted)) || null;

      await cloudSync.publishToLeaderboard({
        pseudo: settings.leaderboardPseudo || googleAuth.user?.displayName || 'Anonyme',
        totalReps: classicTotalReps,
        weightsTotalReps: weightsTotalReps,
        exerciseReps: computedStats.exerciseReps,
        achievements: computedStats.badgeCount,
        isPublic: !!settings.leaderboardEnabled,
        lastActiveDay,
        difficultyMultiplier: settings?.difficultyMultiplier,
      });
      logger.debug('Leaderboard published');
    } catch (e) {
      logger.error('Leaderboard publish failed:', e);
    }
  }, [googleAuth, computedStats, completions, settings]);

  // ── Helper: save purchase to Firebase + publish leaderboard ───────────
  const saveAndPublish = useCallback(async ({ isSupporter: sup, isClub: clb, isPro: pr }) => {
    localStorage.setItem('oneup_supporter', sup ? 'true' : 'false');
    localStorage.setItem('oneup_club', clb ? 'true' : 'false');
    localStorage.setItem('oneup_pro', pr ? 'true' : 'false');
    // savePurchase is blocked on web (native-only) — see cloudSync.js
    await cloudSync.savePurchase({ isSupporter: sup, isClub: clb, isPro: pr });
    // Publish leaderboard WITHOUT purchase flags (they are preserved from server)
    await publishLeaderboardNow();
    logger.info('Saved + published:', { isSupporter: sup, isClub: clb, isPro: pr });
  }, [googleAuth, computedStats, completions, settings]);

  // Apply performance mode on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
  }, [settings.performanceMode]);

  // Reset sync state when user signs out or changes
  useEffect(() => {
    if (!googleAuth.isSignedIn) {
      setConflictCheckDone(false);
      setIsInitialSyncDone(false);
      setConflictData(null);
      setIsSupporter(false);
      setIsClub(false);
      setIsPro(false);
      setPurchaseHistory([]);
      localStorage.removeItem('oneup_supporter');
      localStorage.removeItem('oneup_club');
      localStorage.removeItem('oneup_pro');
    }
  }, [googleAuth.isSignedIn, googleAuth.user?.uid]);

  // Request notification permission and schedule on first setup
  useEffect(() => {
    if (isSetup) {
      requestNotificationPermission();
      if (settings.notificationsEnabled) {
        scheduleNotification(settings);
      }
    }
  }, [isSetup, settings.notificationsEnabled]);

  // Refresh notification daily to keep day count fresh
  useEffect(() => {
    if (isSetup && settings.notificationsEnabled) {
      scheduleNotification(settings);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 30, 0);
      const midnightTimer = setTimeout(() => {
        scheduleNotification(settings);
      }, tomorrow.getTime() - now.getTime());
      return () => clearTimeout(midnightTimer);
    }
  }, [isSetup, settings.notificationsEnabled, settings.notificationTime, completions]);

  // Save to cloud when completion changes
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && !conflictData && conflictCheckDone && isInitialSyncDone) {
      const doSave = async () => {
        try { await saveToCloud(); } catch (error) { logger.error('Auto-save failed:', error); }
      };
      const timer = setTimeout(doSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress.lastCompletionChange, googleAuth.isSignedIn, googleAuth.loading, conflictData, conflictCheckDone, isInitialSyncDone, saveToCloud]);

  // Sync settings with cloud on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const loadSettings = async () => {
        try {
          const cloudSettings = await cloudSync.loadSettingsFromCloud();
          if (cloudSettings) {
            const safeSettings = {
              ...cloudSettings,
              notificationTime: cloudSettings.notificationTime || { hour: 9, minute: 0 }
            };
            if (typeof safeSettings.notificationTime !== 'object') {
              safeSettings.notificationTime = { hour: 9, minute: 0 };
            }
            updateSettings(safeSettings);
          }
        } catch (error) { logger.error('Settings sync error:', error); }
      };
      loadSettings();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

    // The history is merely a log, not a source of truth for active subscription states.  // Sync routines, purchase history, custom programs, custom exercises with cloud on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const loadData = async () => {
        try {
          const cloudRoutines = await cloudSync.loadRoutinesFromCloud();
          if (cloudRoutines && Array.isArray(cloudRoutines)) setRoutinesFromCloud(cloudRoutines);
          const history = await cloudSync.loadPurchaseHistoryFromCloud();
          if (history && Array.isArray(history)) setPurchaseHistory(history);
          const cloudExercises = await cloudSync.loadCustomExercisesFromCloud();
          if (cloudExercises && Array.isArray(cloudExercises)) customExercisesHook.setCustomExercisesFromCloud(cloudExercises);
        } catch (error) { logger.error('Data sync error:', error); }
      };
      loadData();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

  // Initialize purchases and check ALL tier statuses on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const initAndCheck = async () => {
        try {
          await initPurchases(cloudSync.getCurrentUserId());

          let sup = false;
          let clb = false;
          let pr = false;

          // 1. Check RevenueCat
          try {
            sup = await checkSupporterStatus();
            clb = await checkClubStatus();
            pr = await checkProStatus();
          } catch (rcErr) {
            logger.warn('RevenueCat check failed:', rcErr);
          }

          // 2. Fallback: check Firebase purchase object
          if (!sup && !clb && !pr) {
            const cloudPurchase = await cloudSync.loadPurchase();
            if (cloudPurchase) {
              sup = !!cloudPurchase.isSupporter;
              clb = !!cloudPurchase.isClub;
              pr = !!cloudPurchase.isPro;
              if (sup || clb || pr) logger.info('Loaded purchase from Firebase');
            }
          }

          setIsSupporter(sup);
          setIsClub(clb);
          setIsPro(pr);

          // 4. Sync to Firebase + leaderboard if any entitlement active
          if (sup || clb || pr) {
            await saveAndPublish({ isSupporter: sup, isClub: clb, isPro: pr });
          }
        } catch (error) {
          logger.error('Purchase init error:', error);
        }
      };
      initAndCheck();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, saveAndPublish]);

  // Auto-detect cloud data conflict on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup && !conflictCheckDone) {
      const detectConflict = async () => {
        try {
          const cloudData = await cloudSync.loadFromCloud();
          if (cloudData && cloudData.completions) {
            const cloudKeys = Object.keys(cloudData.completions);
            const localKeys = Object.keys(completions);
            const hasConflict = cloudKeys.length > 0 && (
              cloudKeys.some(key => !completions[key]) ||
              localKeys.some(key => !cloudData.completions[key]) ||
              cloudKeys.some(key => {
                const cloudDay = cloudData.completions[key];
                const localDay = completions[key];
                if (!cloudDay || !localDay) return true;
                const allExIds = new Set([...Object.keys(cloudDay), ...Object.keys(localDay)]);
                for (const exId of allExIds) {
                  if ((cloudDay[exId]?.isCompleted || false) !== (localDay[exId]?.isCompleted || false)) return true;
                }
                return false;
              })
            );
            if (hasConflict) setConflictData(cloudData);
            else setConflictCheckDone(true);
          } else {
            setConflictCheckDone(true);
          }
        } catch (error) {
          logger.error('Conflict detection failed:', error);
          setConflictCheckDone(true);
        }
      };
      detectConflict();
    } else if (googleAuth.isSignedIn && !googleAuth.loading && !isSetup && !conflictCheckDone) {
      setConflictCheckDone(true);
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, isSetup, conflictCheckDone, completions]);

  // Auto-save settings
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const timer = setTimeout(() => { cloudSync.saveSettingsToCloud(settings); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [settings, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Auto-save routines
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup) {
      const timer = setTimeout(() => { cloudSync.saveRoutinesToCloud(routines); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [routines, googleAuth.isSignedIn, googleAuth.loading, isSetup]);

  // Auto-save custom exercises
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup && isPro) {
      const timer = setTimeout(() => { cloudSync.saveCustomExercisesToCloud(customExercisesHook.customExercises); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [customExercisesHook.customExercises, googleAuth.isSignedIn, googleAuth.loading, isSetup, isPro]);

  // Auto-publish leaderboard when completions change
  useEffect(() => {
    if (!googleAuth.isSignedIn || googleAuth.loading || !isSetup || !isInitialSyncDone) return;
    const timer = setTimeout(() => publishLeaderboardNow(), 2000);
    return () => clearTimeout(timer);
  }, [
    completions, settings.leaderboardEnabled, settings.leaderboardPseudo, settings.difficultyMultiplier,
    googleAuth.isSignedIn, googleAuth.loading, isSetup, isInitialSyncDone, computedStats
  ]);

  // ── Purchase handlers ────────────────────────────────────────────────

  const handlePurchaseSupporter = async () => {
    const result = await purchaseSupporter();
    if (result.success || result.isSupporter || result.isActive) {
      setIsSupporter(true);
      await saveAndPublish({ isSupporter: true, isClub: isClubRef.current, isPro: isProRef.current });
    }
    if (result.success && result.product) {
      const product = { ...result.product, type: 'supporter' };
      const newHistory = [...purchaseHistory, product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
    return result;
  };

  const handlePurchaseClub = async () => {
    const result = await purchaseClub();
    if (result.success || result.isActive) {
      setIsClub(true);
      await saveAndPublish({ isSupporter: isSupporterRef.current, isClub: true, isPro: isProRef.current });
    }
    if (result.success && result.product) {
      const product = { ...result.product, type: 'club' };
      const newHistory = [...purchaseHistory, product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
    return result;
  };

  const handlePurchasePro = async () => {
    const result = await purchasePro();
    if (result.success || result.isActive) {
      setIsPro(true);
      await saveAndPublish({ isSupporter: isSupporterRef.current, isClub: isClubRef.current, isPro: true });
    }
    if (result.success && result.product) {
      const product = { ...result.product, type: 'pro' };
      const newHistory = [...purchaseHistory, product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
    return result;
  };

  const handleRestorePurchases = async () => {
    // 1. Try RevenueCat restore (works on both native and web)
    const result = await restorePurchases();
    let sup = result.supporter || result.isSupporter || false;
    let clb = result.club || false;
    let pr = result.pro || false;

    // 2. Fallback: check Firebase purchase object directly
    if (!sup && !clb && !pr) {
      const cloudPurchase = await cloudSync.loadPurchase();
      if (cloudPurchase) {
        sup = !!cloudPurchase.isSupporter;
        clb = !!cloudPurchase.isClub;
        pr = !!cloudPurchase.isPro;
      }
    }

    setIsSupporter(sup);
    setIsClub(clb);
    setIsPro(pr);

    if (sup || clb || pr) {
      await saveAndPublish({ isSupporter: sup, isClub: clb, isPro: pr });
    }
  };

  const handleResolveConflict = async (action) => {
    try {
      if (action === 'restore') await loadFromCloud();
      else if (action === 'upload') await saveToCloud();
      setConflictData(null);
      setConflictCheckDone(true);
    } catch (error) { logger.error('Conflict resolution failed:', error); }
  };

  // Full sync on app startup once conflict check is resolved
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isSetup && !isInitialSyncDone) {
      const initialSync = async () => {
        try { await syncWithCloud(); setIsInitialSyncDone(true); }
        catch (error) { logger.error('Initial sync failed:', error); setIsInitialSyncDone(true); }
      };
      initialSync();
    }
  }, [conflictCheckDone, googleAuth.isSignedIn, googleAuth.loading, isSetup, isInitialSyncDone]);

  // Real-time cloud sync listener
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && conflictCheckDone && isInitialSyncDone && !isSyncPaused && !conflictData) {
      const unsubscribe = startCloudListener();
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, conflictCheckDone, isInitialSyncDone, isSyncPaused, conflictData, startCloudListener]);

  // Wrap deleteCustomExercise to also remove from completions and routines
  const handleDeleteCustomExercise = useCallback(async (id) => {
    // 1. Delete from custom exercises config
    customExercisesHook.deleteCustomExercise(id);

    // 2. Erase from completion history
    const newState = deleteExerciseHistory(id);
    if (newState) {
      await saveToCloud(newState);
    }

    // 3. Remove from all routines and delete routine if empty
    routines.forEach(r => {
      if (r.exerciseIds && r.exerciseIds.includes(id)) {
        const newExercises = r.exerciseIds.filter(ex => ex !== id);
        if (newExercises.length === 0) {
          deleteRoutine(r.id);
        } else {
          updateRoutine(r.id, r.name, newExercises);
        }
      }
    });
  }, [customExercisesHook.deleteCustomExercise, deleteExerciseHistory, saveToCloud, routines, deleteRoutine, updateRoutine]);

  const customExercisesHookWrapped = {
    ...customExercisesHook,
    deleteCustomExercise: handleDeleteCustomExercise
  };

  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed', inset: 0, background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600'
      }}>
        {t('app.initializing')}
      </div>
    }>
      {!isSetup ? (
        <Onboarding onStart={startChallenge} />
      ) : (
        <Dashboard
          customExercisesHook={customExercisesHookWrapped}
          getDayNumber={getDayNumber}
          getTotalReps={getTotalReps}
          isDayDone={isDayDone}
          toggleCompletion={toggleCompletion}
          startDate={startDate}
          userStartDate={userStartDate}
          completions={completions}
          scheduleNotification={scheduleNotification}
          settings={settings}
          updateSettings={updateSettings}
          cloudAuth={googleAuth}
          cloudSync={{
            saveToCloud, loadFromCloud, syncWithCloud,
            signIn: googleAuth.signIn, signOut: googleAuth.signOut,
            loadLeaderboard: () => cloudSync.loadLeaderboard(),
            loadUserDetails: (uid) => userDetailsCache.loadUserDetails(uid),
            getCurrentUserId: () => cloudSync.getCurrentUserId(),
            deleteAccount: () => cloudSync.deleteAccount(),
          }}
          conflictData={conflictData}
          onResolveConflict={handleResolveConflict}
          getExerciseCount={getExerciseCount}
          updateExerciseCount={updateExerciseCount}
          getExerciseDone={progress.getExerciseDone}
          pauseCloudSync={() => setIsSyncPaused(true)}
          resumeCloudSync={() => setIsSyncPaused(false)}
          computedStats={computedStats}
          routines={routines}
          saveRoutine={saveRoutine}
          deleteRoutine={deleteRoutine}
          updateRoutine={updateRoutine}
          maxRoutines={maxRoutines}
          isSupporter={googleAuth.isSignedIn ? isSupporter : false}
          isClub={googleAuth.isSignedIn ? isClub : false}
          isPro={googleAuth.isSignedIn ? isPro : false}
          purchaseHistory={purchaseHistory}
          onPurchaseSupporter={handlePurchaseSupporter}
          onPurchaseClub={handlePurchaseClub}
          onPurchasePro={handlePurchasePro}
          onRestorePurchases={handleRestorePurchases}
        />
      )}
    </Suspense>
  );
}

export default App;
