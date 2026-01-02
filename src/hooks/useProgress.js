import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

const STORAGE_KEY = 'pushup_challenge_data';
const NOTIFICATION_ID = 1;

export function useProgress() {
  // Helper to get consistent YYYY-MM-DD in local time
  const getLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let parsed = saved ? JSON.parse(saved) : null;
    
    // Always start Jan 1st of current year
    const currentYear = new Date().getFullYear();
    const fixedStartDate = `${currentYear}-01-01`;

    if (!parsed || parsed.startDate !== fixedStartDate) {
      // New year or fresh install: Reset everything
      // We do NOT auto-complete here anymore, we wait for Onboarding logic
      return {
        startDate: fixedStartDate,
        userStartDate: fixedStartDate, // Default matches fixed
        completions: {},
        isSetup: false 
      };
    }
    
    // Legacy support
    if (parsed.isSetup === undefined) {
        return { ...parsed, isSetup: true, userStartDate: parsed.startDate };
    }
    
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startChallenge = (userStartDate) => {
    setState(prev => {
        const newCompletions = { ...prev.completions };
        let userStartStr = prev.startDate;

        if (userStartDate) {
            // Re-construct start date as local midnight
            const startYear = userStartDate.getFullYear();
            const startMonth = userStartDate.getMonth();
            const startDay = userStartDate.getDate();
            
            const start = new Date(startYear, startMonth, startDay);
            userStartStr = getLocalDateStr(start); // Save for UI blocking

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const loopDate = new Date(start);
            // Backfill logic: Validates days from USER START until Yesterday
            // But wait, if userStartDate is FUTURE, we shouldn't backfill anything.
            // And loopDate < today handles that (start > today, loop doesn't run).
            while (loopDate < today) {
                newCompletions[getLocalDateStr(loopDate)] = {
                    done: true,
                    timestamp: new Date().toISOString(),
                    timeOfDay: null // Auto-filled, so no specific stats
                };
                loopDate.setDate(loopDate.getDate() + 1);
            }
        }
        return { 
            ...prev, 
            completions: newCompletions, 
            isSetup: true,
            userStartDate: userStartStr 
        };
    });
  };

  const toggleCompletion = (dateStr) => {
    setState(prev => {
      const newCompletions = { ...prev.completions };
      const current = newCompletions[dateStr];
      
      // Toggle logic: If exists, remove. If not, add.
      if (current) {
         delete newCompletions[dateStr];
      } else {
         const now = new Date();
         const hour = now.getHours();
         let timeOfDay = 'morning';
         if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
         if (hour >= 18) timeOfDay = 'evening';

         newCompletions[dateStr] = {
            done: true,
            timestamp: now.toISOString(),
            timeOfDay
         };
      }
      return { ...prev, completions: newCompletions };
    });
  };
  
  // Schedule daily notification
  const scheduleNotification = async (settings) => {
    try {
      // Check if we have permission first
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display === 'granted') {
        // Cancel existing notification
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
        
        // Only schedule if notifications are enabled
        if (settings?.notificationsEnabled) {
          const { hour, minute } = settings.notificationTime;
          
          // Calculate next notification time
          const now = new Date();
          const notificationTime = new Date();
          notificationTime.setHours(hour, minute, 0, 0);
          
          // If time has passed today, schedule for tomorrow
          if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }
          
          // Calculate day number for when notification will be sent
          const notificationDateStr = getLocalDateStr(notificationTime);
          const dayNum = getDayNumber(notificationDateStr);
          
          // Create engaging message with exact pushup count
          const messages = [
            `🎯 ${dayNum} pushups today! Let\'s crush this goal! 💪`,
            `💥 Challenge: ${dayNum} pushups! You got this! 🔥`,
            `⚡ ${dayNum} pushups waiting for you! Time to shine! ✨`,
            `🚀 ${dayNum} pushups to keep the streak alive! Let\'s go! 🏆`
          ];
          
          // Randomly select a message for variety
          const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
          
          await LocalNotifications.schedule({
            notifications: [
              {
                id: NOTIFICATION_ID,
                title: '💪 OneUp - Daily Challenge!',
                body: selectedMessage,
                schedule: {
                  at: notificationTime,
                  repeats: true,
                  every: 'day'
                },
                sound: null,
                attachments: null,
                actionTypeId: '',
                extra: null
              }
            ]
          });
        }
      }
    } catch (error) {
      console.debug('Notification scheduling failed:', error);
    }
  };
  
  // Request notification permissions
  const requestNotificationPermission = async () => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.debug('Permission request failed:', error);
    }
  };

  const getDayNumber = (dateStr) => {
    if (!state.startDate) return 0;
    const start = new Date(state.startDate);
    const current = new Date(dateStr);
    
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());

    const diffTime = utcCurrent - utcStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays + 1;
  };

  const getTotalPushups = () => {
    return Object.keys(state.completions).reduce((total, dateStr) => {
      if (dateStr < state.startDate) return total;
      return total + getDayNumber(dateStr);
    }, 0);
  };
  
  return {
    startDate: state.startDate,
    completions: state.completions,
    startChallenge,
    toggleCompletion,
    getDayNumber,
    getTotalPushups,
    getLocalDateStr,
    isSetup: state.isSetup,
    userStartDate: state.userStartDate || state.startDate,
    scheduleNotification,
    requestNotificationPermission
  };
}
