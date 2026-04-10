import React from 'react';

/**
 * Day100Overlay — immersive "hacked" visual effects rendered
 * over the entire dashboard when dayNumber === 100.
 *
 * Layers (back-to-front):
 *   1. Matrix rain columns (green falling characters)
 *   2. Vignette burn (dark corners)
 *   3. Floating "hacked" warning messages
 *   4. Horizontal glitch bars
 *   5. CRT scanlines
 */

const MATRIX_CHARS = '01アイウエオカキクケコABCDEF0123456789';
const HACKED_MSGS = [
    '> ACCESS_GRANTED',
    'BREACH DETECTED ███',
    '// 100 DAYS — NO MERCY',
    'SYS_OVERRIDE: 0x64',
    '█▓▒░ HACK COMPLETE ░▒▓█',
    'FIREWALL BYPASSED',
    '> rm -rf weakness/',
    'ENCRYPTION: NONE',
    '100_DAYS.exe RUNNING...',
    'WARNING: UNSTOPPABLE',
    'PROTOCOL: BEAST_MODE',
    '> sudo unlock --power',
];

/** Seeded pseudo-random based on index — deterministic and pure. */
const seeded = (i, salt = 0) => {
    const x = Math.sin((i + 1) * 9301 + salt * 4957) * 49297;
    return x - Math.floor(x); // 0..1
};

/** Generate a deterministic matrix column string. */
const generateMatrixStr = (len, seed) => {
    let s = '';
    for (let j = 0; j < len; j++) {
        s += MATRIX_CHARS[Math.floor(seeded(j, seed) * MATRIX_CHARS.length)];
    }
    return s;
};

// Pre-generate all random data at module level (runs once, pure at render time)
const MATRIX_COLS = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i / 18) * 100 + seeded(i, 1) * 4}%`,
    text: generateMatrixStr(40 + Math.floor(seeded(i, 2) * 30), i),
    duration: `${8 + seeded(i, 3) * 12}s`,
    delay: `${seeded(i, 4) * 8}s`,
    opacity: 0.15 + seeded(i, 5) * 0.25,
    fontSize: `${10 + Math.floor(seeded(i, 6) * 4)}px`,
}));

const FLOATING_MSGS = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    text: HACKED_MSGS[i % HACKED_MSGS.length],
    top: `${12 + (i * 14) + seeded(i, 7) * 5}%`,
    left: `${5 + seeded(i, 8) * 60}%`,
    delay: `${i * 1.5 + seeded(i, 9) * 2}s`,
    animDuration: `${5 + seeded(i, 10) * 4}s`,
}));

export const Day100Overlay = React.memo(() => {
    return (
        <>
            {/* Matrix rain */}
            <div className="day100-matrix-rain" aria-hidden="true">
                {MATRIX_COLS.map(col => (
                    <div
                        key={col.id}
                        className="day100-matrix-col"
                        style={{
                            left: col.left,
                            animationDuration: col.duration,
                            animationDelay: col.delay,
                            opacity: col.opacity,
                            fontSize: col.fontSize,
                        }}
                    >
                        {col.text}
                    </div>
                ))}
            </div>

            {/* Dark vignette */}
            <div className="day100-vignette" aria-hidden="true" />

            {/* Floating hacked messages */}
            {FLOATING_MSGS.map(msg => (
                <div
                    key={msg.id}
                    className="day100-msg"
                    style={{
                        top: msg.top,
                        left: msg.left,
                        animationDelay: msg.delay,
                        animationDuration: msg.animDuration,
                    }}
                >
                    {msg.text}
                </div>
            ))}

            {/* Horizontal glitch bars */}
            <div className="day100-glitch-bar" aria-hidden="true" />
            <div className="day100-glitch-bar" aria-hidden="true" />
            <div className="day100-glitch-bar" aria-hidden="true" />

            {/* CRT scanlines */}
            <div className="day100-scanlines" aria-hidden="true" />
        </>
    );
});
