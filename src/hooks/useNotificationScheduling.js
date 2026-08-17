import { useEffect } from 'react';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { useNotificationManager } from './useNotificationManager';

/**
 * Daily reminder notifications: permission request, scheduling on settings
 * change, and re-scheduling just after midnight (the reminder is skipped on
 * days already completed).
 */
export function useNotificationScheduling() {
  const isSetup = useProgressStore(s => s.isSetup);
  const isDayDone = useProgressStore(s => s.isDayDone);
  const getDayNumber = useProgressStore(s => s.getDayNumber);
  const settings = useSettingsStore(s => s.settings);

  const notificationsEnabled = settings?.notificationsEnabled;
  const notificationHour = settings?.notificationTime?.hour;
  const notificationMinute = settings?.notificationTime?.minute;

  const { scheduleNotification, requestNotificationPermission } = useNotificationManager({
    isDayDone,
    getDayNumber,
  });

  // ── Permission & scheduling on settings changes, plus midnight reschedule ──
  useEffect(() => {
    if (isSetup && notificationsEnabled) {
      requestNotificationPermission();

      const lightweightSettings = {
        notificationsEnabled,
        notificationTime: { hour: notificationHour, minute: notificationMinute }
      };
      scheduleNotification(lightweightSettings);

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 30, 0);

      const midnightTimer = setTimeout(() => {
        scheduleNotification(lightweightSettings);
      }, tomorrow.getTime() - now.getTime());

      // Re-run the cleanup + rescheduling whenever the app returns to the
      // foreground. This is what reliably clears a reminder that got stuck in the
      // tray after a reboot (the plugin's restore receiver re-fires past-due
      // notifications, and on aggressive OEMs like MIUI it can do so repeatedly).
      // The listener handle is reached through the import promise so the cleanup
      // always removes it — even when the import resolves after unmount.
      const resumePromise = import('@capacitor/app')
        .then(({ App }) => App.addListener('resume', () => {
          scheduleNotification(lightweightSettings);
        }))
        .catch((error) => {
          console.debug('App resume listener registration failed:', error);
          return null;
        });

      return () => {
        clearTimeout(midnightTimer);
        resumePromise.then((handle) => { if (handle?.remove) handle.remove(); });
      };
    }
  }, [
    isSetup,
    notificationsEnabled,
    notificationHour,
    notificationMinute,
    // scheduleNotification reads the day-done state from the store at call time
    // (via refs in useNotificationManager), so a completion change must NOT
    // tear down and re-run this effect.
    requestNotificationPermission,
    scheduleNotification
  ]);
}
