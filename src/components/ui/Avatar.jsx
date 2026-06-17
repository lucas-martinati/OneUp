import { useState } from 'react';

// Modern duotone gradients — deep, harmonious pairs that stay legible under
// white text. Picked deterministically per name so a user keeps the same colour.
const GRADIENTS = [
    ['#6366f1', '#8b5cf6'], // indigo → violet
    ['#ec4899', '#f43f5e'], // pink → rose
    ['#06b6d4', '#3b82f6'], // cyan → blue
    ['#10b981', '#059669'], // emerald
    ['#f59e0b', '#f97316'], // amber → orange
    ['#8b5cf6', '#d946ef'], // violet → fuchsia
    ['#f43f5e', '#f97316'], // rose → orange
    ['#3b82f6', '#6366f1'], // blue → indigo
    ['#14b8a6', '#0ea5e9'], // teal → sky
    ['#a855f7', '#ec4899'], // purple → pink
];

function getGradientFromString(str) {
    if (!str) return GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getInitial(str) {
    if (!str) return '?';
    return str.charAt(0).toUpperCase();
}

export function Avatar({ photoURL, name, size = 32, borderColor = null }) {
    const [g0, g1] = getGradientFromString(name || '');
    const initial = getInitial(name);

    // Remember which URL failed to load so we can fall back to the initial.
    // Tracking the URL (not a boolean) auto-resets when photoURL changes, since
    // the same <Avatar> instance is reused across users.
    const [failedUrl, setFailedUrl] = useState(null);

    const showImg = photoURL && failedUrl !== photoURL;

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            // Photos sit on a neutral panel colour so transparent avatars read
            // cleanly; the colourful gradient is only used for the initial fallback.
            background: showImg ? 'var(--sheet-bg)' : `linear-gradient(145deg, ${g0}, ${g1})`,
            border: borderColor ? `1.5px solid ${borderColor}` : '1.5px solid rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Soft coloured glow + a polished rim (top highlight, bottom shade)
            // give the disc some depth instead of a flat circle.
            boxShadow: showImg
                ? 'none'
                : `0 4px 14px ${g0}55, inset 0 1.5px 1px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.22)`
        }}>
            {/* Initial fallback: glossy light source + letter, only when no photo. */}
            {!showImg && (
                <>
                    <span aria-hidden style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(120% 120% at 28% 20%, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 38%, transparent 62%)',
                        pointerEvents: 'none'
                    }} />
                    <span style={{
                        position: 'relative',
                        zIndex: 1,
                        fontSize: size * 0.42,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                        {initial}
                    </span>
                </>
            )}

            {showImg && (
                <img
                    src={photoURL}
                    alt=""
                    // Google profile photos (lh3.googleusercontent.com) return 429/403
                    // when a Referer header is sent — stripping it lets them load reliably.
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailedUrl(photoURL)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            )}
        </div>
    );
}
