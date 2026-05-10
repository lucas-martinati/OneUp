import { useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { ExercisesProvider, useExercises } from './contexts/ExercisesContext';
import { useProgressStore } from './store/useProgressStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useCloudSyncStore } from './store/useCloudSyncStore';
import { useComputedStatsFromStore } from './hooks/useComputedStatsFromStore';
import { AppOrchestrator } from './components/core/AppOrchestrator';
import { PWAReloadHandler } from './components/core/PWAReloadHandler';
import { useHardwareBack } from './hooks/useHardwareBack';
import { useCloudSyncOrchestration } from './hooks/useCloudSyncOrchestration';
// Only install debug utilities in development builds
if (import.meta.env.DEV) {
  import('./utils/debugCommands').then(({ installDebugCommands }) => installDebugCommands());
  import('./utils/consoleAchievements');
}

const PREMIUM_THEMES = ['ocean', 'sunset', 'forest', 'purple'];
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

  // ── Zustand stores ──
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const isSetup = useProgressStore(s => s.isSetup);
  const startChallenge = useProgressStore(s => s.startChallenge);
  const isInitialSyncDone = useCloudSyncStore(s => s.isInitialSyncDone);
  const resumeCloudSync = useCloudSyncStore(s => s.resumeCloudSync);

  // ── Computed stats (for orchestrator) ──
  const computedStats = useComputedStatsFromStore();

  // ── Exercises context ──
  const { customExercises, customCategories, routines } = useExercises();

  const cloudSyncEnabled = auth.isSignedIn && !auth.loading && isSetup && isInitialSyncDone;
  useCloudSyncOrchestration(cloudSyncEnabled, routines, customExercises, customCategories);

  // Initialize global hardware back button listener
  useHardwareBack(resumeCloudSync);

  // Reset theme if Pro is lost
  useEffect(() => {
    if (!isSubscriptionLoading && isPro === false && settings.appTheme && PREMIUM_THEMES.includes(settings.appTheme)) {
      updateSettings(prev => ({ ...prev, appTheme: 'dark' }));
    }
  }, [isPro, isSubscriptionLoading, settings.appTheme, updateSettings]);

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
      <AppOrchestrator computedStats={computedStats} />
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
 * No more ProgressProvider needed!
 */
function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <PWAReloadHandler />
        <ExercisesProvider>
          <AppContent />
        </ExercisesProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
