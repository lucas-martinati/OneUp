import React, { useMemo, useState } from 'react';
import { polarPoint } from './chartMath';

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 66;
const R_INNER = 42;
const GAP = 0.06; // radians of padding between slices

/** Arc path for a donut slice between two angles (0rad = top, clockwise). */
function arcPath(start, end) {
    const point = (r, a) => {
        const p = polarPoint(CX, CY, r, a);
        return [p.x, p.y];
    };
    const large = end - start > Math.PI ? 1 : 0;
    const [ox1, oy1] = point(R_OUTER, start);
    const [ox2, oy2] = point(R_OUTER, end);
    const [ix1, iy1] = point(R_INNER, end);
    const [ix2, iy2] = point(R_INNER, start);
    return `M ${ox1} ${oy1} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${ox2} ${oy2} `
        + `L ${ix1} ${iy1} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${ix2} ${iy2} Z`;
}

/**
 * Lightweight donut chart (pure SVG). data: [{ name, value, color }].
 * Tapping a slice highlights it and shows its share in the center.
 */
export default function DonutChart({ data, centerLabel }) {
    const [active, setActive] = useState(null);
    const total = useMemo(() => data.reduce((s, d) => s + (d.value || 0), 0), [data]);

    const slices = useMemo(() => {
        if (total <= 0) return [];
        let angle = 0;
        return data.map((d, i) => {
            const frac = (d.value || 0) / total;
            const sweep = frac * Math.PI * 2;
            const pad = sweep > GAP * 2 ? GAP : 0;
            const slice = { ...d, i, start: angle + pad / 2, end: angle + sweep - pad / 2, frac };
            angle += sweep;
            return slice;
        });
    }, [data, total]);

    const activeSlice = active != null ? slices.find((s) => s.i === active) : null;
    const currentLabel = activeSlice ? activeSlice.name : centerLabel?.label;
    const currentValue = activeSlice ? `${Math.round(activeSlice.frac * 100)}%` : centerLabel?.value;
    const hasLabel = !!currentLabel;

    const dataKey = useMemo(() => {
        return data.map(d => `${d.name}:${d.value}`).join(',');
    }, [data]);

    return (
        <div className="svg-donut">
            <svg key={dataKey} viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
                {slices.map((s) => (
                    <path
                        key={s.i}
                        d={arcPath(s.start, s.end)}
                        fill={s.color}
                        opacity={active == null || active === s.i ? 1 : 0.35}
                        style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                        onPointerEnter={() => setActive(s.i)}
                        onPointerLeave={() => setActive(null)}
                        onPointerDown={() => setActive((p) => (p === s.i ? null : s.i))}
                    />
                ))}
                {hasLabel ? (
                    <>
                        <text x={CX} y={CY - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="800">
                            {currentValue}
                        </text>
                        <text x={CX} y={CY + 13} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" opacity="0.8">
                            {currentLabel}
                        </text>
                    </>
                ) : (
                    <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fill="var(--text-primary)" fontSize="20" fontWeight="800">
                        {currentValue}
                    </text>
                )}
            </svg>

            <div className="svg-donut-legend">
                {data.map((d, i) => (
                    <button
                        key={i}
                        type="button"
                        className="svg-donut-legend-item"
                        onPointerEnter={() => setActive(i)}
                        onPointerLeave={() => setActive(null)}
                        style={{ opacity: active == null || active === i ? 1 : 0.4 }}
                    >
                        <span className="svg-donut-legend-dot" style={{ background: d.color }} />
                        {d.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
