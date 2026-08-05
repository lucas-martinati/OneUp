import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Dumbbell, Filter, ChevronUp } from '@utils/icons';
import { SegmentedControl } from '@components/ui/SegmentedControl';

export function LeaderboardTabs({ domain, setDomain, activeTab, setActiveTab, VISIBLE_TABS, showDomainFilter = true, showExerciseTabs = true }) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    const currentActiveId = VISIBLE_TABS.find(t => t.id === activeTab) ? activeTab : VISIBLE_TABS[0].id;
    const globalTabs = VISIBLE_TABS.filter(tab => tab.isGlobal);
    const exerciseTabs = VISIBLE_TABS.filter(tab => !tab.isGlobal);

    const chipStyle = (isActive, color, special = false, dashed = false) => ({
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: special ? '7px 15px' : '7px 12px',
        borderRadius: 'var(--radius-full)',
        background: isActive ? `linear-gradient(135deg, ${color}2e, ${color}14)` : 'var(--surface-subtle)',
        border: `1.5px ${dashed ? 'dashed' : 'solid'} ${isActive ? color + '66' : 'var(--border-default)'}`,
        color: isActive ? color : 'var(--text-secondary)',
        fontSize: '0.75rem', fontWeight: special ? '800' : '600',
        textTransform: special ? 'uppercase' : 'none',
        letterSpacing: special ? '0.06em' : 'normal',
        cursor: 'pointer', minHeight: 'var(--touch-min)',
        boxShadow: isActive && special ? `0 0 14px ${color}33` : 'none',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
        WebkitTapHighlightColor: 'transparent', outline: 'none'
    });

    return (
        <>
            {/* ── Domain Filter ── */}
            {showDomainFilter && (
                <div style={{ padding: '0 0 8px' }}>
                    <SegmentedControl
                        fullWidth
                        variant="pills"
                        value={domain}
                        onChange={(val) => {
                            setDomain(val);
                            setActiveTab(val);
                            setShowAll(false);
                        }}
                        options={[
                            { 
                                id: 'bodyweight', 
                                label: t('common.bodyweight'), 
                                icon: <Trophy size={16} />,
                                activeBg: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(245,158,11,0.08))',
                                activeBorder: '1px solid rgba(251,191,36,0.45)',
                                activeColor: '#fbbf24'
                            },
                            { 
                                id: 'weights', 
                                label: t('common.weights'), 
                                icon: <Dumbbell size={16} />,
                                activeBg: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.08))',
                                activeBorder: '1px solid rgba(249,115,22,0.45)',
                                activeColor: '#fb923c'
                            }
                        ]}
                    />
                </div>
            )}

            {/* ── Tabs (wrapping) ── */}
            {showExerciseTabs && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: showDomainFilter ? '0' : '4px 0 var(--space-4)' }}>
                    {globalTabs.map(tab => {
                        const isActive = tab.id === currentActiveId;
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowAll(false); }} style={chipStyle(isActive, tab.color, tab.isSpecial)}>
                                <Icon size={14} />
                                {tab.customLabel ? tab.customLabel : t(tab.labelKey)}
                            </button>
                        );
                    })}

                    {exerciseTabs.filter(tab => showAll || tab.id === currentActiveId).map(tab => {
                        const isActive = tab.id === currentActiveId;
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={chipStyle(isActive, tab.color)}>
                                <Icon size={14} />
                                {tab.customLabel ? tab.customLabel : t(tab.labelKey)}
                            </button>
                        );
                    })}

                    <button onClick={() => setShowAll(!showAll)} style={chipStyle(false, '#ffffff', false, !showAll)}>
                        {showAll ? <ChevronUp size={14} /> : <Filter size={14} />}
                        {showAll ? t('common.close') : t('share.exercises')}
                    </button>
                </div>
            )}
        </>
    );
}
