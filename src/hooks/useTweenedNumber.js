import { useEffect, useRef, useState } from 'react';

/** Animate changes from the displayed value; never replay on initial mount. */
export function useTweenedNumber(value, duration = 450) {
    const [display, setDisplay] = useState(value);
    const current = useRef(value);
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    useEffect(() => {
        if (current.current === value) return;
        if (reduced) {
            current.current = value;
            return;
        }
        const from = current.current;
        const start = performance.now();
        let frame;
        const animate = now => {
            const progress = Math.min(1, Math.max(0, (now - start) / duration));
            const next = from + (value - from) * (1 - Math.pow(1 - progress, 3));
            current.current = progress === 1 ? value : next;
            setDisplay(current.current);
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [value, duration, reduced]);
    return reduced ? value : display;
}
