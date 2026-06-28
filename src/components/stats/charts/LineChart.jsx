import React, { useMemo, useRef, useState, useId, useCallback } from 'react';
import { scaleX, scaleY, niceTicks, smoothLinePath, stepLinePath, pickLabelIndices } from './chartMath';

const VBW = 320;
const VBH = 150;
const PAD = { top: 14, right: 12, bottom: 26, left: 36 };
const PLOT = {
    left: PAD.left,
    right: VBW - PAD.right,
    top: PAD.top,
    bottom: VBH - PAD.bottom,
};

/**
 * Lightweight responsive line/area chart (pure SVG, no charting lib).
 * Responsiveness comes from the viewBox — no ResizeObserver, no reflow.
 * Interaction (touch/hover) only re-renders while the finger is down.
 *
 * data:   [{ label, [seriesKey]: number|null }]
 * series: [{ key, color, name }]
 */
export default function LineChart({
    data,
    series,
    yMin,
    yMax,
    formatValue = (v) => `${v}`,
    formatYTick = (v) => `${v}`,
    dots = 'auto',
    step = false,
}) {
    const gradId = useId().replace(/:/g, '');
    const wrapRef = useRef(null);
    const [active, setActive] = useState(null);

    const ticks = useMemo(() => niceTicks(yMin, yMax, 4), [yMin, yMax]);
    const showDots = dots === true || (dots === 'auto' && data.length <= 12);
    const isArea = series.length === 1;

    // Per-series screen-space points (skipping gaps, like recharts connectNulls).
    const seriesPaths = useMemo(() => series.map((s) => {
        const pts = [];
        data.forEach((d, i) => {
            const v = d[s.key];
            if (v == null || Number.isNaN(v)) return;
            pts.push({
                i,
                x: scaleX(i, data.length, PLOT.left, PLOT.right),
                y: scaleY(v, yMin, yMax, PLOT.top, PLOT.bottom),
                v,
            });
        });
        const line = step ? stepLinePath(pts) : smoothLinePath(pts, PLOT.top, PLOT.bottom);
        return { ...s, pts, line };
    }), [data, series, yMin, yMax, step]);

    const getSeriesValueAtActive = useCallback((s, activeIdx) => {
        const pts = s.pts;
        if (!pts || pts.length === 0) return null;
        if (activeIdx < pts[0].i || activeIdx > pts[pts.length - 1].i) return null;

        // Find boundary points
        let prev = pts[0];
        let next = pts[pts.length - 1];
        for (let k = 0; k < pts.length; k++) {
            const pt = pts[k];
            if (pt.i <= activeIdx && pt.i > prev.i) {
                prev = pt;
            }
            if (pt.i >= activeIdx && pt.i < next.i) {
                next = pt;
            }
        }
        if (prev.i === next.i) return prev.v;
        // Mode escalier : on maintient la dernière valeur enregistrée au lieu d'interpoler.
        if (step) return prev.v;
        const frac = (activeIdx - prev.i) / (next.i - prev.i);
        return prev.v + frac * (next.v - prev.v);
    }, [step]);

    const labelIndices = useMemo(() => pickLabelIndices(data.length, 5), [data.length]);

    const handlePointer = useCallback((e) => {
        const el = wrapRef.current;
        if (!el || data.length === 0) return;
        const rect = el.getBoundingClientRect();
        const xFrac = (e.clientX - rect.left) / rect.width;
        const plotFrac = (xFrac - PLOT.left / VBW) / ((PLOT.right - PLOT.left) / VBW);
        const idx = Math.max(0, Math.min(data.length - 1, Math.round(plotFrac * (data.length - 1))));
        setActive(idx);
    }, [data.length]);

    const clear = useCallback(() => setActive(null), []);

    const activeX = active != null ? scaleX(active, data.length, PLOT.left, PLOT.right) : 0;
    const tooltipLeftPct = (activeX / VBW) * 100;

    const xLabelAnchor = (i) => {
        if (i === 0) return 'start';
        if (i === data.length - 1) return 'end';
        return 'middle';
    };

    let tooltipShift = '-50%';
    if (tooltipLeftPct > 60) tooltipShift = '-100%';
    else if (tooltipLeftPct < 40) tooltipShift = '0';

    return (
        <div
            ref={wrapRef}
            className="svg-chart"
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') handlePointer(e); }}
            onPointerLeave={clear}
            onPointerUp={clear}
        >
            <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
                <defs>
                    {seriesPaths.map((s) => (
                        <linearGradient key={s.key} id={`${gradId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>

                {/* Horizontal grid + Y ticks */}
                {ticks.map((tk) => {
                    const y = scaleY(tk, yMin, yMax, PLOT.top, PLOT.bottom);
                    return (
                        <g key={tk}>
                            <line
                                x1={PLOT.left} x2={PLOT.right} y1={y} y2={y}
                                stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                            />
                            <text
                                x={PLOT.left - 6} y={y + 3} textAnchor="end"
                                fill="var(--text-secondary)" fontSize="9" opacity="0.75"
                            >
                                {formatYTick(tk)}
                            </text>
                        </g>
                    );
                })}

                {/* X labels */}
                {labelIndices.map((i) => (
                    <text
                        key={i}
                        x={scaleX(i, data.length, PLOT.left, PLOT.right)}
                        y={VBH - 8}
                        textAnchor={xLabelAnchor(i)}
                        fill="var(--text-secondary)" fontSize="9" opacity="0.7"
                    >
                        {data[i]?.label}
                    </text>
                ))}

                {/* Area fill (single-series only) */}
                {isArea && seriesPaths[0].pts.length > 1 && (
                    <path
                        className="svg-chart-area"
                        d={`${seriesPaths[0].line} L ${seriesPaths[0].pts.at(-1).x} ${PLOT.bottom} L ${seriesPaths[0].pts[0].x} ${PLOT.bottom} Z`}
                        fill={`url(#${gradId}-${seriesPaths[0].key})`}
                    />
                )}

                {/* Active guide line */}
                {active != null && (
                    <line
                        x1={activeX} x2={activeX} y1={PLOT.top} y2={PLOT.bottom}
                        stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3"
                    />
                )}

                {/* Lines + dots */}
                {seriesPaths.map((s) => (
                    <g key={s.key}>
                        <path
                            className="svg-chart-line"
                            d={s.line} fill="none" stroke={s.color}
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                        {showDots && s.pts.map((p) => (
                            <circle
                                key={p.i}
                                cx={p.x}
                                cy={p.y}
                                r="2.6"
                                fill={s.color}
                                stroke="var(--surface-card, #1a1a2e)"
                                strokeWidth="1.2"
                                className="svg-chart-dot"
                                style={{
                                    animationDelay: `${(p.i / (data.length - 1 || 1)) * 0.85}s`,
                                }}
                            />
                        ))}
                        {active != null && (() => {
                            const val = getSeriesValueAtActive(s, active);
                            if (val == null) return null;
                            const cx = scaleX(active, data.length, PLOT.left, PLOT.right);
                            const cy = scaleY(val, yMin, yMax, PLOT.top, PLOT.bottom);
                            return <circle cx={cx} cy={cy} r="4.2" fill={s.color} stroke="#fff" strokeWidth="2" />;
                        })()}
                    </g>
                ))}
            </svg>

            {/* Tooltip */}
            {active != null && (
                <div
                    className="svg-chart-tooltip"
                    style={{
                        left: `${tooltipLeftPct}%`,
                        transform: `translateX(${tooltipShift}) translateY(2px)`,
                    }}
                >
                    <div className="svg-chart-tooltip-label">{data[active]?.label}</div>
                    {seriesPaths.map((s) => {
                        const v = getSeriesValueAtActive(s, active);
                        if (v == null || Number.isNaN(v)) return null;
                        return (
                            <div key={s.key} className="svg-chart-tooltip-row">
                                <span className="svg-chart-tooltip-dot" style={{ background: s.color }} />
                                <span className="svg-chart-tooltip-name">{s.name}</span>
                                <span className="svg-chart-tooltip-val" style={{ color: s.color }}>{formatValue(v)}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
