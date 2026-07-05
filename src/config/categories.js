import { canAccessFeature, FEATURES } from '@utils/entitlements';

export const CATEGORIES = {
    BODYWEIGHT: 'bodyweight',
    WEIGHTS: 'weights',
    CARDIO: 'cardio',
    CUSTOM: 'custom',
};

export const CATEGORY_ORDER = [
    CATEGORIES.CARDIO,
    CATEGORIES.BODYWEIGHT,
    CATEGORIES.WEIGHTS,
    CATEGORIES.CUSTOM
];

export const CATEGORY_COLORS = {
    [CATEGORIES.BODYWEIGHT]: '#8b5cf6', // Purple
    [CATEGORIES.WEIGHTS]: '#f97316',    // Orange
    [CATEGORIES.CARDIO]: '#ef4444',     // Red
    [CATEGORIES.CUSTOM]: '#34d399',     // Emerald
};

/**
 * Build the full category order including user-created custom categories.
 * Custom categories are appended after the built-in CUSTOM category.
 * @param {Array} customCategories - Array of { id, name, color }
 * @returns {string[]} - Full ordered list of category IDs
 */
export function buildFullCategoryOrder(customCategories = []) {
    return [...CATEGORY_ORDER, ...customCategories.filter(c => c.id !== 'custom').map(c => c.id)];
}

/**
 * Build the full color map including user-created custom categories.
 * @param {Array} customCategories - Array of { id, name, color }
 * @returns {Object} - Map of categoryId → color
 */
export function buildFullCategoryColors(customCategories = []) {
    const colors = { ...CATEGORY_COLORS };
    customCategories.forEach(c => { colors[c.id] = c.color; });
    return colors;
}

/**
 * Check if a category ID is a user-created custom category.
 * @param {string} catId
 * @returns {boolean}
 */
export function isUserCategory(catId) {
    return typeof catId === 'string' && catId.startsWith('cat_');
}

/**
 * Resolve the display label of a category: user rename first (also covers the
 * renamable built-in 'custom'), then the i18n label for built-ins, then the
 * raw id as last resort (unknown/deleted user category).
 * @param {string} catId
 * @param {Array} customCategories - Array of { id, name }
 * @param {Function} t - i18n translate function
 * @returns {string}
 */
export function getCategoryLabel(catId, customCategories = [], t) {
    const catDef = customCategories.find(c => c.id === catId);
    if (catDef?.name) return catDef.name;
    if (isUserCategory(catId) || !t) return catId;
    return t(`common.${catId}`);
}

/**
 * Build the items of a <CategoryChips> from the category model: labels,
 * colors and pro-gating resolved in one place so every category filter
 * behaves the same. Skips user categories whose definition is gone.
 * @param {Object} params
 * @param {string[]} params.categoryOrder - from buildFullCategoryOrder()
 * @param {Object} params.categoryColors - from buildFullCategoryColors()
 * @param {Array} params.customCategories - user categories [{ id, name, color }]
 * @param {Function} params.t - i18n translate function
 * @param {boolean} params.isPro - pro entitlement of the current user
 * @returns {Array} [{ id, label, color, locked }]
 */
export function buildCategoryChipItems({ categoryOrder, categoryColors, customCategories = [], t, isPro = false }) {
    const isLocked = (catId) => {
        if (isUserCategory(catId)) return !canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro });
        if (catId === CATEGORIES.WEIGHTS) return !canAccessFeature(FEATURES.WEIGHTS, { isPro });
        if (catId === CATEGORIES.CUSTOM) return !canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro });
        return false;
    };
    return categoryOrder
        .filter(catId => !isUserCategory(catId) || customCategories.some(c => c.id === catId))
        .map(catId => ({
            id: catId,
            label: getCategoryLabel(catId, customCategories, t),
            color: categoryColors[catId],
            locked: isLocked(catId),
        }));
}
