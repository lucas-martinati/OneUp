import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Dumbbell, Activity } from '../../utils/icons';

export function LeaderboardTabs({ domain, setDomain, activeTab, setActiveTab, VISIBLE_TABS, showDomainFilter = true, showExerciseTabs = true }) {
    const { t } = useTranslation();

    return (
        <>
            {/* ── Domain Filter ── */}
            {showDomainFilter && (
            <div style={{
                display: 'flex', gap: '8px', padding: '12px var(--spacing-md) 16px',
                background: '#000000',
                marginBottom: '4px'
            }}>
                <button
                    onClick={() => { setDomain('bodyweight'); setActiveTab('bodyweight'); }}
                    style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                        background: domain === 'bodyweight' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                        color: domain === 'bodyweight' ? '#000000' : 'var(--text-secondary)',
                        border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                >
                    <Trophy size={16} /> {t('common.bodyweight')}
                </button>
                <button
                    onClick={() => { setDomain('weights'); setActiveTab('weights'); }}
                    style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                        background: domain === 'weights' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                        color: domain === 'weights' ? '#ffffff' : 'var(--text-secondary)',
                        border: domain === 'weights' ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
                        fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                >
                    <Dumbbell size={16} /> {t('common.weights')}
                </button>
            </div>
            )}

            {/* ── Tabs (wrapping) ───────────────────────────────── */}
            {showExerciseTabs && (
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '6px',
                padding: showDomainFilter ? 'var(--spacing-md)' : '0 0 var(--spacing-sm) 0'
            }}>
                {VISIBLE_TABS.map(tab => {
                    const isActive = tab.id === activeTab || (!VISIBLE_TABS.find(t => t.id === activeTab) && tab.id === VISIBLE_TABS[0].id);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: tab.isSpecial ? '7px 16px' : '7px 12px',
                                borderRadius: '20px',
                                background: isActive
                                    ? `linear-gradient(135deg, ${tab.color}30, ${tab.color}18)`
                                    : tab.isSpecial ? `linear-gradient(135deg, ${tab.color}15, transparent)` : 'rgba(255,255,255,0.05)',
                                border: isActive
                                    ? `1.5px solid ${tab.color}60`
                                    : tab.isSpecial ? `1.5px solid ${tab.color}30` : '1.5px solid rgba(255,255,255,0.08)',
                                color: isActive ? tab.color : 'var(--text-secondary)',
                                fontSize: '0.75rem', fontWeight: tab.isSpecial ? '800' : '600',
                                textTransform: tab.isSpecial ? 'uppercase' : 'none',
                                letterSpacing: tab.isSpecial ? '1px' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: 'var(--touch-min)',
                                boxShadow: isActive && tab.isSpecial ? `0 0 12px ${tab.color}40` : 'none'
                            }}
                        >
                            <Icon size={14} />
                            {tab.customLabel ? tab.customLabel : t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>
            )}
        </>
    );
}
