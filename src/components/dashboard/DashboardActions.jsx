import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Play } from '../../utils/icons';

import styles from './DashboardActions.module.css';

export const DashboardActions = React.memo(({
    setShowCalendar, setShowSession, setSessionMode, sessionInProgress, pauseCloudSync, selectedExercise, activeCategoryColor, isDay100
}) => {
    const { t } = useTranslation();

    const background = `linear-gradient(135deg, ${activeCategoryColor || selectedExercise.color}28, ${activeCategoryColor || (selectedExercise.gradient && selectedExercise.gradient[0]) || selectedExercise.color}28)`;

    return (
        <div className={`${styles.actions} ${isDay100 ? 'day100-actions' : ''}`}>
            {/* Calendar Button */}
            <button
                onClick={() => setShowCalendar(true)}
                className={`${styles.actionBtn} hover-lift`}
                style={{ background }}
            >
                <CalendarIcon size={18} />
                {t('dashboard.calendar')}
            </button>

            {/* Session Button */}
            <button
                onClick={() => {
                    setSessionMode('config');
                    setShowSession(true);
                    pauseCloudSync?.();
                }}
                className={`${styles.actionBtn} hover-lift`}
                style={{ background }}
            >
                <Play size={18} />
                {sessionInProgress ? t('dashboard.editSession') : t('dashboard.session')}
            </button>
        </div>
    );
});
