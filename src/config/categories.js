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
    [CATEGORIES.BODYWEIGHT]: '#34d399', // Emerald
    [CATEGORIES.WEIGHTS]: '#f97316',    // Orange
    [CATEGORIES.CARDIO]: '#ef4444',     // Red
    [CATEGORIES.CUSTOM]: '#8b5cf6',     // Purple
};
