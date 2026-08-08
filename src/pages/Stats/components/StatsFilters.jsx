import { useTranslation } from 'react-i18next';
import { CATEGORIES, buildCategoryChipItems } from '@config/categories';
import { CategoryChips, FilterDropdown } from '@components/ui';

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
        <FilterDropdown
            isOpen={showFilters}
            onToggle={setShowFilters}
            label={t('stats.filters')}
            count={activeCategories.length}
            style={{ marginBottom: 'var(--space-6)' }}
        >
            <CategoryChips
                items={chipItems}
                selected={activeCategories}
                onToggle={handleToggleCategory}
                onLockedClick={onOpenStore}
            />
        </FilterDropdown>
    );
}
