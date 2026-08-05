import React, { useMemo, useState, useRef, useCallback } from 'react';
import { polarPoint, horizontalAnchor } from './chartMath';

const SIZE_X = 340;
const SIZE_Y = 210;
const CX = SIZE_X / 2;
const CY = SIZE_Y / 2;
const R = 76;
const RINGS = 4;

/**
 * Lightweight radar / spider chart (pure SVG). data: [{ subject, reps }].
 * Used for the muscle-balance breakdown.
 */
export default function RadarChart({ data, color = '#34d399' }) {
    const [active, setActive] = useState(null);
    const wrapRef = useRef(null);
    const max = useMemo(() => Math.max(...data.map((d) => d.reps), 1), [data]);
    const n = data.length;

    const dataKey = useMemo(() => {
        return data.map(d => `${d.subject}:${d.reps}`).join(',');
    }, [data]);

    const axes = useMemo(() => data.map((d, i) => {
        const angle = (i / n) * Math.PI * 2;
        const outer = polarPoint(CX, CY, R, angle);
        const labelPos = polarPoint(CX, CY, R + 10, angle);
        const value = polarPoint(CX, CY, R * (d.reps / max), angle);
        return { ...d, angle, outer, labelPos, value };
    }), [data, n, max]);

    const handlePointer = useCallback((e) => {
        const el = wrapRef.current;
        if (!el || data.length === 0) return;
        const rect = el.getBoundingClientRect();
        
        // Calculate coordinates relative to SVG viewBox
        const x = ((e.clientX - rect.left) / rect.width) * SIZE_X;
        const y = ((e.clientY - rect.top) / rect.height) * SIZE_Y;

        // Angle from center
        let a = Math.atan2(x - CX, CY - y);
        if (a < 0) a += Math.PI * 2;

        const slice = (Math.PI * 2) / n;
        const idx = Math.round(a / slice) % n;

        // Radial distance to center
        const dist = Math.hypot(x - CX, y - CY);
        if (dist > R + 35) {
            setActive(null);
        } else {
            setActive(idx);
        }
    }, [data.length, n]);

    const clear = useCallback(() => setActive(null), []);

    const pathD = useMemo(() => {
        if (axes.length === 0) return '';
        const points = axes.map(a => `${a.value.x} ${a.value.y}`).join(' L ');
        return `M ${points} Z`;
    }, [axes]);

    return (
        <div
            ref={wrapRef}
            className="svg-radar"
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
            onPointerLeave={clear}
        >
            <svg key={dataKey} viewBox={`0 0 ${SIZE_X} ${SIZE_Y}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
                {/* Concentric rings */}
                {Array.from({ length: RINGS }, (_, ring) => {
                    const rr = (R * (ring + 1)) / RINGS;
                    const pts = axes.map((a) => {
                        const p = polarPoint(CX, CY, rr, a.angle);
                        return `${p.x},${p.y}`;
                    }).join(' ');
                    return (
                        <polygon key={ring} points={pts} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    );
                })}

                {/* Spokes */}
                {axes.map((a, i) => (
                    <line
                        key={i}
                        x1={CX}
                        y1={CY}
                        x2={a.outer.x}
                        y2={a.outer.y}
                        stroke={active === i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}
                        strokeWidth={active === i ? 1.5 : 1}
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                    />
                ))}

                {/* Data polygon */}
                {pathD && (
                    <>
                        <path d={pathD} fill={color} fillOpacity="0.35" className="svg-radar-area" />
                        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="svg-radar-line" pathLength="1000" />
                    </>
                )}
                {axes.map((a, i) => (
                    <circle
                        key={i}
                        cx={a.value.x}
                        cy={a.value.y}
                        r="2.6"
                        fill={color}
                        className="svg-radar-dot"
                        style={{
                            animationDelay: `${(i / n) * 0.7}s`,
                        }}
                    />
                ))}

                {/* Active hover dot */}
                {active != null && (() => {
                    const a = axes[active];
                    return <circle cx={a.value.x} cy={a.value.y} r="4.2" fill={color} stroke="#fff" strokeWidth="2" style={{ pointerEvents: 'none' }} />;
                })()}

                {/* Axis labels */}
                {axes.map((a, i) => (
                    <text
                        key={i}
                        x={a.labelPos.x}
                        y={a.labelPos.y + 3}
                        textAnchor={horizontalAnchor(a.labelPos.x, CX)}
                        fill={active === i ? 'var(--text-primary)' : 'var(--text-secondary)'}
                        fontSize="9" fontWeight={active === i ? '800' : '600'}
                        style={{ transition: 'fill 0.2s, font-weight 0.2s' }}
                    >
                        {a.subject}
                    </text>
                ))}
            </svg>

            {/* Hover Tooltip */}
            {active != null && (() => {
                const a = axes[active];
                const tooltipLeftPct = (a.value.x / SIZE_X) * 100;
                const tooltipTopPct = (a.value.y / SIZE_Y) * 100;
                
                let tooltipShift = '-50%';
                if (tooltipLeftPct > 60) tooltipShift = '-100%';
                else if (tooltipLeftPct < 40) tooltipShift = '0';
                
                return (
                    <div
                        className="svg-chart-tooltip scale-in"
                        style={{
                            left: `${tooltipLeftPct}%`,
                            top: `${tooltipTopPct}%`,
                            transform: `translate(${tooltipShift}, -120%)`,
                        }}
                    >
                        <div className="svg-chart-tooltip-label" style={{ marginBottom: 0 }}>{a.subject}</div>
                        <div className="svg-chart-tooltip-row" style={{ marginTop: '2px', fontWeight: '800', color: color }}>
                            {a.reps} reps
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
