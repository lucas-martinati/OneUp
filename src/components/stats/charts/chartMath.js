/**
 * Pure helpers for the lightweight SVG charts (no charting lib, no d3).
 * Everything is plain geometry so the components stay cheap to render and
 * never need a ResizeObserver — responsiveness comes from the SVG viewBox.
 */

/** Map a value within [min,max] to a y-coordinate (inverted: max is at top). */
export function scaleY(value, min, max, top, bottom) {
    if (max === min) return (top + bottom) / 2;
    const ratio = (value - min) / (max - min);
    return bottom - ratio * (bottom - top);
}

/** Evenly spaced x positions across the plot for `count` points. */
export function scaleX(index, count, left, right) {
    if (count <= 1) return (left + right) / 2;
    return left + (index / (count - 1)) * (right - left);
}

/** "Nice" rounded tick values for an axis (~`target` ticks). */
export function niceTicks(min, max, target = 4) {
    if (!isFinite(min) || !isFinite(max) || min === max) return [min || 0];
    const span = max - min;
    const rawStep = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let factor = 10;
    if (norm < 1.5) factor = 1;
    else if (norm < 3) factor = 2;
    else if (norm < 7) factor = 5;
    const step = factor * mag;
    const ticks = [];
    const start = Math.ceil(min / step) * step;
    for (let v = start; v <= max + step * 1e-6; v += step) {
        ticks.push(Number(v.toFixed(6)));
    }
    return ticks;
}

/**
 * Smooth SVG path through `points` ([{x,y}]) using Catmull-Rom control points
 * converted to cubic béziers. Control points are clamped to [top,bottom] so the
 * curve never overshoots the plot band (keeps area fills clean above the floor).
 */
export function smoothLinePath(points, top = -Infinity, bottom = Infinity) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    const clampY = (y) => Math.max(top, Math.min(bottom, y));
    const control = (cur, prev, next, reverse) => {
        const p = prev || cur;
        const n = next || cur;
        const smoothing = 0.16;
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const len = Math.hypot(dx, dy) * smoothing;
        const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
        return {
            x: cur.x + Math.cos(angle) * len,
            y: clampY(cur.y + Math.sin(angle) * len),
        };
    };

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const start = control(points[i - 1], points[i - 2], points[i], false);
        const end = control(points[i], points[i - 1], points[i + 1], true);
        d += ` C ${start.x} ${start.y} ${end.x} ${end.y} ${points[i].x} ${points[i].y}`;
    }
    return d;
}

/** Indices of x labels to show (always endpoints, evenly spaced, max `maxLabels`). */
export function pickLabelIndices(count, maxLabels = 5) {
    const safeMax = Math.max(2, maxLabels);
    if (count <= safeMax) return Array.from({ length: count }, (_, i) => i);
    const indices = new Set();
    for (let i = 0; i < safeMax; i++) {
        indices.add(Math.round((i / (safeMax - 1)) * (count - 1)));
    }
    return Array.from(indices).sort((a, b) => a - b);
}

/** Text-anchor for a label at `x` relative to `center` (left/right/middle). */
export function horizontalAnchor(x, center, tol = 6) {
    if (Math.abs(x - center) < tol) return 'middle';
    return x > center ? 'start' : 'end';
}

/** Cartesian point on a circle (0rad = up), used by the radar chart. */
export function polarPoint(cx, cy, radius, angle) {
    return {
        x: cx + radius * Math.sin(angle),
        y: cy - radius * Math.cos(angle),
    };
}
