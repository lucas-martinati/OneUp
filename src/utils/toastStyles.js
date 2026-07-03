export const getToastContainerStyle = (order, isVisible, exit) => ({
    order,
    ...(exit ? { position: 'absolute', left: 0, right: 0, top: 0, margin: '0 auto' } : null),
    transform: `translateY(${isVisible ? '0' : '-24px'})`,
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
    pointerEvents: isVisible && !exit ? 'auto' : 'none',
    maxWidth: 'min(360px, calc(100vw - 32px))', width: '100%',
    display: 'flex', justifyContent: 'center'
});

export const getToastCardStyle = (color, gestureStyle, extraStyle = {}) => ({
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px 16px 14px', borderRadius: '18px',
    background: `linear-gradient(135deg, ${color}26, rgba(0,0,0,0)) , var(--tooltip-bg)`,
    border: `1px solid ${color}55`,
    boxShadow: `0 10px 34px rgba(0,0,0,0.45), 0 6px 22px ${color}3a`,
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    minWidth: '290px',
    ...extraStyle,
    ...gestureStyle,
});
