import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Award, Lock, X } from '@utils/icons';
import { useBackHandler } from '@hooks/useBackHandler';
import { IconButton } from '@components/ui';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { Z_INDEX } from '@utils/zIndex';
import { buildBadges } from './buildBadges';

const CATEGORY_COLORS = {
    streak: '#f97316',
    quantite: '#22c55e',
    volume: '#ef4444',
    perfection: '#22d3d1',
    horaires: '#fb923c',
    secrets: '#6b7280',
    social: '#3b82f6',
};

const CATEGORY_TITLES = {
    streak: 'achievements.categories.streak',
    quantite: 'achievements.categories.quantity',
    volume: 'achievements.categories.volume',
    perfection: 'achievements.categories.perfection',
    horaires: 'achievements.categories.horaires',
    secrets: 'achievements.categories.secrets',
    social: 'achievements.categories.social',
};

const fmt = (n) => n.toLocaleString();

const BadgeItem = React.memo(({ badge, highlighted }) => {
    const { t } = useTranslation();
    const Icon = badge.icon;
    const { unlocked, secret, color } = badge;

    let title = '???';
    if (badge.titleKey) {
        title = t(badge.titleKey);
    } else if (secret) {
        title = t('achievements.badges.secret');
    }

    let desc = '';
    if (badge.descKey) {
        let period = null;
        if (badge.id.startsWith('morning_')) period = t('period.morning');
        else if (badge.id.startsWith('afternoon_')) period = t('period.afternoon');
        else if (badge.id.startsWith('evening_')) period = t('period.evening');
        else if (badge.id.endsWith('_sessions')) period = t('period.total');
        
        const formattedGoal = typeof badge.goal === 'number' ? badge.goal.toLocaleString() : badge.goal;
        desc = t(badge.descKey, { count: formattedGoal, period });
    } else if (secret) {
        desc = '???';
    }

    const showProgress = !unlocked && !secret && badge.goal != null && badge.progress != null;

    let borderStyle = '1px solid var(--border-subtle)';
    if (highlighted) {
        borderStyle = `2px solid ${color}`;
    } else if (unlocked) {
        borderStyle = `1px solid ${color}55`;
    }

    return (
        <div
            data-badge-id={badge.id}
            className={unlocked ? 'hover-lift' : ''}
            style={{
                position: 'relative', overflow: 'hidden',
                padding: '16px 12px 14px',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center',
                background: unlocked ? `linear-gradient(160deg, ${color}26, ${color}0a)` : 'var(--surface-muted)',
                border: borderStyle,
                boxShadow: highlighted ? `0 0 0 4px ${color}33, 0 8px 28px ${color}55` : 'none',
                animation: highlighted ? 'badgeHighlightPulse 1.5s ease-out 2' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                minHeight: '156px'
            }}>

            {/* Corner glow + check medal for unlocked */}
            {unlocked && (
                <>
                    <div aria-hidden="true" style={{
                        position: 'absolute', top: '-30px', right: '-30px',
                        width: '92px', height: '92px', borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`, pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: color, color: '#fff', fontSize: '0.7rem', fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${color}66`, zIndex: 2
                    }}>✓</div>
                </>
            )}

            {/* Icon chip */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: '52px', height: '52px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: unlocked ? `${color}22` : 'var(--surface-hover)',
                border: unlocked ? `1px solid ${color}44` : '1px solid var(--border-subtle)',
                boxShadow: unlocked ? `0 4px 16px ${color}33` : 'none'
            }}>
                {(!unlocked && secret)
                    ? <Lock size={22} color="var(--text-secondary)" />
                    : <Icon size={24} color={unlocked ? color : 'var(--text-secondary)'} />}
                {(!unlocked && !secret) && (
                    <div style={{
                        position: 'absolute', bottom: '-5px', right: '-5px',
                        width: '19px', height: '19px', borderRadius: '50%',
                        background: 'var(--sheet-bg)', border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lock size={10} color="var(--text-secondary)" />
                    </div>
                )}
            </div>

            {/* Title */}
            <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '0.82rem', fontWeight: '800', lineHeight: 1.2,
                color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
                {title}
            </div>

            {/* Description */}
            <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '0.64rem', lineHeight: 1.3, color: 'var(--text-secondary)',
                opacity: unlocked ? 0.9 : 0.6, flex: 1,
                display: 'flex', alignItems: 'center'
            }}>
                {desc}
            </div>

            {/* Progress toward unlock (locked numeric badges) */}
            {showProgress && (
                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'var(--progress-track-thin)', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.round(badge.progress * 100)}%`, height: '100%', borderRadius: '3px',
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '5px', fontWeight: '700' }}>
                        {fmt(badge.current)} / {fmt(badge.goal)}
                    </div>
                </div>
            )}
        </div>
    );
});

/** Small colored pill that filters the grid to one badge category. */
const CategoryChip = React.memo(({ label, color, count, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
            background: active ? `${color}26` : 'var(--surface-muted)',
            border: active ? `1px solid ${color}` : '1px solid var(--border-subtle)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
    >
        <span aria-hidden="true" style={{
            width: '8px', height: '8px', borderRadius: '50%', background: color,
            opacity: active ? 1 : 0.55,
        }} />
        <span style={{
            fontSize: '0.7rem', fontWeight: '800',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}>
            {label}
        </span>
        {count && (
            <span style={{ fontSize: '0.62rem', fontWeight: '700', color: active ? color : 'var(--text-secondary)', opacity: 0.9 }}>
                {count}
            </span>
        )}
    </button>
));

/**
 * Full-screen achievements page (replaces the old draggable bottom sheet):
 * a compact gold hero with the progress ring, an unlocked/locked filter, a
 * category chip rail to jump straight to one badge family, and the badge
 * grid grouped by category. Opens above Stats; back button or ✕ closes it.
 */
export function Achievements({ /* completions, exercises, settings, getDayNumber, */ onClose, computedStats, highlightedBadgeId }) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'
    const [catFilter, setCatFilter] = useState(null); // null = all categories
    const contentRef = useRef(null);

    // Deep-link: when opened from a specific badge, scroll it into view once
    // the entrance animation has settled. The badge gets a highlight ring + pulse.
    useEffect(() => {
        if (!highlightedBadgeId) return;
        const timer = setTimeout(() => {
            const el = contentRef.current?.querySelector(`[data-badge-id="${highlightedBadgeId}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return () => clearTimeout(timer);
    }, [highlightedBadgeId]);

    useBackHandler(() => {
        onClose();
        return true;
    }, true);

    // Extract stats. Badge unlock/progress reads from `badgeStats` — the shared
    // snapshot (@shared/achievementStats.js) also used by the Cloud Function — so
    // this grid and its unlocked count match the number published to the
    // leaderboard/admin exactly. `achievements` still carries the manual overrides.
    const { badgeStats, achievements } = computedStats;

    // Memoize the badge list from the single source of truth
    const statsSnapshot = useMemo(
        () => ({ ...(badgeStats || {}), achievements }),
        [badgeStats, achievements]
    );

    const badges = useMemo(() => buildBadges(statsSnapshot), [statsSnapshot]);

    const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

    const categories = useMemo(() => {
        const catIds = [...new Set(badges.map(b => b.category))];
        return catIds.map(id => ({
            id,
            titleKey: CATEGORY_TITLES[id] || `achievements.categories.${id}`,
            color: CATEGORY_COLORS[id] || '#888',
        }));
    }, [badges]);

    // Categories with nothing to show under the current status filter (e.g. a
    // fully unlocked family while viewing "locked") drop out of the rail and
    // the grid entirely; a chip selection that disappears falls back to "all".
    const matchesFilter = (b) =>
        filter === 'all' || (filter === 'unlocked' ? b.unlocked : !b.unlocked);
    const visibleCategories = categories.filter(cat =>
        badges.some(b => b.category === cat.id && matchesFilter(b))
    );
    const effectiveCatFilter = visibleCategories.some(c => c.id === catFilter) ? catFilter : null;

    const total = badges.length || 1;
    const pct = unlockedCount / total;
    const R = 40;
    const C = 2 * Math.PI * R;

    return createPortal(
        <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.ACHIEVEMENTS }}>
            <div ref={contentRef} className="modal-content">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    <h2 className="panel-title" style={{ margin: 0 }}>
                        {t('common.achievements')}
                    </h2>
                    <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" />
                </div>

                {/* ── Hero: progress ring + counters in one gold card ────── */}
                <div className="glass-premium slide-up" style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-md)',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.04))',
                    border: '1px solid rgba(251,191,36,0.22)',
                }}>
                    <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="48" cy="48" r={R} fill="none" stroke="var(--progress-track)" strokeWidth="7" />
                            <circle
                                cx="48" cy="48" r={R} fill="none"
                                stroke="url(#achHeroGrad)" strokeWidth="7" strokeLinecap="round"
                                strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s' }}
                            />
                            <defs>
                                <linearGradient id="achHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Award size={30} color="#fbbf24" />
                        </div>
                    </div>
                    <div className="flex-1-min0">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                                {unlockedCount}
                            </span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                / {badges.length}
                            </span>
                        </div>
                        <div style={{
                            marginTop: '6px', fontSize: '0.72rem', textTransform: 'uppercase',
                            letterSpacing: '1.2px', fontWeight: '800', color: '#fbbf24'
                        }}>
                            {t('achievements.badgesUnlocked')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {Math.round(pct * 100)}%
                        </div>
                    </div>
                </div>

                {/* ── Status filter ───────────────────────────────────────── */}
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <SegmentedControl
                        options={[
                            { id: 'all', label: t('achievements.filterAll') },
                            { id: 'unlocked', label: t('achievements.filterUnlocked') },
                            { id: 'locked', label: t('achievements.filterLocked') },
                        ]}
                        value={filter}
                        onChange={setFilter}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* ── Category rail ───────────────────────────────────────── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '6px',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <CategoryChip
                        label={t('achievements.filterAll')}
                        color="#fbbf24"
                        active={effectiveCatFilter === null}
                        onClick={() => setCatFilter(null)}
                    />
                    {visibleCategories.map(cat => {
                        const catBadges = badges.filter(b => b.category === cat.id);
                        const catUnlocked = catBadges.filter(b => b.unlocked).length;
                        return (
                            <CategoryChip
                                key={cat.id}
                                label={t(cat.titleKey)}
                                color={cat.color}
                                count={`${catUnlocked}/${catBadges.length}`}
                                active={effectiveCatFilter === cat.id}
                                onClick={() => setCatFilter(prev => prev === cat.id ? null : cat.id)}
                            />
                        );
                    })}
                </div>

                {/* ── Categories listing ──────────────────────────────────── */}
                {visibleCategories.map(cat => {
                    if (effectiveCatFilter && effectiveCatFilter !== cat.id) return null;
                    const catBadges = badges.filter(b => b.category === cat.id);
                    const shown = catBadges.filter(matchesFilter);
                    if (shown.length === 0) return null;
                    const catUnlocked = catBadges.filter(b => b.unlocked).length;

                    return (
                        <div key={cat.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                marginBottom: 'var(--spacing-sm)', paddingLeft: '4px'
                            }}>
                                <div style={{
                                    fontSize: '0.82rem', fontWeight: '800',
                                    color: cat.color, textTransform: 'uppercase', letterSpacing: '1px'
                                }}>
                                    {t(cat.titleKey)}
                                </div>
                                <div style={{
                                    fontSize: '0.62rem', fontWeight: '700', color: 'var(--text-secondary)',
                                    background: `${cat.color}1a`, border: `1px solid ${cat.color}33`,
                                    padding: '2px 8px', borderRadius: '20px'
                                }}>
                                    {catUnlocked}/{catBadges.length}
                                </div>
                                <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${cat.color}40, transparent)` }} />
                            </div>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
                            }}>
                                {shown.map((badge) => (
                                    <BadgeItem key={badge.id} badge={badge} highlighted={badge.id === highlightedBadgeId} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>,
        document.body
    );
}
