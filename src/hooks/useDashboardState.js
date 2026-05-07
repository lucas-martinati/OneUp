import { useState, useEffect } from 'react';
import { getLocalDateStr } from '../utils/dateUtils';
import { useProgressContext } from '../contexts/ProgressContext';

export function useDashboardState() {
    const { getDayNumber, settings, scheduleNotification } = useProgressContext();

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
