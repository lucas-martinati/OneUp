/**
 * Multi-exercise configuration for OneUp.
 *
 * multiplier: the goal for a given day is Math.ceil(dayNumber * multiplier).
 * Colors are used across the UI (counter ring, calendar dots, selector cards).
 */

export const EXERCISES = [
    {
        id: 'pushups',
        label: 'Pompes',
        icon: 'Dumbbell',          // lucide-react icon name
        color: '#818cf8',           // Indigo-400
        colorDim: 'rgba(129,140,248,0.15)',
        gradient: ['#667eea', '#818cf8'],
        confettiColors: ['#667eea', '#818cf8', '#a5b4fc', '#c7d2fe', '#ffffff'],
        multiplier: 1,
    },
    {
        id: 'squats',
        label: 'Squats',
        icon: 'ArrowDownUp',
        color: '#34d399',           // Emerald-400
        colorDim: 'rgba(52,211,153,0.15)',
        gradient: ['#10b981', '#34d399'],
        confettiColors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
        multiplier: 2,
    },
    {
        id: 'pullups',
        label: 'Tractions',
        icon: 'ArrowUp',
        color: '#fbbf24',           // Amber-400
        colorDim: 'rgba(251,191,36,0.15)',
        gradient: ['#f59e0b', '#fbbf24'],
        confettiColors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#ffffff'],
        multiplier: 0.5,            // Math.ceil applied in Dashboard
    },
    {
        id: 'abs',
        label: 'Abdos',
        icon: 'Zap',
        color: '#f472b6',           // Pink-400
        colorDim: 'rgba(244,114,182,0.15)',
        gradient: ['#ec4899', '#f472b6'],
        confettiColors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#ffffff'],
        multiplier: 1.5,
    },
];

/** Quick lookup by exercise id */
export const EXERCISES_MAP = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
