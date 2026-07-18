import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Snowflake, Crown, X } from '@utils/icons';
import { Button, IconButton } from '@components/ui';
import { GoogleSignInButton } from '@components/ui/GoogleSignInButton';
import { useUIStore } from '@store/useUIStore';
import { useProgressStore } from '@store/useProgressStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useAuth } from '@contexts/AuthContext';
import { STREAK_FREEZE_LIMITS, getFreezeLimits } from '@shared/streakFreeze';

const FREEZE_COLOR = '#38bdf8';

/** A single stat column (value over label) in the allotment row. */
function FreezeStat({ value, label }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: FREEZE_COLOR }}>{value}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
        </div>
    );
}

/**
 * Info popover for the Streak Freeze inventory. Explains how freezes are earned
 * (monthly refill, capped reserve) and — for non-Pro users — surfaces the Pro
 * upsell since Pro earns 3× more per month.
 */
export function StreakFreezeInfo({ open, onClose }) {
    const { t } = useTranslation();
    const { isPro } = useSubscription();
    const auth = useAuth();
    const openStore = useUIStore(s => s.openStore);
    const freezeCount = useProgressStore(s => s.streakFreezes?.count || 0);
    const overlayRef = useRef(null);

    const limits = getFreezeLimits(isPro);
    const proMultiplier = Math.round(STREAK_FREEZE_LIMITS.pro.perMonth / STREAK_FREEZE_LIMITS.free.perMonth);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const handleUpgrade = () => {
        onClose();
        openStore();
    };

    return createPortal(
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            className="dialog-backdrop"
        >
            <div style={{
                position: 'relative', width: '100%', maxWidth: '340px', borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(20, 35, 50, 0.96), rgba(15, 25, 40, 0.98))',
                border: `1px solid ${FREEZE_COLOR}33`,
                boxShadow: `0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px ${FREEZE_COLOR}14`,
                padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                animation: 'dialogPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                <IconButton icon={X} variant="glass" onClick={onClose} aria-label={t('common.close')}
                    style={{ position: 'absolute', top: '12px', right: '12px' }} />

                <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(circle at 32% 26%, ${FREEZE_COLOR}, ${FREEZE_COLOR}cc)`,
                    border: `2px solid ${FREEZE_COLOR}`, boxShadow: `0 4px 16px ${FREEZE_COLOR}66`,
                }}>
                    <Snowflake size={26} color="#fff" />
                </div>

                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('streakFreeze.title')}
                </h3>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                    {auth.isSignedIn ? t('streakFreeze.intro') : t('streakFreeze.guestDesc')}
                </p>

                {/* Guests don't earn freezes — invite them to sign in instead of
                    showing the (empty) allotment. */}
                {!auth.isSignedIn && (
                    <GoogleSignInButton
                        onClick={() => auth.signIn()}
                        className="hover-lift"
                        style={{ width: 'auto', marginTop: '2px' }}
                    />
                )}

                {/* Current allotment for the user's tier (signed-in only) */}
                {auth.isSignedIn && (
                <div style={{
                    display: 'flex', width: '100%', gap: '10px', padding: '14px',
                    borderRadius: '14px', background: `${FREEZE_COLOR}12`, border: `1px solid ${FREEZE_COLOR}22`,
                }}>
                    <FreezeStat value={freezeCount} label={t('streakFreeze.statAvailable')} />
                    <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
                    <FreezeStat value={`+${limits.perMonth}`} label={t('streakFreeze.statPerMonth')} />
                    <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
                    <FreezeStat value={limits.maxStock} label={t('common.max')} />
                </div>
                )}

                {/* Pro upsell — only for signed-in non-Pro users */}
                {auth.isSignedIn && !isPro && (
                    <div style={{
                        width: '100%', display: 'flex', flexDirection: 'column', gap: '12px',
                        padding: '14px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(129,140,248,0.10))',
                        border: '1px solid rgba(139,92,246,0.3)',
                    }}>
                        <div className="row gap-8">
                            <Crown size={18} color="#a78bfa" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                {t('streakFreeze.proPitch', { multiplier: proMultiplier, count: STREAK_FREEZE_LIMITS.pro.perMonth })}
                            </span>
                        </div>
                        <Button variant="primary" size="sm" fullWidth onClick={handleUpgrade}>
                            {t('streakFreeze.proCta')}
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
