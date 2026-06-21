import { useState } from 'react';
import { SegmentedControl } from '@components/ui/SegmentedControl';

export function StoreCard({
    isActive,
    title,
    icon: IconComponent,
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
    allowMultiplePurchases = false,
    // ── Yearly billing (optional) ──
    yearlyBilling
    // yearlyBilling shape:
    // {
    //   label: { monthly: 'Monthly', yearly: 'Yearly' },
    //   price: { monthly: '1,99€/mo', yearly: '19,99€/yr' },
    //   savings: '-17%',
    //   buyButtonText: 'Go Pro — 19,99€/year',
    //   onPurchaseYearly: async () => {},
    // }
}) {
    const [billingPeriod, setBillingPeriod] = useState('monthly');

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
        if (yearlyBilling && billingPeriod === 'yearly') {
            await yearlyBilling.onPurchaseYearly?.();
        } else {
            await onPurchase?.();
        }
    };

    const currentBuyText = yearlyBilling && billingPeriod === 'yearly'
        ? yearlyBilling.buyButtonText
        : buyButtonText;

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
                        <IconComponent size={24} color="white" fill={allowMultiplePurchases ? "white" : "none"} />
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
                            <IconComponent size={32} color={colorMain} style={{ marginBottom: '8px', opacity: 0.8 }} />
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

                    {/* ── Billing period toggle (monthly / yearly) ── */}
                    {yearlyBilling && !isActive && (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: '8px', marginBottom: '12px'
                        }}>
                            <SegmentedControl
                                value={billingPeriod}
                                onChange={setBillingPeriod}
                                style={{ width: '100%' }}
                                options={[
                                    {
                                        id: 'monthly',
                                        label: yearlyBilling.label.monthly,
                                        activeBg: `linear-gradient(135deg, ${colorGradientStart}, ${colorGradientEnd})`,
                                    },
                                    {
                                        id: 'yearly',
                                        label: yearlyBilling.label.yearly,
                                        activeBg: `linear-gradient(135deg, ${colorGradientStart}, ${colorGradientEnd})`,
                                    },
                                ]}
                            />

                            {/* Price display with savings badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', minHeight: '28px'
                            }}>
                                <span style={{
                                    fontSize: '1.1rem', fontWeight: '800',
                                    color: billingPeriod === 'yearly' ? '#10b981' : colorMain,
                                    transition: 'color 0.3s ease'
                                }}>
                                    {billingPeriod === 'yearly'
                                        ? yearlyBilling.price.yearly
                                        : yearlyBilling.price.monthly}
                                </span>
                                {billingPeriod === 'yearly' && yearlyBilling.savings && (
                                    <span className="scale-in" style={{
                                        padding: '2px 8px', borderRadius: '20px',
                                        fontSize: '0.7rem', fontWeight: '800',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}>
                                        {yearlyBilling.savings}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePurchase}
                        className="hover-lift"
                        style={{
                            width: '100%', padding: '16px',
                            borderRadius: 'var(--radius-lg)',
                            background: billingPeriod === 'yearly' && yearlyBilling
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : `linear-gradient(135deg, ${colorGradientStart}, ${colorGradientEnd})`,
                            border: 'none', color: 'white',
                            fontWeight: '800', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', cursor: 'pointer',
                            boxShadow: billingPeriod === 'yearly' && yearlyBilling
                                ? '0 4px 16px rgba(16, 185, 129, 0.3)'
                                : `0 4px 16px rgba(${colorRGB},0.3)`,
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <IconComponent size={20} fill={allowMultiplePurchases ? "white" : "none"} />
                        {currentBuyText}
                    </button>
                </div>
            )}
        </div>
    );
}
