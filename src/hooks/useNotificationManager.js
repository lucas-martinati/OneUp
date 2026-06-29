import { useCallback, useRef, useEffect } from 'react';
import i18n from '../i18n';
import { getLocalDateStr } from '@utils/dateUtils';

// Starting ID for daily notifications. The range [NOTIFICATION_ID, NOTIFICATION_ID + 6]
// is reserved exclusively for the 7 days of daily reminders.
const NOTIFICATION_ID = 1000;

let localNotificationsPromise = null;

async function getLocalNotificationsModule() {
  if (!localNotificationsPromise) {
    localNotificationsPromise = import('@capacitor/local-notifications');
  }

  return localNotificationsPromise;
}

/**
 * Milestone days that trigger a special notification title & body.
 * Checked with >= so that any day crossing a threshold counts.
 */
const MILESTONE_DAYS = [7, 14, 30, 50, 60, 90, 100, 150, 180, 200, 250, 300, 365];

/**
 * Pick a random element from an i18n array key.
 * `t('notifications.streak', { returnObjects: true })` gives an array.
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Determine the best notification category based on user context, then build
 * a {title, body} pair that feels personal and fresh.
 *
 * Priority order:
 * 1. Comeback  — streak is 0 (user missed yesterday)
 * 2. Milestone — day number hits a round milestone
 * 3. Streak    — user has an active streak >= 3
 * 4. Random    — weighted random across motivational / fun / challenge
 */
function buildNotificationContent({ dayNum, streak }) {
  const vars = { day: dayNum, streak };

  // ── 1. Comeback ─────────────────────────────────────────────────────
  if (streak === 0) {
    const comebackMessages = i18n.t('notifications.comeback', { returnObjects: true, ...vars });
    return {
      title: i18n.t('notifications.titleComeBack', vars),
      body: pickRandom(comebackMessages),
    };
  }

  // ── 2. Milestone ────────────────────────────────────────────────────
  if (MILESTONE_DAYS.includes(dayNum)) {
    const milestoneMessages = i18n.t('notifications.milestone', { returnObjects: true, ...vars });
    return {
      title: i18n.t('notifications.titleMilestone', vars),
      body: pickRandom(milestoneMessages),
    };
  }

  // ── 3. Streak ───────────────────────────────────────────────────────
  if (streak >= 3) {
    const streakMessages = i18n.t('notifications.streak', { returnObjects: true, ...vars });
    return {
      title: i18n.t('notifications.titleStreak', vars),
      body: pickRandom(streakMessages),
    };
  }

  // ── 4. Weighted random across the remaining categories ──────────────
  const categories = [
    { key: 'motivational', weight: 40 },
    { key: 'fun', weight: 35 },
    { key: 'challenge', weight: 25 },
  ];

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosenKey = 'motivational';

  for (const cat of categories) {
    roll -= cat.weight;
    if (roll <= 0) {
      chosenKey = cat.key;
      break;
    }
  }

  const messages = i18n.t(`notifications.${chosenKey}`, { returnObjects: true, ...vars });
  return {
    title: i18n.t('notifications.title', vars),
    body: pickRandom(messages),
  };
}

function buildIncrementalContent({ dayNum, streak, dayIndex }) {
  const vars = { day: dayNum, streak };

  switch (dayIndex) {
    case 0:
      return buildNotificationContent({ dayNum, streak });
    
    case 1: {
      const messages = i18n.t('notifications.fun', { returnObjects: true, ...vars });
      return {
        title: i18n.t('notifications.title', vars),
        body: pickRandom(messages),
      };
    }
    case 2:
    case 5: {
      const messages = i18n.t('notifications.challenge', { returnObjects: true, ...vars });
      return {
        title: i18n.t('notifications.title', vars),
        body: pickRandom(messages),
      };
    }
    case 3: {
      const messages = i18n.t('notifications.comeback', { returnObjects: true, ...vars });
      return {
        title: i18n.t('notifications.titleComeBack', vars),
        body: pickRandom(messages),
      };
    }
    case 4: {
      const messages = i18n.t('notifications.motivational', { returnObjects: true, ...vars });
      return {
        title: i18n.t('notifications.title', vars),
        body: pickRandom(messages),
      };
    }
    case 6:
    default:
      return {
        title: i18n.t('notifications.titleGoodbye', vars),
        body: i18n.t('notifications.goodbye', vars),
      };
  }
}

export function useNotificationManager({ isDayDone, getDayNumber }) {
  const isDayDoneRef = useRef(isDayDone);
  const getDayNumberRef = useRef(getDayNumber);

  useEffect(() => {
    isDayDoneRef.current = isDayDone;
    getDayNumberRef.current = getDayNumber;
  }, [isDayDone, getDayNumber]);

  const scheduleNotification = useCallback(async (settings) => {
    try {
      const { LocalNotifications } = await getLocalNotificationsModule();
      const permission = await LocalNotifications.checkPermissions();

      if (permission.display === 'granted') {
        const cancelIds = Array.from({ length: 7 }, (_, idx) => ({ id: NOTIFICATION_ID + idx }));
        await LocalNotifications.cancel({ notifications: cancelIds });

        // cancel() only drops *pending* (scheduled) notifications. A reminder that
        // has already been delivered — e.g. re-fired at boot by the plugin's restore
        // receiver, which reschedules past-due notifications to "now + 15s" — stays
        // in the notification shade and reappears every time it's swiped away. Clear
        // our reserved slots from the tray explicitly. Best-effort: ignore if the
        // platform/plugin doesn't support it.
        try {
          await LocalNotifications.removeDeliveredNotifications({ notifications: cancelIds });
        } catch (removeError) {
          console.debug('removeDeliveredNotifications failed:', removeError);
        }

        if (settings?.notificationsEnabled) {
          const { hour, minute } = settings.notificationTime;

          const now = new Date();
          let notificationTime = new Date();
          notificationTime.setHours(hour, minute, 0, 0);

          if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }

          let notificationDateStr = getLocalDateStr(notificationTime);
          let safetyCounter = 0;

          // Skip already-done days
          while (isDayDoneRef.current(notificationDateStr) && safetyCounter < 365) {
            notificationTime.setDate(notificationTime.getDate() + 1);
            notificationDateStr = getLocalDateStr(notificationTime);
            safetyCounter++;
          }

          const notificationsList = [];

          // Compute the active streak once (avoids redundant 7 x 365 iterations).
          // Anchor the count on today only if it's already done; otherwise count
          // up to yesterday. Not having done today yet does NOT break the streak —
          // that's precisely what the reminder is for. Mirrors the canonical
          // `todayDone ? currentStreak : yesterdayStreak` logic in useComputedStats.
          const todayStr = getLocalDateStr(new Date());
          let streak = 0;
          const streakAnchor = new Date(todayStr);
          if (!isDayDoneRef.current(todayStr)) {
            streakAnchor.setDate(streakAnchor.getDate() - 1);
          }
          for (let j = 0; j < 365; j++) {
            const checkDate = new Date(streakAnchor);
            checkDate.setDate(checkDate.getDate() - j);
            if (isDayDoneRef.current(getLocalDateStr(checkDate))) {
              streak++;
            } else {
              break;
            }
          }

          // Track the count of successfully scheduled notifications to maintain cohesive narrative progression.
          // Using scheduledCount for dayIndex ensures the user receives the motivational/challenge steps
          // in the correct logical sequence (without gaps) even if some days are skipped.
          let scheduledCount = 0;
          for (let i = 0; i < 7; i++) {
            const targetTime = new Date(notificationTime);
            targetTime.setDate(targetTime.getDate() + i);

            const targetDateStr = getLocalDateStr(targetTime);
            // Defensive check to avoid scheduling notifications on days already completed
            if (isDayDoneRef.current(targetDateStr)) {
              continue;
            }

            const dayNum = getDayNumberRef.current(targetDateStr);
            const { title, body } = buildIncrementalContent({ dayNum, streak, dayIndex: scheduledCount });

            notificationsList.push({
              id: NOTIFICATION_ID + i, // Maps directly to daily offset to maintain fixed slot IDs
              title,
              body,
              schedule: { at: targetTime },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null,
            });

            scheduledCount++;
          }

          if (notificationsList.length > 0) {
            await LocalNotifications.schedule({ notifications: notificationsList });
          }
        }
      }
    } catch (error) {
      console.debug('Notification scheduling failed:', error);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const { LocalNotifications } = await getLocalNotificationsModule();
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.debug('Permission request failed:', error);
    }
  }, []);

  return { scheduleNotification, requestNotificationPermission };
}
