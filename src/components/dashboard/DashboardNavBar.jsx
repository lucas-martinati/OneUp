import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Play, PieChart, Users, SettingsIcon } from '@utils/icons';
import { useUIStore } from '@store/useUIStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';

import styles from './DashboardNavBar.module.css';

/**
 * Bottom navigation bar of the dashboard — all primary destinations in
 * thumb reach, with the Session action as the elevated central button.
 */
export const DashboardNavBar = React.memo(({
    selectedExercise, activeCategoryColor
}) => {
    const { t } = useTranslation();
    const openModal = useUIStore(s => s.openModal);
    const openSession = useUIStore(s => s.openSession);
    const sessionInProgress = useUIStore(s => s.sessionInProgress);
    const pauseCloudSync = useCloudSyncStore(s => s.pauseCloudSync);

    const accent = activeCategoryColor || selectedExercise.color;
    const gradEnd = (selectedExercise.gradient && selectedExercise.gradient[1]) || accent;

    const navItem = (id, Icon, label) => (
        <button
            key={id}
            onClick={() => openModal(id)}
            aria-label={label}
            className={styles.navItem}
        >
            <Icon size={19} />
            <span className={styles.label}>{label}</span>
        </button>
    );

    return (
        <nav className={`${styles.navBar} dashboard-nav-bar`}>
            {navItem('calendar', CalendarIcon, t('dashboard.calendar'))}
            {navItem('stats', PieChart, t('stats.title'))}

            {/* Central Séance button */}
            <button
                onClick={() => {
                    openSession('config');
                    pauseCloudSync?.();
                }}
                aria-label={sessionInProgress ? t('dashboard.editSession') : t('dashboard.session')}
                className={styles.sessionBtn}
            >
                <span
                    className={styles.sessionCircle}
                    style={{
                        background: `linear-gradient(135deg, ${accent}, ${gradEnd})`,
                        boxShadow: `0 6px 20px ${accent}55, 0 0 0 1px ${accent}33`
                    }}
                >
                    <Play size={22} color="white" fill="white" style={{ marginLeft: '2px' }} />
                    {sessionInProgress && <span className={styles.sessionDot} />}
                </span>
                <span className={styles.label}>{t('dashboard.session')}</span>
            </button>

            {navItem('leaderboard', Users, t('leaderboard.title'))}
            {navItem('settings', SettingsIcon, t('settings.title'))}
        </nav>
    );
});
