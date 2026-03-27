export const WEIGHT_EXERCISES = [
  {
    id: "biceps_curl",
    color: "#f59e0b",
    gradient: ["#f59e0b", "#d97706"], // orange/amber
    icon: "Dumbbell",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  },
  {
    id: "bench_press",
    color: "#3b82f6",
    gradient: ["#3b82f6", "#2563eb"], // blue
    icon: "ArrowUp",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  },
  {
    id: "overhead_press",
    color: "#10b981",
    gradient: ["#10b981", "#059669"], // emerald
    icon: "ArrowUp",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  },
  {
    id: "squat_weights",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#7c3aed"], // violet
    icon: "ArrowDownUp",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  },
  {
    id: "deadlift",
    color: "#ef4444",
    gradient: ["#ef4444", "#dc2626"], // red
    icon: "Dumbbell",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  },
  {
    id: "barbell_row",
    color: "#06b6d4",
    gradient: ["#06b6d4", "#0891b2"], // cyan
    icon: "MoveDiagonal",
    baseReps: 10,
    incrementReps: 1,
    maxReps: 100
  }
];

export const WEIGHT_EXERCISES_MAP = WEIGHT_EXERCISES.reduce((acc, exercise) => {
  acc[exercise.id] = exercise;
  return acc;
}, {});
