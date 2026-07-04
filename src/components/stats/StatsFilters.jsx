import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown } from '@utils/icons';
import { canAccessFeature, FEATURES } from '@utils/entitlements';
import { CATEGORIES, isUserCategory, getCategoryLabel } from '@config/categories';
import { haptics } from '@utils/hapticsManager';
import { CategoryChips } from '@components/ui';
import styles from '@styles/StatsFilters.module.css';

/** Category filter toggle + chips panel of the Stats panel. */
export function StatsFilters({
    showFilters, setShowFilters,
    activeCategories, setActiveCategories,
    fullCategoryOrder, fullCategoryColors, customCategories,
    hasProAccess, onOpenStore
}) {
    const { t } = useTranslation();

    const handleToggleCategory = (catId) => {
        setActiveCategories(prev => {
            if (!prev.includes(catId)) return [...prev, catId];
            if (prev.length === 1) return prev;
            return prev.filter(id => id !== catId);
        });
    };

    const isLocked = (categoryId) => {
        if (isUserCategory(categoryId)) return !canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro: hasProAccess });
        if (categoryId === CATEGORIES.WEIGHTS) return !canAccessFeature(FEATURES.WEIGHTS, { isPro: hasProAccess });
        if (categoryId === CATEGORIES.CUSTOM) return !canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro: hasProAccess });
        return false;
    };

    const chipItems = fullCategoryOrder
        // Skip user categories whose definition is gone (deleted mid-session)
        .filter(categoryId => !isUserCategory(categoryId) || customCategories.some(c => c.id === categoryId))
        .map(categoryId => ({
            // The Stats filter state keeps its legacy id for bodyweight
            id: categoryId === CATEGORIES.BODYWEIGHT ? 'standard' : categoryId,
            label: getCategoryLabel(categoryId, customCategories, t),
            color: fullCategoryColors[categoryId],
            locked: isLocked(categoryId),
        }));

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
                    <CategoryChips
                        items={chipItems}
                        selected={activeCategories}
                        onToggle={handleToggleCategory}
                        onLockedClick={onOpenStore}
                    />
                </div>
            )}
        </div>
    );
}
