import { useTranslation } from 'react-i18next';
import { Clock, ChevronRight, DynamicIcon } from '@utils/icons';
import { getExerciseColor } from '@utils/exerciseLabel';
import { sectionTitleStyle } from './statsStyles';

/** Recent workout sessions list (last 10), opens the session detail modal. */
export function SessionHistoryList({ sessionHistory, onSelectSession }) {
    const { t, i18n } = useTranslation();

    if (sessionHistory.length === 0) return null;

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            background: 'var(--surface-section)',
        }}>
            <h3 style={{
                ...sectionTitleStyle,
                display: 'flex', alignItems: 'center', gap: '6px',
            }}>
                <Clock size={14} />
                {t('share.recentSessions')}
            </h3>
            <div className="flex-col gap-4">
                {sessionHistory.slice(0, 10).map((session, i) => {
                    const exercises = session.exercises || [];
                    const hasName = session.name && session.name.trim().length > 0;
                    const dateObj = new Date(session.date);
                    const dateLabel = dateObj.toLocaleDateString(i18n.language, {
                        day: 'numeric', month: 'short',
                    });
                    return (
                        <button
                            key={session.id || i}
                            onClick={() => onSelectSession(session)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer', width: '100%', textAlign: 'left',
                                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            }}
                        >
                            <span style={{
                                fontSize: '0.7rem', color: 'var(--text-secondary)',
                                width: '40px', flexShrink: 0, fontWeight: 500,
                            }}>
                                {dateLabel}
                            </span>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {hasName && (
                                    <span style={{
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {session.name}
                                    </span>
                                )}
                                {exercises.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
                                        {exercises.map((ex, j) => {
                                            return <DynamicIcon key={ex.id || j} icon={ex.icon} size={13} color={getExerciseColor(ex)} />;
                                        })}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={14} color="var(--text-secondary)" style={{ opacity: 0.4, flexShrink: 0 }} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
