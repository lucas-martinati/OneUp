import React, { useEffect, useState } from 'react';

const prefersReduced = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

const TICK_MS = 45; // ~22fps scramble — reads as "digital" without flooding renders

/** Replace each digit of a formatted string with a random one (keeps %, separators…). */
function scramble(str) {
    let out = '';
    for (const ch of str) out += /[0-9]/.test(ch) ? String(Math.floor(Math.random() * 10)) : ch;
    return out;
}

/**
 * A number that animates whenever its value changes: digits scramble "in all
 * directions" then settle left-to-right on the final value.
 *
 * While `pending` is true (e.g. a filter change is still recomputing), it keeps
 * scrambling so the change feels instant; once the real value lands it settles.
 */
export function AnimatedNumber({ value, format = (v) => String(v), pending = false, duration = 650, style, className }) {
    const finalStr = format(value);
    const [display, setDisplay] = useState(finalStr);

    useEffect(() => {
        if (prefersReduced) { setDisplay(finalStr); return; }

        let active = true;
        let raf;
        let last = 0;

        if (pending) {
            // Continuous scramble for instant feedback while the value is resolving.
            const loop = (now) => {
                if (!active) return;
                if (now - last > TICK_MS) { last = now; setDisplay(scramble(finalStr)); }
                raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        } else {
            // Settle: digits lock left-to-right as progress advances.
            const target = finalStr;
            const digitIdx = [];
            [...target].forEach((ch, i) => { if (/[0-9]/.test(ch)) digitIdx.push(i); });
            if (digitIdx.length === 0) { setDisplay(target); return; }

            const start = performance.now();
            const animate = (now) => {
                if (!active) return;
                const p = Math.min((now - start) / duration, 1);
                if (p >= 1) { setDisplay(target); return; }
                if (now - last > TICK_MS) {
                    last = now;
                    const chars = [...target];
                    digitIdx.forEach((pos, idx) => {
                        if (p < (idx + 1) / digitIdx.length) chars[pos] = String(Math.floor(Math.random() * 10));
                    });
                    setDisplay(chars.join(''));
                }
                raf = requestAnimationFrame(animate);
            };
            raf = requestAnimationFrame(animate);
        }

        return () => { active = false; cancelAnimationFrame(raf); };
    }, [pending, finalStr, duration]);

    return <span className={className} style={style}>{display}</span>;
}
