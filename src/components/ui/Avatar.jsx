import { useState } from 'react';

const GRADIENTS = [
    ['#4f46e5', '#7c3aed'],
    ['#db2777', '#be185d'],
    ['#0284c7', '#0ea5e9'],
    ['#059669', '#10b981'],
    ['#d97706', '#f59e0b'],
    ['#7c3aed', '#a855f7'],
    ['#dc2626', '#ef4444'],
    ['#2563eb', '#3b82f6'],
    ['#c026d3', '#e879f9'],
    ['#0d9488', '#14b8a6'],
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
    const gradient = getGradientFromString(name || '');
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
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            border: borderColor ? `1.5px solid ${borderColor}` : '1.5px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            fontWeight: '700',
            color: 'white',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            boxShadow: showImg ? 'none' : `0 4px 12px ${gradient[0]}50`
        }}>
            {/* Gradient + initial sit underneath as the fallback / loading state */}
            <span style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }}>
                {initial}
            </span>

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
