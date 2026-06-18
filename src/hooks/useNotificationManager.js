import { useCallback, useRef, useEffect } from 'react';
import i18n from '../i18n';
import { getLocalDateStr } from '../utils/dateUtils';

const NOTIFICATION_ID = 1;

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
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });

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

          const dayNum = getDayNumberRef.current(notificationDateStr);

          // Compute a rough streak up to yesterday to determine context.
          // We check backwards from today (not from notificationDateStr, which
          // may be in the future after skipping done days).
          const todayStr = getLocalDateStr(new Date());
          let streak = 0;
          const todayDate = new Date(todayStr);
          for (let i = 0; i < 365; i++) {
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            if (isDayDoneRef.current(getLocalDateStr(checkDate))) {
              streak++;
            } else {
              break;
            }
          }

          const { title, body } = buildNotificationContent({ dayNum, streak });

          await LocalNotifications.schedule({
            notifications: [
              {
                id: NOTIFICATION_ID,
                title,
                body,
                schedule: { at: notificationTime, repeats: true, every: 'day' },
                sound: null,
                attachments: null,
                actionTypeId: '',
                extra: null,
              },
            ],
          });
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
