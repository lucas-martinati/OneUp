import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Play } from 'lucide-react';

export const DashboardActions = React.memo(({
    setShowCalendar, setShowSession, pauseCloudSync, selectedExercise
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            display: 'flex', gap: '8px', width: '100%',
            paddingBottom: '2px'
        }}>
            {/* Calendar Button */}
            <button
                onClick={() => setShowCalendar(true)}
                className="hover-lift gradient-button"
                style={{
                    flex: 1, padding: 'clamp(12px, 1.8vh, 18px)', borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)', fontWeight: '600', border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${selectedExercise.color}28, ${selectedExercise.gradient[0]}28)`,
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                <CalendarIcon size={18} />
                {t('dashboard.calendar')}
            </button>

            {/* Session Button */}
            <button
                onClick={() => { setShowSession(true); pauseCloudSync?.(); }}
                className="hover-lift gradient-button"
                style={{
                    flex: 1, padding: 'clamp(12px, 1.8vh, 18px)', borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)', fontWeight: '600', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.2))',
                    boxShadow: 'var(--shadow-md)'
                }}
            >
                <Play size={18} />
                {t('dashboard.session')}
            </button>
        </div>
    );
});
