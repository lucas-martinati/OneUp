import { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from './hooks/useProgress';
import { useSettings } from './hooks/useSettings';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useComputedStats } from './hooks/useComputedStats';
import { useUserDetailsCache } from './hooks/useUserDetailsCache';
import { useRoutines } from './hooks/useRoutines';
import { useCustomPrograms } from './hooks/useCustomPrograms';
import { cloudSync } from './services/cloudSync';
import {
  initPurchases, checkSupporterStatus, purchaseSupporter, restorePurchases,
  checkClubStatus, purchaseClub, checkProStatus, purchasePro
} from './services/purchaseService';
import { EXERCISES } from './config/exercises';
import { createLogger } from './utils/logger';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Onboarding = lazy(() => import('./components/Onboarding').then(module => ({ default: module.Onboarding })));

const logger = createLogger('App');

function App() {
  const { t } = useTranslation();
  const progress = useProgress();
  const { settings, updateSettings } = useSettings();
  const googleAuth = useGoogleAuth();
  const { routines, saveRoutine, deleteRoutine, updateRoutine, setRoutinesFromCloud, maxRoutines } = useRoutines();
  const customPrograms = useCustomPrograms();

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
    saveToCloud, loadFromCloud, syncWithCloud, startCloudListener
  } = progress;

  const computedStats = useComputedStats(completions, settings, getDayNumber);
  const userDetailsCache = useUserDetailsCache(cloudSync);

  // ── Helper: publish leaderboard with current state ────────────────────
  // Uses refs to always read latest subscription state (no stale closures)
  const publishLeaderboardNow = useCallback(async (overrides = {}) => {
    try {
      if (!googleAuth.isSignedIn) return;
      let lastActiveDay = null;
      for (const dateStr of computedStats.sortedDates) {
        const day = completions[dateStr];
        if (day && EXERCISES.some(ex => day[ex.id]?.isCompleted)) {
          lastActiveDay = dateStr;
        }
      }
      const pseudo = settings.leaderboardPseudo || googleAuth.user?.displayName || 'Anonyme';
      const sup = overrides.isSupporter !== undefined ? overrides.isSupporter : isSupporterRef.current;
      const clb = overrides.isClub !== undefined ? overrides.isClub : isClubRef.current;
      const pr = overrides.isPro !== undefined ? overrides.isPro : isProRef.current;
      await cloudSync.publishToLeaderboard({
        pseudo,
        totalReps: computedStats.globalTotalReps,
        exerciseReps: computedStats.exerciseReps,
        achievements: computedStats.badgeCount,
        isPublic: !!settings.leaderboardEnabled,
        lastActiveDay,
        difficultyMultiplier: settings?.difficultyMultiplier,
        isSupporter: sup,
        isClub: clb,
        isPro: pr,
      });
      logger.debug('Leaderboard published:', { isSupporter: sup, isClub: clb, isPro: pr });
    } catch (e) {
      logger.error('Leaderboard publish failed:', e);
    }
  }, [googleAuth, computedStats, completions, settings]);

  // ── Helper: save all entitlements to Firebase + localStorage ──────────
  const saveEntitlementsToCloud = useCallback(async ({ isSupporter: sup, isClub: clb, isPro: pr }) => {
    // Save to localStorage
    localStorage.setItem('oneup_supporter', sup ? 'true' : 'false');
    localStorage.setItem('oneup_club', clb ? 'true' : 'false');
    localStorage.setItem('oneup_pro', pr ? 'true' : 'false');
    // Save to Firebase
    await cloudSync.saveSubscriptionStatus({ isSupporter: sup, isClub: clb, isPro: pr });
    // Publish to leaderboard
    await publishLeaderboardNow({ isSupporter: sup, isClub: clb, isPro: pr });
    logger.info('Entitlements saved:', { isSupporter: sup, isClub: clb, isPro: pr });
  }, [publishLeaderboardNow]);

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

  // Sync routines, purchase history, custom programs with cloud on sign-in
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const loadData = async () => {
        try {
          const cloudRoutines = await cloudSync.loadRoutinesFromCloud();
          if (cloudRoutines && Array.isArray(cloudRoutines)) setRoutinesFromCloud(cloudRoutines);
          const history = await cloudSync.loadPurchaseHistoryFromCloud();
          if (history && Array.isArray(history)) setPurchaseHistory(history);
          const cloudPrograms = await cloudSync.loadCustomProgramsFromCloud();
          if (cloudPrograms && Array.isArray(cloudPrograms)) customPrograms.setProgramsFromCloud(cloudPrograms);
        } catch (error) { logger.error('Data sync error:', error); }
      };
      loadData();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading]);

  // Initialize purchases and check ALL tier statuses on sign-in
  // FIX: auto-publish to leaderboard when any entitlement is detected
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading) {
      const initAndCheck = async () => {
        try {
          await initPurchases(cloudSync.getCurrentUserId());

          let supporterStatus = false;
          let clubStatus = false;
          let proStatus = false;

          try {
            supporterStatus = await checkSupporterStatus();
            clubStatus = await checkClubStatus();
            proStatus = await checkProStatus();
          } catch (rcErr) {
            logger.warn('RevenueCat check failed, trying Firebase fallback:', rcErr);
            // Fallback: load from Firebase if RevenueCat fails
            const cloudSubs = await cloudSync.loadSubscriptionStatus();
            if (cloudSubs) {
              supporterStatus = !!cloudSubs.isSupporter;
              clubStatus = !!cloudSubs.isClub;
              proStatus = !!cloudSubs.isPro;
            }
          }

          setIsSupporter(supporterStatus);
          setIsClub(clubStatus);
          setIsPro(proStatus);

          // Save to Firebase + publish to leaderboard if any entitlement active
          if (supporterStatus || clubStatus || proStatus) {
            logger.info('Entitlements detected on init — syncing to Firebase + leaderboard');
            await saveEntitlementsToCloud({
              isSupporter: supporterStatus,
              isClub: clubStatus,
              isPro: proStatus,
            });
          }
        } catch (error) {
          logger.error('Purchase init error:', error);
        }
      };
      initAndCheck();
    }
  }, [googleAuth.isSignedIn, googleAuth.loading, saveEntitlementsToCloud]);

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

  // Auto-save custom programs
  useEffect(() => {
    if (googleAuth.isSignedIn && !googleAuth.loading && isSetup && isPro) {
      const timer = setTimeout(() => { cloudSync.saveCustomProgramsToCloud(customPrograms.programs); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [customPrograms.programs, googleAuth.isSignedIn, googleAuth.loading, isSetup, isPro]);

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
    if (result.webOnly) { alert(t('supporter.androidOnly')); return; }
    if (result.isSupporter) {
      setIsSupporter(true);
      await saveEntitlementsToCloud({ isSupporter: true, isClub, isPro });
    }
    if (result.success && result.product) {
      const newHistory = [...purchaseHistory, result.product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
  };

  const handlePurchaseClub = async () => {
    const result = await purchaseClub();
    if (result.webOnly) { alert(t('supporter.androidOnly')); return; }
    if (result.isActive) {
      setIsClub(true);
      await saveEntitlementsToCloud({ isSupporter, isClub: true, isPro });
    }
    if (result.success && result.product) {
      const newHistory = [...purchaseHistory, result.product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
  };

  const handlePurchasePro = async () => {
    const result = await purchasePro();
    if (result.webOnly) { alert(t('supporter.androidOnly')); return; }
    if (result.isActive) {
      setIsPro(true);
      await saveEntitlementsToCloud({ isSupporter, isClub, isPro: true });
    }
    if (result.success && result.product) {
      const newHistory = [...purchaseHistory, result.product];
      setPurchaseHistory(newHistory);
      cloudSync.savePurchaseHistoryToCloud(newHistory);
    }
  };

  const handleRestorePurchases = async () => {
    const result = await restorePurchases();
    if (result.webOnly) { alert(t('supporter.androidOnly')); return; }
    const sup = result.supporter || result.isSupporter;
    const clb = result.club;
    const pr = result.pro;
    setIsSupporter(sup);
    setIsClub(clb);
    setIsPro(pr);
    // Save all entitlements to Firebase + leaderboard
    if (sup || clb || pr) {
      await saveEntitlementsToCloud({ isSupporter: sup, isClub: clb, isPro: pr });
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
          isSupporter={isSupporter}
          isClub={isClub}
          isPro={isPro}
          purchaseHistory={purchaseHistory}
          onPurchaseSupporter={handlePurchaseSupporter}
          onPurchaseClub={handlePurchaseClub}
          onPurchasePro={handlePurchasePro}
          onRestorePurchases={handleRestorePurchases}
          customPrograms={customPrograms}
        />
      )}
    </Suspense>
  );
}

export default App;
