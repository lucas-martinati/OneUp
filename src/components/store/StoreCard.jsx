export function StoreCard({
    isActive,
    title,
    icon: Icon,
    colorMain, // e.g. '#8b5cf6'
    colorRGB, // e.g. '139,92,246'
    colorGradientStart, // e.g. '#8b5cf6'
    colorGradientEnd, // e.g. '#7c3aed'
    activeTitle,
    activeDesc,
    idleDescription,
    idleExplanation,
    features,
    buyButtonText,
    onPurchase,
    cloudAuth,
    allowMultiplePurchases = false
}) {
    const sectionTitleStyle = {
        marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '1px',
        color: 'var(--text-secondary)'
    };

    const handlePurchase = async () => {
        if (!cloudAuth?.isSignedIn) {
            cloudAuth?.signIn?.();
            return;
        }
        await onPurchase?.();
    };

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)',
            background: isActive
                ? `linear-gradient(135deg, rgba(${colorRGB},0.08), rgba(${colorRGB},0.02))`
                : 'var(--surface-section)',
            border: isActive ? `1px solid rgba(${colorRGB},0.2)` : '1px solid var(--border-subtle)'
        }}>
            <h3 style={sectionTitleStyle}>{title}</h3>

            {isActive && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px', borderRadius: 'var(--radius-lg)',
                    background: `rgba(${colorRGB},0.1)`,
                    border: `1px solid rgba(${colorRGB},0.2)`,
                    marginBottom: allowMultiplePurchases ? '16px' : '0'
                }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colorGradientStart}, ${colorGradientEnd})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px rgba(${colorRGB},0.3)`, flexShrink: 0
                    }}>
                        <Icon size={24} color="white" fill={allowMultiplePurchases ? "white" : "none"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: colorMain }}>
                            {activeTitle}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {activeDesc}
                        </div>
                    </div>
                </div>
            )}

            {(!isActive || allowMultiplePurchases) && (
                <div>
                    {!isActive && (
                        <div style={{
                            padding: '20px', borderRadius: 'var(--radius-lg)',
                            background: `linear-gradient(135deg, rgba(${colorRGB},0.06), rgba(${colorRGB},0.02))`,
                            border: `1px solid rgba(${colorRGB},0.12)`,
                            textAlign: 'center', marginBottom: '12px'
                        }}>
                            <Icon size={32} color={colorMain} style={{ marginBottom: '8px', opacity: 0.8 }} />
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                                {idleDescription}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', ...(features && features.length > 0 ? {marginBottom: '12px'} : {}) }}>
                                {idleExplanation}
                            </div>
                            {features && features.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                                    {features.map(f => (
                                        <span key={f} style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600',
                                            background: `rgba(${colorRGB},0.12)`, color: colorMain, border: `1px solid rgba(${colorRGB},0.2)`
                                        }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handlePurchase}
                        className="hover-lift"
                        style={{
                            width: '100%', padding: '16px',
                            borderRadius: 'var(--radius-lg)',
                            background: `linear-gradient(135deg, ${colorGradientStart}, ${colorGradientEnd})`,
                            border: 'none', color: 'white',
                            fontWeight: '800', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', cursor: 'pointer',
                            boxShadow: `0 4px 16px rgba(${colorRGB},0.3)`,
                            marginBottom: '8px'
                        }}
                    >
                        <Icon size={20} fill={allowMultiplePurchases ? "white" : "none"} />
                        {buyButtonText}
                    </button>
                </div>
            )}
        </div>
    );
}
