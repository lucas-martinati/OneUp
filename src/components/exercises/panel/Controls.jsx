import { CheckCheck, RotateCcw, Plus, Minus, Play, Pause } from '../../../utils/icons';

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
        <>
            {!isCompleted && (
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="glass hover-lift ripple"
                    style={{
                        width: 'clamp(72px, 12vh, 90px)',
                        height: 'clamp(72px, 12vh, 90px)',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${activeColor}44, ${gradEnd}44)`,
                        border: `2px solid ${activeColor}`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '10px',
                        boxShadow: `0 0 20px ${activeColor}66`,
                        transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease'
                    }}
                >
                    {isRunning ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" style={{ marginLeft: '4px' }} />}
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
        </>
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
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%', maxWidth: '360px' }}>
                {[1, 2, 5, 10].map(amount => (
                    <button
                        key={`plus-${amount}`}
                        onClick={() => handleIncrement(amount)}
                        className="glass hover-lift ripple"
                        disabled={isCompleted}
                        style={{
                            padding: 'clamp(12px, 2.2vh, 20px) 8px',
                            borderRadius: 'var(--radius-md)',
                            background: `linear-gradient(135deg, ${activeColor}2a, ${gradEnd}2a)`,
                            border: `1px solid ${activeColor}44`,
                            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontSize: 'clamp(1rem, 2.8vw, 1.3rem)',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: 'var(--touch-min)',
                            cursor: isCompleted ? 'not-allowed' : 'pointer',
                            opacity: isCompleted ? 0.4 : 1,
                            transition: 'background 0.45s ease, border-color 0.45s ease, opacity 0.2s ease'
                        }}
                    >
                        <Plus size={16} />
                        {amount}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(6px, 1vh, 8px)', width: '100%', maxWidth: '200px' }}>
                {[1, 5].map(amount => {
                    const canDecrement = displayCount > 0;
                    return (
                        <button
                            key={`minus-${amount}`}
                            onClick={() => handleDecrement(amount)}
                            className="glass hover-lift ripple"
                            disabled={!canDecrement}
                            style={{
                                padding: 'clamp(10px, 1.8vh, 16px) 8px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: !canDecrement ? 'var(--text-secondary)' : 'var(--text-primary)',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: 'var(--touch-min)',
                                cursor: !canDecrement ? 'not-allowed' : 'pointer',
                                opacity: !canDecrement ? 0.5 : 1
                            }}
                        >
                            <Minus size={16} />
                            {amount}
                        </button>
                    );
                })}
            </div>

            <ActionButtons
                activeColor={activeColor}
                completeFlash={completeFlash}
                completeLabel={t('counter.completeAll')}
                displayCount={displayCount}
                gradEnd={gradEnd}
                isCompleted={isCompleted}
                onComplete={handleCompleteAll}
                onReset={handleReset}
                resetLabel={t('counter.reset')}
            />
        </>
    );
}

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
        <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 'var(--spacing-sm)'
        }}>
            <button
                onClick={onReset}
                className="glass hover-lift"
                disabled={displayCount === 0}
                style={{
                    padding: 'clamp(10px, 1.5vh, 13px) clamp(16px, 3vw, 24px)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: displayCount === 0 ? 'var(--text-secondary)' : 'var(--error)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: displayCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: displayCount === 0 ? 0.5 : 1,
                    minHeight: 'var(--touch-min)'
                }}
            >
                <RotateCcw size={18} />
                {resetLabel}
            </button>

            <button
                onClick={onComplete}
                className={`glass hover-lift${completeFlash ? ' complete-flash success-glow' : ''}`}
                disabled={isCompleted}
                style={{
                    padding: 'clamp(10px, 1.5vh, 13px) clamp(16px, 3vw, 24px)',
                    borderRadius: 'var(--radius-lg)',
                    background: isCompleted
                        ? `linear-gradient(135deg, ${activeColor}33, ${gradEnd}33)`
                        : `linear-gradient(135deg, ${activeColor}22, ${gradEnd}22)`,
                    border: `1px solid ${isCompleted ? activeColor + '66' : activeColor + '44'}`,
                    color: isCompleted ? activeColor : 'var(--text-primary)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isCompleted ? 'not-allowed' : 'pointer',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    minHeight: 'var(--touch-min)'
                }}
            >
                <CheckCheck size={18} />
                {completeLabel}
            </button>
        </div>
    );
}
