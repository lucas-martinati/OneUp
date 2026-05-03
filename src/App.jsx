import { useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgressProvider, useProgressContext } from './contexts/ProgressContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { ExercisesProvider, useExercises } from './contexts/ExercisesContext';
import { PWAReloadHandler } from './components/core/PWAReloadHandler';
import { useHardwareBack } from './hooks/useHardwareBack';
import { useCloudAutoSave } from './hooks/useCloudAutoSave';
import { cloudSync } from './services/cloudSync';
// Only install debug utilities in development builds
if (import.meta.env.DEV) {
  import('./utils/debugCommands').then(({ installDebugCommands }) => installDebugCommands());
  import('./utils/consoleAchievements');
}

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Onboarding = lazy(() => import('./components/settings/Onboarding').then(module => ({ default: module.Onboarding })));

/**
 * Inner app component — has access to all contexts.
 * Handles cross-context wiring (cloud auto-save for routines/exercises).
 */
function AppContent() {
  const { t } = useTranslation();
  const auth = useAuth();
  const { isPro, isSubscriptionLoading } = useSubscription();
  const { settings, updateSettings, isSetup, startChallenge, setCustomExercisesForStats, isInitialSyncDone } = useProgressContext();
  const { customExercises, customCategories, routines, setRoutinesFromCloud, customExercisesHook, customCategoriesHook } = useExercises();
  const { resumeCloudSync } = useProgressContext();

  // Initialize global hardware back button listener
  useHardwareBack(resumeCloudSync);

  // Reset theme if Pro is lost
  useEffect(() => {
    const premiumThemes = ['ocean', 'sunset', 'forest', 'purple'];
    if (!isSubscriptionLoading && isPro === false && settings.appTheme && premiumThemes.includes(settings.appTheme)) {
      updateSettings(prev => ({ ...prev, appTheme: 'dark' }));
    }
  }, [isPro, isSubscriptionLoading, settings.appTheme, updateSettings]);

  // Keep computedStats up-to-date with custom exercises
  useEffect(() => {
    setCustomExercisesForStats(customExercises);
  }, [customExercises, setCustomExercisesForStats]);

  // Cloud auto-save for routines
  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isSetup && isInitialSyncDone,
    routines,
    cloudSync.saveRoutinesToCloud,
    { delay: 2000 }
  );

  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isSetup && isInitialSyncDone,
    customExercises,
    cloudSync.saveCustomExercisesToCloud,
    { delay: 2000 }
  );

  // Cloud auto-save for custom categories (Pro feature)
  useCloudAutoSave(
    auth.isSignedIn && !auth.loading && isSetup && isInitialSyncDone,
    customCategories,
    cloudSync.saveCustomCategoriesToCloud,
    { delay: 2000 }
  );

  // Sync routines + custom exercises + categories from cloud on sign-in
  const { setCustomExercisesFromCloud } = customExercisesHook;
  const { setCategoriesFromCloud } = customCategoriesHook;
  useEffect(() => {
    if (auth.isSignedIn && !auth.loading && auth.user?.uid) {
      const loadData = async () => {
        try {
          const cloudRoutines = await cloudSync.loadRoutinesFromCloud();
          if (cloudRoutines && Array.isArray(cloudRoutines)) setRoutinesFromCloud(cloudRoutines);
          
          const cloudExercises = await cloudSync.loadCustomExercisesFromCloud();
          if (cloudExercises && Array.isArray(cloudExercises)) setCustomExercisesFromCloud(cloudExercises);

          const cloudCategories = await cloudSync.loadCustomCategoriesFromCloud();
          if (cloudCategories && Array.isArray(cloudCategories)) setCategoriesFromCloud(cloudCategories);
        } catch { /* silent */ }
      };
      loadData();
    }
  }, [auth.isSignedIn, auth.loading, auth.user?.uid, setCustomExercisesFromCloud, setRoutinesFromCloud, setCategoriesFromCloud]);

  // Show loading only when: auth is loading, OR user is signed in with no local data
  // (waiting for cloud). If local data exists, show it immediately and sync in background.
  const isInitializing = auth.loading || (auth.isSignedIn && !isSetup && !isInitialSyncDone);

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
      {isInitializing ? (
        <div style={{
          position: 'fixed', inset: 0, background: '#050505',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600'
        }}>
          {t('app.initializing')}
        </div>
      ) : !isSetup ? (
        <Onboarding onStart={startChallenge} />
      ) : (
        <Dashboard />
      )}
    </Suspense>
  );
}

/**
 * Root App — composes all providers.
 * App.jsx is now ~110 lines instead of ~500.
 */
function App() {
  return (
    <AuthProvider>
      <ProgressProviderWithSubscription />
    </AuthProvider>
  );
}

/**
 * Intermediate component to wire ProgressProvider's publishLeaderboardNow
 * into SubscriptionProvider (which needs it for purchase callbacks).
 */
function ProgressProviderWithSubscription() {
  return (
    <ProgressProvider>
      <SubscriptionAndExercises />
    </ProgressProvider>
  );
}

function SubscriptionAndExercises() {
  const { publishLeaderboardNow, deleteExerciseHistory, saveToCloud } = useProgressContext();

  return (
    <SubscriptionProvider publishLeaderboardNow={publishLeaderboardNow}>
      <PWAReloadHandler />
      <ExercisesProvider
        onDeleteExerciseHistory={deleteExerciseHistory}
        onSaveToCloud={saveToCloud}
      >
        <AppContent />
      </ExercisesProvider>
    </SubscriptionProvider>
  );
}

export default App;
