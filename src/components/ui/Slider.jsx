import { useState } from 'react';
import { haptics } from '@utils/hapticsManager';

/**
 * Range slider primitive (.premium-slider chrome in components.css).
 *
 * The native input runs with step="any" so the thumb and the fill track the
 * finger continuously; the value reported through onChange is snapped to
 * `step` (with a light haptic detent on each snap point crossed). On release
 * the thumb settles onto the snapped value.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} [step=0.1] – snap increment for the committed value
 * @param {number} value – current (snapped) value
 * @param {function} onChange – receives the snapped value
 * @param {string} [color] – accent (thumb + fill), any CSS color
 * @param {function} [onPointerUp] – extra pointer-up hook (e.g. blur a field)
 * @param {object} [style] – merged onto the input
 */
export function Slider({ min, max, step = 0.1, value, onChange, color = 'var(--accent)', onPointerUp, style, ...rest }) {
    const [dragVal, setDragVal] = useState(null);

    const decimals = (String(step).split('.')[1] || '').length;
    const snap = (raw) => {
        const snapped = Math.round((raw - min) / step) * step + min;
        return parseFloat(Math.min(max, Math.max(min, snapped)).toFixed(decimals));
    };

    const current = dragVal ?? value;
    const pct = ((current - min) / (max - min)) * 100;

    const handleChange = (e) => {
        const raw = parseFloat(e.target.value);
        setDragVal(raw);
        const snapped = snap(raw);
        if (snapped !== value) {
            haptics.light();
            onChange(snapped);
        }
    };

    const settle = (e) => {
        setDragVal(null);
        onPointerUp?.(e);
    };

    return (
        <input
            type="range"
            className="premium-slider"
            min={min}
            max={max}
            step="any"
            value={current}
            onChange={handleChange}
            onPointerUp={settle}
            onBlur={settle}
            style={{
                '--slider-color': color,
                background: `linear-gradient(to right, ${color} ${pct}%, var(--surface-muted) ${pct}%)`,
                ...style,
            }}
            {...rest}
        />
    );
}
