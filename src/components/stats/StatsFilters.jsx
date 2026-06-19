import { useTranslation } from 'react-i18next';
import { Filter, Lock } from '@utils/icons';
import { canAccessFeature, FEATURES } from '@utils/entitlements';
import { CATEGORIES, isUserCategory } from '@config/categories';

/** Category filter toggle + checkbox chips of the Stats panel. */
export function StatsFilters({
    showFilters, setShowFilters,
    activeCategories, setActiveCategories,
    fullCategoryOrder, fullCategoryColors, customCategories,
    hasProAccess, onOpenStore
}) {
    const { t } = useTranslation();

    const handleToggleCategory = (catId, checked) => {
        setActiveCategories(prev => {
            if (checked) return [...prev, catId];
            if (prev.length === 1) return prev;
            return prev.filter(id => id !== catId);
        });
    };

    return (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="hover-lift"
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                    padding: '10px 16px', borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700',
                    cursor: 'pointer'
                }}
            >
                <Filter size={16} />
                {t('stats.filters')} ({activeCategories.length})
            </button>
            {showFilters && (
                <div className="fade-in" style={{
                    marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)',
                    display: 'flex', flexWrap: 'wrap', gap: '8px'
                }}>
                    {fullCategoryOrder.map(categoryId => {
                        let config;
                        if (isUserCategory(categoryId)) {
                            const catDef = customCategories.find(c => c.id === categoryId);
                            if (!catDef) return null;
                            config = { id: categoryId, label: catDef.name, locked: !canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro: hasProAccess }) };
                        } else {
                            config = {
                                [CATEGORIES.CARDIO]: { id: 'cardio', label: t('common.cardio'), locked: false },
                                [CATEGORIES.BODYWEIGHT]: { id: 'standard', label: t('common.bodyweight'), locked: false },
                                [CATEGORIES.WEIGHTS]: { id: 'weights', label: t('common.weights'), locked: !canAccessFeature(FEATURES.WEIGHTS, { isPro: hasProAccess }) },
                                [CATEGORIES.CUSTOM]: { id: 'custom', label: customCategories.find(c => c.id === 'custom')?.name || t('common.custom'), locked: !canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro: hasProAccess }) }
                            }[categoryId];
                        }
                        if (!config) return null;
                        const cat = { ...config, color: fullCategoryColors[categoryId] };
                        let labelColor = '#ffffff';
                        if (!activeCategories.includes(cat.id)) {
                            labelColor = cat.locked ? 'var(--text-disabled)' : cat.color;
                        }

                        return (
                            <label key={cat.id} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: activeCategories.includes(cat.id) ? `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` : 'rgba(255,255,255,0.05)',
                                color: labelColor,
                                border: activeCategories.includes(cat.id) ? `1px solid ${cat.color}88` : `1px solid ${cat.color}33`,
                                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                                fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: cat.locked ? 0.6 : 1
                            }}>
                                {cat.locked ? (
                                    <div onClick={(e) => { e.preventDefault(); onOpenStore(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Lock size={12} color="#fca5a5" />
                                        {cat.label}
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            style={{ display: 'none' }}
                                            checked={activeCategories.includes(cat.id)}
                                            onChange={(e) => handleToggleCategory(cat.id, e.target.checked)}
                                        />
                                        {cat.label}
                                    </>
                                )}
                            </label>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
