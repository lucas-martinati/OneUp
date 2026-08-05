import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Dumbbell, Filter, ChevronUp } from '@utils/icons';
import { FilterChip } from '@components/ui';

const domainActive = {
    bodyweight: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(245,158,11,0.08))', border: 'rgba(251,191,36,0.45)', color: '#fbbf24' },
    weights: { bg: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.08))', border: 'rgba(249,115,22,0.45)', color: '#fb923c' },
};

export function LeaderboardTabs({ domain, setDomain, activeTab, setActiveTab, VISIBLE_TABS, showDomainFilter = true, showExerciseTabs = true }) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    const currentActiveId = VISIBLE_TABS.find(t => t.id === activeTab) ? activeTab : VISIBLE_TABS[0].id;
    const globalTabs = VISIBLE_TABS.filter(tab => tab.isGlobal);
    const exerciseTabs = VISIBLE_TABS.filter(tab => !tab.isGlobal);

    const domainBtnStyle = (active, key) => ({
        flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
        background: active ? domainActive[key].bg : 'var(--surface-subtle)',
        color: active ? domainActive[key].color : 'var(--text-secondary)',
        border: `1px solid ${active ? domainActive[key].border : 'var(--border-default)'}`,
        fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease'
    });

    return (
        <>
            {/* ── Domain Filter ── */}
            {showDomainFilter && (
                <div style={{ display: 'flex', gap: '8px', padding: '0 0 8px' }}>
                    <button onClick={() => { setDomain('bodyweight'); setActiveTab('bodyweight'); setShowAll(false); }} style={domainBtnStyle(domain === 'bodyweight', 'bodyweight')}>
                        <Trophy size={16} /> {t('common.bodyweight')}
                    </button>
                    <button onClick={() => { setDomain('weights'); setActiveTab('weights'); setShowAll(false); }} style={domainBtnStyle(domain === 'weights', 'weights')}>
                        <Dumbbell size={16} /> {t('common.weights')}
                    </button>
                </div>
            )}

            {/* ── Tabs (wrapping) ── */}
            {showExerciseTabs && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: showDomainFilter ? '0' : '4px 0 var(--space-4)' }}>
                    {globalTabs.map(tab => {
                        const isActive = tab.id === currentActiveId;
                        return (
                            <FilterChip
                                key={tab.id}
                                size="sm"
                                color={tab.color}
                                selected={isActive}
                                icon={tab.icon}
                                onClick={() => { setActiveTab(tab.id); setShowAll(false); }}
                            >
                                {tab.customLabel ? tab.customLabel : t(tab.labelKey)}
                            </FilterChip>
                        );
                    })}

                    {exerciseTabs.filter(tab => showAll || tab.id === currentActiveId).map(tab => {
                        const isActive = tab.id === currentActiveId;
                        return (
                            <FilterChip
                                key={tab.id}
                                size="sm"
                                color={tab.color}
                                selected={isActive}
                                icon={tab.icon}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.customLabel ? tab.customLabel : t(tab.labelKey)}
                            </FilterChip>
                        );
                    })}

                    <FilterChip
                        size="sm"
                        selected={false}
                        icon={showAll ? ChevronUp : Filter}
                        onClick={() => setShowAll(!showAll)}
                        style={{ borderStyle: 'dashed', background: 'transparent' }}
                    >
                        {showAll ? t('common.close') : t('share.exercises')}
                    </FilterChip>
                </div>
            )}
        </>
    );
}
