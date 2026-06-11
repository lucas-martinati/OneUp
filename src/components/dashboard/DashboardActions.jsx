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

    const accent = activeCategoryColor || selectedExercise.color;
    const gradEnd = activeCategoryColor || (selectedExercise.gradient && selectedExercise.gradient[0]) || selectedExercise.color;
    const background = `linear-gradient(135deg, ${accent}28, ${gradEnd}28)`;
    const accentStyle = {
        background,
        border: `1px solid ${accent}38`,
        transition: 'background 0.4s ease, border-color 0.4s ease'
    };

    return (
        <div className={`${styles.actions} ${isDay100 ? 'day100-actions' : ''}`}>
            {/* Calendar Button */}
            <button
                onClick={() => openModal('calendar')}
                className={`${styles.actionBtn} hover-lift`}
                style={accentStyle}
            >
                <CalendarIcon size={18} color={accent} />
                {t('dashboard.calendar')}
            </button>

            {/* Session Button */}
            <button
                onClick={() => {
                    openSession('config');
                    pauseCloudSync?.();
                }}
                className={`${styles.actionBtn} hover-lift`}
                style={accentStyle}
            >
                <Play size={18} color={accent} />
                {sessionInProgress ? t('dashboard.editSession') : t('dashboard.session')}
            </button>
        </div>
    );
});
