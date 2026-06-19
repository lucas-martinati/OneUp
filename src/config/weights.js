/**
 * Weight exercise configuration for OneUp.
 *
 * Same logic as regular exercises:
 *   dailyGoal = Math.max(1, Math.ceil(dayNumber × multiplier × userMultiplier))
 *
 * Multipliers are lower than bodyweight exercises since weighted
 * movements are typically harder and done with fewer reps.
 */

import { WEIGHT_EXERCISES as SHARED_WEIGHT_EXERCISES } from '@shared/exerciseRules.js';

const CLIENT_WEIGHT_EXERCISES = [
  {
    id: "biceps_curl",
    color: "#f59e0b",
    gradient: ["#f59e0b", "#d97706"], // orange/amber
    icon: "Dumbbell",
    defaultWeight: 10,
  },
  {
    id: "hammer_curl",
    color: "#ea580c",
    gradient: ["#ea580c", "#c2410c"], // dark orange
    icon: "Dumbbell",
    defaultWeight: 10,
  },
  {
    id: "bench_press",
    color: "#3b82f6",
    gradient: ["#3b82f6", "#2563eb"], // blue
    icon: "ArrowUp",
    defaultWeight: 15,
  },
  {
    id: "overhead_press",
    color: "#10b981",
    gradient: ["#10b981", "#059669"], // emerald
    icon: "ArrowUp",
    defaultWeight: 15,
  },
  {
    id: "squat_weights",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#7c3aed"], // violet
    icon: "ArrowDownUp",
    defaultWeight: 10,
  },
  {
    id: "deadlift",
    color: "#ef4444",
    gradient: ["#ef4444", "#dc2626"], // red
    icon: "Dumbbell",
    defaultWeight: 25,
  },
  {
    id: "barbell_row",
    color: "#06b6d4",
    gradient: ["#06b6d4", "#0891b2"], // cyan
    icon: "MoveDiagonal",
    defaultWeight: 15,
  }
];

export const WEIGHT_EXERCISES = CLIENT_WEIGHT_EXERCISES.map(ex => {
  const shared = SHARED_WEIGHT_EXERCISES.find(s => s.id === ex.id);
  return { ...ex, multiplier: shared ? shared.multiplier : 0.5 };
});

export const WEIGHT_EXERCISES_MAP = WEIGHT_EXERCISES.reduce((acc, exercise) => {
  acc[exercise.id] = exercise;
  return acc;
}, {});

