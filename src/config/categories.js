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
