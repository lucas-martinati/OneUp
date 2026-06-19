import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';
import { useExercisesStore } from '../../store/useExercisesStore';
import { useCloudStartupSync } from '../../hooks/useCloudStartupSync';
import { useProgressAutoSave } from '../../hooks/useProgressAutoSave';
import { useCloudSettingsSync } from '../../hooks/useCloudSettingsSync';
import { useRealtimeCloudListener } from '../../hooks/useRealtimeCloudListener';
import { useNotificationScheduling } from '../../hooks/useNotificationScheduling';
import { updateWidgetData } from '../../utils/widgetBridge';

/**
 * Invisible component that wires all app-level orchestration.
 * Renders nothing — each concern lives in its own dedicated hook:
 *
 * - useCloudStartupSync      startup sequence (conflict check → initial sync)
 * - useCloudSettingsSync     settings load + auto-save
 * - useProgressAutoSave      debounced/background/online progress saves
 * - useRealtimeCloudListener live cloud updates once synced
 * - useNotificationScheduling daily reminders
 *
 * @param {Object} props
 * @param {Object} props.computedStats - Stats from useComputedStatsStore(s => s.stats)
 */
export function AppOrchestrator({ computedStats }) {
  const auth = useAuth();

  const completions = useProgressStore(s => s.completions);
  const initProgressForUser = useProgressStore(s => s.initForUser);
  const initSettingsForUser = useSettingsStore(s => s.initForUser);
  const initExercisesForUser = useExercisesStore(s => s.initForUser);
  const settings = useSettingsStore(s => s.settings);
  const refreshUserClans = useCloudSyncStore(s => s.refreshUserClans);

  // ── Init stores when userId changes ────────────────────────────────
  useEffect(() => {
    if (auth.user?.uid) {
      initSettingsForUser(auth.user.uid);
      initProgressForUser(auth.user.uid);
      initExercisesForUser(auth.user.uid);
    } else if (!auth.loading) {
      initSettingsForUser(null);
      initProgressForUser(null);
      initExercisesForUser(null);
    }
  }, [auth.user?.uid, auth.loading, initSettingsForUser, initProgressForUser, initExercisesForUser]);

  // ── Cloud synchronization ──────────────────────────────────────────
  useCloudStartupSync(auth);
  useCloudSettingsSync(auth);
  useProgressAutoSave(auth);
  useRealtimeCloudListener(auth);

  // ── Notifications ──────────────────────────────────────────────────
  useNotificationScheduling();

  // ── Push widget data ───────────────────────────────────────────────
  useEffect(() => {
    updateWidgetData(computedStats, completions);
  }, [computedStats, completions]);

  // ── Performance mode & Theme on document root ──────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
    document.documentElement.setAttribute('data-theme', settings.appTheme || 'dark');
  }, [settings.performanceMode, settings.appTheme]);

  // ── Pre-load user clans ────────────────────────────────────────────
  // Gated on `authConfirmed`: this hits the cloud, so it must wait for the
  // real Firebase session rather than firing during an optimistic boot.
  useEffect(() => {
    if (auth.isSignedIn && auth.authConfirmed) {
      refreshUserClans();
    }
  }, [auth.isSignedIn, auth.authConfirmed, refreshUserClans]);

  return null;
}
