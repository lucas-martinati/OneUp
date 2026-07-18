import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown } from '@utils/icons';
import { CATEGORIES, buildCategoryChipItems } from '@config/categories';
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

    const chipItems = buildCategoryChipItems({
        categoryOrder: fullCategoryOrder,
        categoryColors: fullCategoryColors,
        customCategories,
        t,
        isPro: hasProAccess,
    }).map(item => ({
        ...item,
        // The Stats filter state keeps its legacy id for bodyweight
        id: item.id === CATEGORIES.BODYWEIGHT ? 'standard' : item.id,
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
                <ChevronDown size={16} className={styles.chevron} />
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
