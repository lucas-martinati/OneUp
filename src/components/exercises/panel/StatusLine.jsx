import { Check } from '../../../utils/icons';
import { formatTime } from '../../../utils/dateUtils';

export function StatusLine({ activeColor, exerciseLabel, gradEnd, gradStart, isCompleted, isTimer, remaining, t }) {
    if (!isCompleted) {
        return (
            <div style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {isTimer ? t('timer.remaining', { time: formatTime(remaining) }) : t('common.remaining', { count: remaining })}
            </div>
        );
    }

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(135deg, ${activeColor}18, ${gradEnd}18)`,
            border: `1px solid ${activeColor}44`,
            boxShadow: `0 0 16px ${activeColor}22`,
            minHeight: '52px',
            boxSizing: 'border-box'
        }}>
            <Check size={24} color={activeColor} strokeWidth={3} />
            <span style={{
                color: activeColor,
                fontWeight: '600',
                fontSize: '1.1rem',
                background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                {isTimer ? t('timer.validated') : t('counter.validated', { exercise: exerciseLabel })}
            </span>
        </div>
    );
}
