import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@contexts/AuthContext';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useExercisesStore } from '@store/useExercisesStore';
import { useCloudStartupSync } from '@hooks/useCloudStartupSync';
import { useProgressAutoSave } from '@hooks/useProgressAutoSave';
import { useCloudSettingsSync } from '@hooks/useCloudSettingsSync';
import { useRealtimeCloudListener } from '@hooks/useRealtimeCloudListener';
import { useNotificationScheduling } from '@hooks/useNotificationScheduling';
import { updateWidgetData } from '@utils/widgetBridge';

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
  const { i18n } = useTranslation();

  const completions = useProgressStore(s => s.completions);
  const frozenDays = useProgressStore(s => s.frozenDays);
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
    updateWidgetData(computedStats, completions, frozenDays, settings.weekStartDay);
  }, [computedStats, completions, frozenDays, settings.weekStartDay, i18n.resolvedLanguage]);

  // ── Performance mode & Theme on document root ──────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', settings.performanceMode);
    document.documentElement.setAttribute('data-theme', settings.appTheme || 'dark');
  }, [settings.performanceMode, settings.appTheme]);

  // ── Auto-pause infinite decorative CSS animations when idle ────────
  // Drops WebView compositor load to 0 FPS when the phone sits untouched
  // (e.g. between sets or left open on a desk), preventing thermal build-up
  // with zero visual difference while interacting.
  useEffect(() => {
    const root = document.documentElement;
    const IDLE_DELAY_MS = 12000;
    const THROTTLE_MS = 2000;
    let idleTimer = null;
    let lastWake = 0;

    const markIdle = () => {
      root.setAttribute('data-idle', 'true');
    };

    const wakeUp = () => {
      const now = Date.now();
      if (root.hasAttribute('data-idle')) {
        root.removeAttribute('data-idle');
      } else if (now - lastWake < THROTTLE_MS) {
        return;
      }
      lastWake = now;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(markIdle, IDLE_DELAY_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(idleTimer);
        markIdle();
      } else {
        lastWake = 0;
        wakeUp();
      }
    };

    wakeUp();
    const opts = { passive: true, capture: true };
    window.addEventListener('pointerdown', wakeUp, opts);
    window.addEventListener('touchstart', wakeUp, opts);
    window.addEventListener('wheel', wakeUp, opts);
    window.addEventListener('scroll', wakeUp, opts);
    window.addEventListener('keydown', wakeUp, opts);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(idleTimer);
      root.removeAttribute('data-idle');
      window.removeEventListener('pointerdown', wakeUp, opts);
      window.removeEventListener('touchstart', wakeUp, opts);
      window.removeEventListener('wheel', wakeUp, opts);
      window.removeEventListener('scroll', wakeUp, opts);
      window.removeEventListener('keydown', wakeUp, opts);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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
