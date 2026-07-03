import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { haptics } from '@utils/hapticsManager';

/**
 * Organic toggle switch: a blob-shaped knob (shared counterBlobMorph) that
 * jellies (dropletSquish) each time the state flips. Chrome lives in
 * components.css (.toggle*); only the per-row active gradient stays inline.
 */
export function ToggleSwitch({ enabled, onClick, activeGradient = 'var(--gradient-glow)' }) {
    const { t } = useTranslation();
    const [squishing, setSquishing] = useState(false);
    const [prevEnabled, setPrevEnabled] = useState(enabled);

    // Sync state with prop change during render (same pattern as SegmentedControl)
    if (enabled !== prevEnabled) {
        setPrevEnabled(enabled);
        setSquishing(true);
    }

    useEffect(() => {
        if (squishing) {
            const timer = setTimeout(() => setSquishing(false), 600);
            return () => clearTimeout(timer);
        }
    }, [squishing]);

    return (
        <button
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? t('settings.disable') : t('settings.enable')}
            onClick={(e) => {
                haptics.light();
                onClick?.(e);
            }}
            className={`toggle${enabled ? ' toggle--on' : ''}`}
            style={{ background: enabled ? activeGradient : undefined }}
        >
            <span className={`toggle-knob${squishing ? ' toggle-knob--squish' : ''}`} />
        </button>
    );
}
