import { WEIGHT_EXERCISES } from './weights';

/**
 * Multi-exercise configuration for OneUp.
 *
 * multiplier: the goal for a given day is Math.ceil(dayNumber * multiplier).
 * Colors are used across the UI (counter ring, calendar dots, selector cards).
 *
 * ┌──────────────┬────────────┬──────────────────────────────────┐
 * │ Exercise     │ Multiplier │ Examples (day → goal)            │
 * ├──────────────┼────────────┼──────────────────────────────────┤
 * │ Pompes       │ 1          │ day 1→1, day 50→50, day 100→100 │
 * │ Squats       │ 2          │ day 1→2, day 50→100, day 100→200│
 * │ Tractions    │ 0.5        │ day 1→1, day 50→25, day 100→50  │
 * │ Abdos        │ 1.5        │ day 1→2, day 50→75, day 100→150 │
 * │ Jumping Jack │ 2          │ day 1→2, day 50→100, day 100→200│
 * │ Fentes       │ 1          │ day 1→1, day 50→50, day 100→100 │
 * └──────────────┴────────────┴──────────────────────────────────┘
 *
 * To adjust difficulty: change the `multiplier` value below.
 * Formula: dailyGoal = Math.max(1, Math.ceil(dayNumber × multiplier))
 */

import {
  EXERCISES as SHARED_EXERCISES,
  CARDIO_EXERCISES as SHARED_CARDIO,
  getDailyGoal as sharedGetDailyGoal,
  getWeeklyGoalKm as sharedGetWeeklyGoalKm,
  CARDIO_REPS_PER_KM as SHARED_CARDIO_REPS_PER_KM,
} from '@shared/exerciseRules.js';

const CLIENT_EXERCISES = [
    {
        id: 'pushups',
        icon: 'Dumbbell',          // lucide-react icon name
        color: '#818cf8',           // Indigo-400
        colorDim: 'rgba(129,140,248,0.15)',
        gradient: ['#667eea', '#818cf8'],
        confettiColors: ['#667eea', '#818cf8', '#a5b4fc', '#c7d2fe', '#ffffff'],
    },
    {
        id: 'squats',
        icon: 'ArrowDownUp',
        color: '#34d399',           // Emerald-400
        colorDim: 'rgba(52,211,153,0.15)',
        gradient: ['#10b981', '#34d399'],
        confettiColors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
    },
    {
        id: 'pullups',
        icon: 'ArrowUp',
        color: '#fbbf24',           // Amber-400
        colorDim: 'rgba(251,191,36,0.15)',
        gradient: ['#f59e0b', '#fbbf24'],
        confettiColors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#ffffff'],
    },
    {
        id: 'abs',
        icon: 'Zap',
        color: '#f472b6',           // Pink-400
        colorDim: 'rgba(244,114,182,0.15)',
        gradient: ['#ec4899', '#f472b6'],
        confettiColors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#ffffff'],
    },
    {
        id: 'jumpingjacks',
        icon: 'ChevronsUp',
        color: '#22d3ee',           // Cyan-400
        colorDim: 'rgba(34,211,238,0.15)',
        gradient: ['#06b6d4', '#22d3ee'],
        confettiColors: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#ffffff'],
    },
    {
        id: 'lunges',
        icon: 'Footprints',
        color: '#fb923c',           // Orange-400
        colorDim: 'rgba(251,146,60,0.15)',
        gradient: ['#f97316', '#fb923c'],
        confettiColors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffffff'],
    },
    {
        id: 'burpees',
        icon: 'Flame',
        color: '#ef4444',           // Red-500
        colorDim: 'rgba(239,68,68,0.15)',
        gradient: ['#dc2626', '#ef4444'],
        confettiColors: ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#ffffff'],
    },
    {
        id: 'planche',
        icon: 'Square',
        type: 'timer',
        color: '#8b5cf6',           // Violet-500
        colorDim: 'rgba(139,92,246,0.15)',
        gradient: ['#7c3aed', '#8b5cf6'],
        confettiColors: ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#ffffff'],
    },
    {
        id: 'dips',
        icon: 'MoveDown',
        color: '#ec4899',           // Pink-500
        colorDim: 'rgba(236,72,153,0.15)',
        gradient: ['#db2777', '#ec4899'],
        confettiColors: ['#be185d', '#db2777', '#ec4899', '#f472b6', '#ffffff'],
    },
    {
        id: 'mountain',
        icon: 'MoveDiagonal',
        color: '#10b981',           // Emerald-500
        colorDim: 'rgba(16,185,129,0.15)',
        gradient: ['#059669', '#10b981'],
        confettiColors: ['#047857', '#059669', '#10b981', '#34d399', '#ffffff'],
    }
];

export const EXERCISES = CLIENT_EXERCISES.map(ex => {
  const shared = SHARED_EXERCISES.find(s => s.id === ex.id);
  return { ...ex, multiplier: shared ? shared.multiplier : 1 };
});

const CLIENT_CARDIO_EXERCISES = [
    {
        id: 'running',
        icon: 'Footprints',
        color: '#f97316', // Orange
        colorDim: 'rgba(249,115,22,0.15)',
    },
    {
        id: 'cycling',
        icon: 'Bike',
        color: '#06b6d4', // Cyan
        colorDim: 'rgba(6,182,212,0.15)',
    }
];

export const CARDIO_EXERCISES = CLIENT_CARDIO_EXERCISES.map(ex => {
  const shared = SHARED_CARDIO.find(s => s.id === ex.id);
  return { ...ex, multiplier: shared ? shared.multiplier : 1 };
});

export const getWeeklyGoalKm = sharedGetWeeklyGoalKm;
export const CARDIO_REPS_PER_KM = SHARED_CARDIO_REPS_PER_KM;

const BODYWEIGHT_SET = new Set(EXERCISES.map(e => e.id));
const WEIGHTS_SET = new Set(WEIGHT_EXERCISES.map(e => e.id));
const CARDIO_SET = new Set(CARDIO_EXERCISES.map(e => e.id));

export const isBodyweightExercise = (id) => BODYWEIGHT_SET.has(id);
export const isWeightExercise = (id) => WEIGHTS_SET.has(id);
export const isCardioExercise = (id) => CARDIO_SET.has(id);

/** Quick lookup by exercise id */
export const EXERCISES_MAP = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

export const getDailyGoal = sharedGetDailyGoal;

