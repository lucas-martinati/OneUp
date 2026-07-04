import { useTranslation } from 'react-i18next';
import { Filter, Lock, ChevronDown } from '@utils/icons';
import { canAccessFeature, FEATURES } from '@utils/entitlements';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { haptics } from '@utils/hapticsManager';
import styles from '@styles/StatsFilters.module.css';

/** Category filter toggle + checkbox chips of the Stats panel. */
export function StatsFilters({
    showFilters, setShowFilters,
    activeCategories, setActiveCategories,
    fullCategoryOrder, fullCategoryColors, customCategories,
    hasProAccess, onOpenStore
}) {
    const { t } = useTranslation();

    const handleToggleCategory = (catId, checked) => {
        haptics.light();
        setActiveCategories(prev => {
            if (checked) return [...prev, catId];
            if (prev.length === 1) return prev;
            return prev.filter(id => id !== catId);
        });
    };

    return (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <button
                onClick={() => {
                    haptics.light();
                    setShowFilters(!showFilters);
                }}
                className={showFilters ? `${styles.toggle} ${styles.toggleOpen}` : styles.toggle}
                aria-expanded={showFilters}
            >
                <Filter size={16} />
                {t('stats.filters')}
                <span key={activeCategories.length} className={styles.count}>
                    {activeCategories.length}
                </span>
                <ChevronDown size={15} className={styles.chevron} />
            </button>
            {showFilters && (
                <div className={styles.panel}>
                    {fullCategoryOrder.map((categoryId, index) => {
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
                            <label key={cat.id} className={styles.chip} style={{
                                '--i': index,
                                background: activeCategories.includes(cat.id) ? `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` : 'rgba(255,255,255,0.05)',
                                color: labelColor,
                                border: activeCategories.includes(cat.id) ? `1px solid ${cat.color}88` : `1px solid ${cat.color}33`,
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
