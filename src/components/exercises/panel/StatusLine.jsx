import { Check } from '@utils/icons';
import { formatTime } from '@utils/formatters';

export function StatusLine({ activeColor, exerciseLabel, gradEnd, gradStart, isCompleted, isTimer, remaining, t }) {
    if (!isCompleted) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-secondary)',
                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                fontWeight: '500',
                minHeight: '48px',
                boxSizing: 'border-box'
            }}>
                <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: activeColor, flexShrink: 0,
                    boxShadow: `0 0 8px ${activeColor}`
                }} />
                {isTimer ? t('timer.remaining', { time: formatTime(remaining) }) : t('common.remaining', { count: remaining })}
            </div>
        );
    }

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px 24px',
            borderRadius: 'var(--radius-full)',
            background: `linear-gradient(135deg, ${activeColor}22, ${gradEnd}1a)`,
            border: `1px solid ${activeColor}55`,
            boxShadow: `0 0 22px ${activeColor}33`,
            minHeight: '48px',
            boxSizing: 'border-box'
        }}>
            <Check size={22} color={activeColor} strokeWidth={3} />
            <span style={{
                fontWeight: '700',
                fontSize: 'clamp(0.95rem, 2.6vw, 1.1rem)',
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
