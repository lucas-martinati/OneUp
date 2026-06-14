import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, RotateCcw, Sparkles } from '../../utils/icons';
import { Button } from '../ui';
import { getPurchaseHistory } from '../../services/purchaseService';
import { StoreCard } from '../store/StoreCard';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

/** Boutique view inside Settings: supporter/pro store cards, restore button and purchase history. */
export function StoreView() {
    const { t } = useTranslation();
    const cloudAuth = useAuth();
    const {
        isSupporter, isPro,
        purchaseSupporter: onPurchaseSupporter,
        purchasePro: onPurchasePro,
        purchaseProYearly: onPurchaseProYearly,
        restorePurchases: onRestorePurchases
    } = useSubscription();

    const [revenueCatHistory, setRevenueCatHistory] = useState([]);
    const displayHistory = revenueCatHistory || [];

    // The view is only mounted while the store is open, so load on mount.
    useEffect(() => {
        getPurchaseHistory().then(hist => {
            setRevenueCatHistory(hist);
        });
    }, []);

    return (
        <div className="fade-in slide-up" style={{ animationDuration: '0.4s' }}>
            <StoreCard
                isActive={isSupporter}
                title={t('supporter.title')}
                icon={Heart}
                colorMain="#ef4444"
                colorRGB="239,68,68"
                colorGradientStart="#ef4444"
                colorGradientEnd="#dc2626"
                activeTitle={t('supporter.thankYou')}
                activeDesc={t('supporter.badgeActive')}
                idleDescription={t('supporter.description')}
                idleExplanation={t('supporter.explanation')}
                buyButtonText={isSupporter ? t('supporter.donateAgain') : t('supporter.buyButton')}
                onPurchase={onPurchaseSupporter}
                cloudAuth={cloudAuth}
                allowMultiplePurchases={true}
            />

            {/* ── ABONNEMENT PRO ───────────────────────────────────── */}
            <StoreCard
                isActive={isPro}
                title={t('pro.title')}
                icon={Sparkles}
                colorMain="#8b5cf6"
                colorRGB="139,92,246"
                colorGradientStart="#8b5cf6"
                colorGradientEnd="#7c3aed"
                activeTitle={t('pro.activeTitle')}
                activeDesc={t('pro.activeDesc')}
                idleDescription={t('pro.description')}
                idleExplanation={t('pro.explanation')}
                features={[t('pro.features.customExercises'), t('pro.features.weightDashboard'), t('pro.features.exclusiveLeaderboards'), t('pro.features.shareThemes')]}
                buyButtonText={`${t('pro.buyButton')} — ${t('pro.price')}`}
                onPurchase={onPurchasePro}
                cloudAuth={cloudAuth}
                yearlyBilling={{
                    label: {
                        monthly: t('pro.billingMonthly'),
                        yearly: t('pro.billingYearly'),
                    },
                    price: {
                        monthly: t('pro.price'),
                        yearly: t('pro.priceYearly'),
                    },
                    savings: t('pro.yearlySavings'),
                    buyButtonText: `${t('pro.buyButton')} — ${t('pro.priceYearly')}`,
                    onPurchaseYearly: onPurchaseProYearly,
                }}
            />

            {/* Restore purchases button (shared for all tiers) */}
            <Button
                variant="ghost"
                size="sm"
                fullWidth
                icon={RotateCcw}
                onClick={onRestorePurchases}
                style={{ border: '1px solid var(--border-default)', marginBottom: 'var(--spacing-md)' }}
            >
                {t('supporter.restore')}
            </Button>

            {/* --- Historique des achats --- */}
            {displayHistory && displayHistory.length > 0 && (
                <div className="glass-premium" style={{
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-md)',
                    background: 'var(--surface-section)'
                }}>
                    <div style={{
                        fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'
                    }}>
                        {t('supporter.history')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {displayHistory.map((receipt, index) => (
                            <div key={index} style={{
                                display: 'flex', flexDirection: 'column',
                                padding: '14px', borderRadius: 'var(--radius-md)',
                                background: 'var(--surface-muted)',
                                border: `1px solid ${receipt.isActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        {t(receipt.titleKey)}
                                    </div>
                                    <div style={{
                                        fontWeight: '800', fontSize: '0.75rem',
                                        color: receipt.isActive ? '#10b981' : 'var(--text-secondary)',
                                        background: receipt.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                                        padding: '3px 10px', borderRadius: '20px',
                                        border: `1px solid ${receipt.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                        letterSpacing: '0.5px', textTransform: 'uppercase'
                                    }}>
                                        {t(receipt.priceKey)}
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    {t(receipt.descKey)}
                                </div>

                                {/* Dates row */}
                                <div style={{
                                    display: 'flex', gap: '12px', flexWrap: 'wrap',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    paddingTop: '10px'
                                }}>
                                    {receipt.date && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                                            <span style={{
                                                color: 'rgba(255,255,255,0.35)', fontWeight: '600',
                                                textTransform: 'uppercase', letterSpacing: '0.5px'
                                            }}>
                                                {t('store.purchaseDate')}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                                                {new Date(receipt.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {receipt.expirationDate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                                            <span style={{
                                                color: 'rgba(255,255,255,0.35)', fontWeight: '600',
                                                textTransform: 'uppercase', letterSpacing: '0.5px'
                                            }}>
                                                {receipt.isActive
                                                    ? t('store.expiresOn')
                                                    : t('store.expiredOn')}
                                            </span>
                                            <span style={{
                                                color: receipt.isActive ? '#10b981' : '#ef4444',
                                                fontWeight: '700'
                                            }}>
                                                {new Date(receipt.expirationDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* ID */}
                                <div style={{
                                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)',
                                    fontFamily: 'monospace', letterSpacing: '0.5px',
                                    marginTop: '6px'
                                }}>
                                    {receipt.id || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
