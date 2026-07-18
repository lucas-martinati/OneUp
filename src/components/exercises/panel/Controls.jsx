import { CheckCheck, RotateCcw, Plus, Minus, Play, Pause } from '@utils/icons';

export function TimerControls({
    activeColor,
    completeFlash,
    displayCount,
    gradEnd,
    handleCompleteAll,
    handleReset,
    isCompleted,
    isRunning,
    setIsRunning,
    t
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 2vh, 20px)', width: '100%', maxWidth: '360px' }}>
            {!isCompleted && (
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="hover-lift ripple"
                    aria-label={isRunning ? t('timer.reset') : t('common.next')}
                    style={{
                        width: 'clamp(76px, 13vh, 96px)',
                        height: 'clamp(76px, 13vh, 96px)',
                        borderRadius: '50%',
                        background: isRunning
                            ? `linear-gradient(135deg, ${activeColor}, ${gradEnd})`
                            : `radial-gradient(circle at 50% 35%, ${activeColor}cc, ${gradEnd})`,
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 10px 30px ${activeColor}66, 0 0 0 6px ${activeColor}1f, inset 0 2px 0 rgba(255,255,255,0.3)`,
                        transition: 'background 0.35s ease, box-shadow 0.35s ease, transform 0.2s ease'
                    }}
                >
                    {isRunning ? <Pause size={34} fill="white" /> : <Play size={34} fill="white" style={{ marginLeft: '5px' }} />}
                </button>
            )}
            <ActionButtons
                activeColor={activeColor}
                completeFlash={completeFlash}
                completeLabel={t('timer.skip')}
                displayCount={displayCount}
                gradEnd={gradEnd}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                onReset={handleReset}
                resetLabel={t('timer.reset')}
            />
        </div>
    );
}

export function CounterControls({
    activeColor,
    completeFlash,
    displayCount,
    gradEnd,
    handleCompleteAll,
    handleDecrement,
    handleIncrement,
    handleReset,
    isCompleted,
    t
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 1.4vh, 12px)', width: '100%', maxWidth: '360px' }}>
            {/* Primary interaction: increment quad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%' }}>
                {[1, 2, 5, 10].map(amount => (
                    <button
                        key={`plus-${amount}`}
                        onClick={() => handleIncrement(amount)}
                        className="hover-lift ripple"
                        disabled={isCompleted}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1px',
                            padding: 'clamp(12px, 2.2vh, 18px) 4px',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(160deg, ${activeColor}33, ${gradEnd}1a)`,
                            border: `1px solid ${activeColor}55`,
                            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: 'clamp(1.1rem, 3.2vw, 1.45rem)',
                            fontWeight: '800',
                            fontVariantNumeric: 'tabular-nums',
                            minHeight: 'var(--touch-min)',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.35 : 1,
                            boxShadow: isCompleted ? 'none' : `0 3px 12px ${activeColor}26`,
                            transition: 'background 0.45s ease, border-color 0.45s ease, opacity 0.2s ease, transform 0.12s ease'
                        }}
                    >
                        <Plus size={14} style={{ opacity: 0.7 }} />
                        {amount}
                    </button>
                ))}
            </div>

            {/* Utility row: decrements + reset */}
            <div style={{ display: 'flex', gap: 'clamp(6px, 1vh, 8px)', width: '100%' }}>
                {[1, 5].map(amount => {
                    const canDecrement = displayCount > 0;
                    return (
                        <button
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="hover-lift ripple"
                            disabled={!canDecrement}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: 'clamp(9px, 1.6vh, 13px) 4px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.09)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                                fontWeight: '600',
                                fontVariantNumeric: 'tabular-nums',
                                minHeight: 'var(--touch-min)',
                                cursor: !canDecrement ? 'not-allowed' : 'pointer',
                                opacity: !canDecrement ? 0.4 : 1
                            }}
                        >
                            <Minus size={14} style={{ opacity: 0.7 }} />
                            {amount}
                        </button>
                    );
                })}
                <ResetButton onReset={handleReset} disabled={displayCount === 0} label={t('counter.reset')} />
            </div>

            {/* Primary CTA */}
            <CompleteButton
                activeColor={activeColor}
                gradEnd={gradEnd}
                completeFlash={completeFlash}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                label={t('counter.completeAll')}
            />
        </div>
    );
}

/** Subtle, danger-tinted reset (utility). */
function ResetButton({ onReset, disabled, label }) {
    return (
        <button
            onClick={onReset}
            className="hover-lift"
            disabled={disabled}
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: 'clamp(9px, 1.6vh, 13px) 4px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.22)',
                color: disabled ? 'var(--text-secondary)' : 'var(--error)',
                fontSize: 'clamp(0.85rem, 2.4vw, 1rem)',
                fontWeight: '600',
                minHeight: 'var(--touch-min)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1
            }}
        >
            <RotateCcw size={16} />
            {label}
        </button>
    );
}

/** Filled primary call-to-action: complete the exercise. */
function CompleteButton({ activeColor, gradEnd, completeFlash, isCompleted, onComplete, label }) {
    return (
        <button
            onClick={onComplete}
            className={`hover-lift ripple${completeFlash ? ' complete-flash success-glow' : ''}`}
            disabled={isCompleted}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: 'clamp(13px, 2vh, 17px)',
                borderRadius: 'var(--radius-lg)',
                background: isCompleted
                    ? `linear-gradient(135deg, ${activeColor}26, ${gradEnd}1a)`
                    : `linear-gradient(135deg, ${activeColor}, ${gradEnd})`,
                border: isCompleted ? `1px solid ${activeColor}55` : 'none',
                color: isCompleted ? activeColor : 'white',
                fontSize: 'clamp(0.95rem, 2.6vw, 1.1rem)',
                fontWeight: '800',
                cursor: isCompleted ? 'not-allowed' : 'pointer',
                opacity: isCompleted ? 0.65 : 1,
                boxShadow: isCompleted ? 'none' : `0 8px 24px ${activeColor}55, inset 0 2px 0 rgba(255,255,255,0.25)`,
                transition: 'background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
                minHeight: 'var(--touch-min)'
            }}
        >
            <CheckCheck size={20} />
            {label}
        </button>
    );
}

/** Reset + Complete pair, used by the timer (skip = complete). */
function ActionButtons({
    activeColor,
    completeFlash,
    completeLabel,
    displayCount,
    gradEnd,
    isCompleted,
    onComplete,
    onReset,
    resetLabel
}) {
    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', width: '100%' }}>
            <ResetButton onReset={onReset} disabled={displayCount === 0} label={resetLabel} />
            <div style={{ flex: 1.6, display: 'flex' }}>
                <CompleteButton
                    activeColor={activeColor}
                    gradEnd={gradEnd}
                    completeFlash={completeFlash}
                    isCompleted={isCompleted}
                    onComplete={onComplete}
                    label={completeLabel}
                />
            </div>
        </div>
    );
}
