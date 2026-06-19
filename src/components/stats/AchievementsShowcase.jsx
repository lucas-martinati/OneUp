import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock, ChevronRight } from '@utils/icons';
import { buildBadges } from '../feedback/buildBadges';

/** A single clickable badge medallion in the horizontal shelf. */
const Medallion = React.memo(({ badge, onSelect, t }) => {
    const Icon = badge.icon;
    const { unlocked, secret, color } = badge;
    const title = badge.titleKey ? t(badge.titleKey) : '???';

    return (
        <button
            type="button"
            onClick={() => onSelect(badge.id)}
            title={title}
            className={unlocked ? 'hover-lift' : ''}
            style={{
                flex: '0 0 auto', width: '68px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
                outline: 'none',
            }}
        >
            <div style={{
                position: 'relative',
                width: '54px', height: '54px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: unlocked
                    ? `radial-gradient(circle at 32% 28%, ${color}55, ${color}22)`
                    : 'var(--surface-muted)',
                border: unlocked ? `1.5px solid ${color}` : '1.5px solid var(--border-subtle)',
                boxShadow: unlocked ? `0 4px 16px ${color}44` : 'none',
                opacity: unlocked ? 1 : 0.7,
            }}>
                {(!unlocked && secret)
                    ? <Lock size={20} color="var(--text-secondary)" />
                    : <Icon size={24} color={unlocked ? color : 'var(--text-secondary)'} />}
                {(!unlocked && !secret) && (
                    <div style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'var(--sheet-bg)', border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lock size={10} color="var(--text-secondary)" />
                    </div>
                )}
            </div>
            <div style={{
                fontSize: '0.58rem', fontWeight: '700', lineHeight: 1.15,
                color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textAlign: 'center',
            }}>
                {title}
            </div>
        </button>
    );
});

/**
 * Compact, redesigned achievements display for the stats overview: a progress
 * header plus a horizontal shelf of badge medallions. Tapping a medallion opens
 * the full Achievements panel scrolled to — and highlighting — that badge;
 * "see all" opens the panel normally.
 *
 * @param {object}   stats        Global computed stats (must include `achievements`).
 * @param {function} onOpen       Called with an optional badgeId to open the panel.
 */
export function AchievementsShowcase({ stats, onOpen }) {
    const { t } = useTranslation();

    const badges = useMemo(() => buildBadges(stats), [stats]);
    const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);
    const total = badges.length;
    const pct = total ? unlockedCount / total : 0;

    // Shelf order: earned trophies first, then the ones closest to unlocking
    // (so the strip doubles as motivation), then the rest.
    const ordered = useMemo(() => {
        return [...badges].sort((a, b) => {
            if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
            if (!a.unlocked) return (b.progress || 0) - (a.progress || 0);
            return 0;
        });
    }, [badges]);

    return (
        <div className="glass-premium slide-up" style={{
            position: 'relative', overflow: 'hidden',
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.04))',
            border: '1px solid rgba(251,191,36,0.22)',
        }}>
            {/* Header */}
            <button
                type="button"
                onClick={() => onOpen()}
                className="hover-lift"
                style={{
                    width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                }}
            >
                <div style={{
                    width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                }}>
                    <Award size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {t('achievements.title', 'Succès')}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f59e0b' }}>
                        {unlockedCount} / {total} · {Math.round(pct * 100)}%
                    </div>
                </div>
                <ChevronRight size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </button>

            {/* Progress bar */}
            <div style={{
                height: '6px', borderRadius: '3px', marginTop: '12px',
                background: 'var(--progress-track-thin)', overflow: 'hidden',
            }}>
                <div style={{
                    width: `${Math.round(pct * 100)}%`, height: '100%', borderRadius: '3px',
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }} />
            </div>

            {/* Badge shelf */}
            <div className="no-scrollbar" style={{
                display: 'flex', gap: '6px', overflowX: 'auto',
                marginTop: '14px', paddingBottom: '2px',
                scrollSnapType: 'x proximity',
            }}>
                {ordered.map(badge => (
                    <Medallion key={badge.id} badge={badge} onSelect={onOpen} t={t} />
                ))}
            </div>
        </div>
    );
}
