import { useState, useEffect } from 'react';
import { getLocalDateStr } from '../utils/dateUtils';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationManager } from './useNotificationManager';

export function useDashboardState() {
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const isDayDone = useProgressStore(s => s.isDayDone);
    const settings = useSettingsStore(s => s.settings);
    const { scheduleNotification } = useNotificationManager({ isDayDone, getDayNumber });

    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [isCounterTransitioning, setIsCounterTransitioning] = useState(false);
    const [prevDayNumber, setPrevDayNumber] = useState(null);
    const [showDayConfetti, setShowDayConfetti] = useState(false);

    useEffect(() => {
        const handleDayChange = () => {
            const currentDateStr = getLocalDateStr(new Date());
            if (currentDateStr !== today) {
                const previousDayNumber = getDayNumber(today);
                const newDayNumber = getDayNumber(currentDateStr);
                if (newDayNumber > previousDayNumber) {
                    setPrevDayNumber(previousDayNumber);
                    setIsCounterTransitioning(true);
                    setShowDayConfetti(true);
                    setTimeout(() => { setIsCounterTransitioning(false); setPrevDayNumber(null); }, 800);
                }
                setToday(currentDateStr);
                if (scheduleNotification) scheduleNotification(settings);
            }
        };
        handleDayChange();
        const interval = setInterval(handleDayChange, 10000);
        return () => clearInterval(interval);
    }, [today, getDayNumber, settings, scheduleNotification]);

    return {
        today,
        isCounterTransitioning,
        prevDayNumber,
        showDayConfetti,
        setShowDayConfetti
    };
}
