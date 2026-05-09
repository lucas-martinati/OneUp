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

export function useNotificationManager({ isDayDone, getDayNumber }) {
  const scheduleNotification = async (settings) => {
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
          while (isDayDone(notificationDateStr) && safetyCounter < 365) {
            notificationTime.setDate(notificationTime.getDate() + 1);
            notificationDateStr = getLocalDateStr(notificationTime);
            safetyCounter++;
          }

          const dayNum = getDayNumber(notificationDateStr);

          const messages = [
            i18n.t('notifications.body1', { day: dayNum }),
            i18n.t('notifications.body2'),
            i18n.t('notifications.body3'),
            i18n.t('notifications.body4', { day: dayNum }),
          ];
          const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

          await LocalNotifications.schedule({
            notifications: [
              {
                id: NOTIFICATION_ID,
                title: i18n.t('notifications.title'),
                body: selectedMessage,
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
  };

  const requestNotificationPermission = async () => {
    try {
      const { LocalNotifications } = await getLocalNotificationsModule();
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.debug('Permission request failed:', error);
    }
  };

  return { scheduleNotification, requestNotificationPermission };
}
