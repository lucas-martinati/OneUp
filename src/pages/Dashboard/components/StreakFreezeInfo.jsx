import { useTranslation } from 'react-i18next';
import { Snowflake, Crown } from '@utils/icons';
import { Button } from '@components/ui';
import { ModalShell } from '@components/ui/ModalShell';
import { GoogleSignInButton } from '@components/ui/GoogleSignInButton';
import { useUIStore } from '@store/useUIStore';
import { useProgressStore } from '@store/useProgressStore';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useAuth } from '@contexts/AuthContext';
import { STREAK_FREEZE_LIMITS, getFreezeLimits } from '@shared/streakFreeze';

const FREEZE_COLOR = '#38bdf8';

/** Keeps the snowflake in the freeze blue regardless of the active theme accent. */
function FreezeIcon({ size = 22 }) {
    return <Snowflake size={size} color={FREEZE_COLOR} />;
}

/** A single stat column (value over label) in the allotment row. */
function FreezeStat({ value, label }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: FREEZE_COLOR }}>{value}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
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

    const limits = getFreezeLimits(isPro);
    const proMultiplier = Math.round(STREAK_FREEZE_LIMITS.pro.perMonth / STREAK_FREEZE_LIMITS.free.perMonth);
    const reservePct = limits.maxStock > 0 ? Math.min(100, Math.round((freezeCount / limits.maxStock) * 100)) : 0;

    if (!open) return null;

    const handleUpgrade = () => {
        onClose();
        openStore();
    };

    let footerNode = undefined;
    if (!auth.isSignedIn) {
        footerNode = (
            <GoogleSignInButton
                onClick={() => auth.signIn()}
                className="hover-lift"
                style={{ width: '100%' }}
            />
        );
    } else if (!isPro) {
        footerNode = (
            <>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    {t('streakFreeze.gotIt')}
                </Button>
                <Button size="sm" onClick={handleUpgrade}>
                    {t('streakFreeze.proCta')}
                </Button>
            </>
        );
    } else {
        footerNode = (
            <Button size="sm" fullWidth onClick={onClose}>
                {t('streakFreeze.gotIt')}
            </Button>
        );
    }

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            size="md"
            accent={FREEZE_COLOR}
            icon={FreezeIcon}
            title={t('streakFreeze.title')}
            subtitle={t('streakFreeze.subtitle')}
            footer={footerNode}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <p style={{
                    margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)',
                    textAlign: 'center', lineHeight: 1.5,
                }}>
                    {auth.isSignedIn ? t('streakFreeze.intro') : t('streakFreeze.guestDesc')}
                </p>

                {/* Current allotment for the user's tier (signed-in only) */}
                {auth.isSignedIn && (
                    <div style={{
                        width: '100%', display: 'flex', flexDirection: 'column', gap: '10px',
                        padding: '14px', borderRadius: '14px',
                        background: 'linear-gradient(160deg, rgba(56,189,248,0.10), rgba(14,165,233,0.05))',
                        border: '1px solid rgba(56,189,248,0.22)',
                    }}>
                        <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                            <FreezeStat value={freezeCount} label={t('streakFreeze.statAvailable')} />
                            <div style={{ width: '1px', background: 'var(--border-default)' }} />
                            <FreezeStat value={`+${limits.perMonth}`} label={t('streakFreeze.statPerMonth')} />
                            <div style={{ width: '1px', background: 'var(--border-default)' }} />
                            <FreezeStat value={limits.maxStock} label={t('common.max')} />
                        </div>

                        {/* Reserve fill against the tier cap */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-secondary)',
                            }}>
                                <span>{t('streakFreeze.statReserve')}</span>
                                <span style={{ color: FREEZE_COLOR }}>{freezeCount}/{limits.maxStock}</span>
                            </div>
                            <div style={{
                                width: '100%', height: '6px', borderRadius: '999px',
                                background: 'rgba(56,189,248,0.12)', overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${reservePct}%`, height: '100%', borderRadius: '999px',
                                    background: `linear-gradient(90deg, ${FREEZE_COLOR}88, ${FREEZE_COLOR})`,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Pro upsell — only for signed-in non-Pro users */}
                {auth.isSignedIn && !isPro && (
                    <div style={{
                        width: '100%', display: 'flex', flexDirection: 'column', gap: '12px',
                        padding: '14px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(14,165,233,0.10))',
                        border: '1px solid rgba(56,189,248,0.3)',
                    }}>
                        <div className="flex-align-center gap-8">
                            <Crown size={18} color="#38bdf8" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                {t('streakFreeze.proPitch', { multiplier: proMultiplier, count: STREAK_FREEZE_LIMITS.pro.perMonth })}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </ModalShell>
    );
}