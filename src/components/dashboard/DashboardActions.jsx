import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Play } from '../../utils/icons';
import { useUIStore } from '../../store/useUIStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';

import styles from './DashboardActions.module.css';

export const DashboardActions = React.memo(({
    selectedExercise, activeCategoryColor, isDay100
}) => {
    const { t } = useTranslation();
    const openModal = useUIStore(s => s.openModal);
    const openSession = useUIStore(s => s.openSession);
    const sessionInProgress = useUIStore(s => s.sessionInProgress);
    const pauseCloudSync = useCloudSyncStore(s => s.pauseCloudSync);

    const background = `linear-gradient(135deg, ${activeCategoryColor || selectedExercise.color}28, ${activeCategoryColor || (selectedExercise.gradient && selectedExercise.gradient[0]) || selectedExercise.color}28)`;

    return (
        <div className={`${styles.actions} ${isDay100 ? 'day100-actions' : ''}`}>
            {/* Calendar Button */}
            <button
                onClick={() => openModal('calendar')}
                className={`${styles.actionBtn} hover-lift`}
                style={{ background }}
            >
                <CalendarIcon size={18} />
                {t('dashboard.calendar')}
            </button>

            {/* Session Button */}
            <button
                onClick={() => {
                    openSession('config');
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
