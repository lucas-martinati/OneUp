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

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: photoURL ? 'transparent' : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            border: borderColor ? `1.5px solid ${borderColor}` : '1.5px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            fontWeight: '700',
            color: 'white',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            boxShadow: photoURL ? 'none' : `0 4px 12px ${gradient[0]}50`
        }}>
            {photoURL ? (
                <img
                    src={photoURL}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
                        e.target.parentElement.style.boxShadow = `0 4px 12px ${gradient[0]}50`;
                        e.target.parentElement.textContent = initial;
                    }}
                />
            ) : (
                <span style={{
                    position: 'relative',
                    zIndex: 1,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }}>
                    {initial}
                </span>
            )}
        </div>
    );
}
