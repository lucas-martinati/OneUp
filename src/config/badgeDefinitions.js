import {
  Target, Flame, Zap, Calendar, TrendingUp, Trophy, Medal, Gem, Rocket,
  Star, Award, Crown, Activity, Sun, Moon, Users, Ghost
} from 'lucide-react';

// Single source of truth for all 40 achievement badges.
// test(stats) → boolean determines unlock condition.
// Each badge has a stable id, an i18n key prefix, visual config, and category.

export const BADGE_DEFINITIONS = [
  // ── Streak ─────────────────────────────────────────────────────────
  { id: 'first_blood',        key: 'first_blood',        icon: Target,    color: '#3b82f6', category: 'streak',      test: s => s.totalDays >= 1 },
  { id: 'consistent',         key: 'consistent',         icon: Flame,     color: '#f97316', category: 'streak',      test: s => s.maxStreak >= 3 },
  { id: 'week_warrior',       key: 'week_warrior',       icon: Calendar,  color: '#8b5cf6', category: 'streak',      test: s => s.maxStreak >= 7 },
  { id: 'two_weeks',          key: 'two_weeks',          icon: TrendingUp,color: '#06b6d4', category: 'streak',      test: s => s.maxStreak >= 14 },
  { id: 'month_warrior',      key: 'month_warrior',      icon: Zap,       color: '#eab308', category: 'streak',      test: s => s.maxStreak >= 30 },
  { id: 'two_months',         key: 'two_months',         icon: Trophy,    color: '#dc2626', category: 'streak',      test: s => s.maxStreak >= 60 },
  { id: 'quarter_year',       key: 'quarter_year',       icon: Medal,     color: '#7c3aed', category: 'streak',      test: s => s.maxStreak >= 90 },
  { id: 'half_year',          key: 'half_year',          icon: Gem,       color: '#059669', category: 'streak',      test: s => s.maxStreak >= 180 },
  { id: 'year_beast',         key: 'year_beast',         icon: Rocket,    color: '#db2777', category: 'streak',      test: s => s.maxStreak >= 365 },

  // ── Quantity ───────────────────────────────────────────────────────
  { id: 'ten_sessions',         key: 'ten_sessions',         icon: Star,  color: '#22c55e', category: 'quantite',    test: s => s.totalDays >= 10 },
  { id: 'fifty_sessions',       key: 'fifty_sessions',       icon: Award, color: '#14b8a6', category: 'quantite',    test: s => s.totalDays >= 50 },
  { id: 'hundred_sessions',     key: 'hundred_sessions',     icon: Crown, color: '#f472b6', category: 'quantite',    test: s => s.totalDays >= 100 },
  { id: 'two_hundred_sessions', key: 'two_hundred_sessions', icon: Star,  color: '#fb923c', category: 'quantite',    test: s => s.totalDays >= 200 },
  { id: 'five_hundred_sessions',key: 'five_hundred_sessions',icon: Gem,   color: '#a855f7', category: 'quantite',    test: s => s.totalDays >= 500 },
  { id: 'all_exercises',        key: 'all_exercises',        icon: Target,color: '#8b5cf6', category: 'quantite',    test: s => s.hasCompletedAllExercisesOnce },

  // ── Volume ─────────────────────────────────────────────────────────
  { id: 'rep_500',    key: 'rep_500',    icon: Activity, color: '#ef4444', category: 'volume', test: s => s.totalRepsAll >= 500 },
  { id: 'rep_1000',   key: 'rep_1000',   icon: Zap,      color: '#facc15', category: 'volume', test: s => s.totalRepsAll >= 1000 },
  { id: 'rep_5000',   key: 'rep_5000',   icon: Flame,    color: '#f97316', category: 'volume', test: s => s.totalRepsAll >= 5000 },
  { id: 'rep_10000',  key: 'rep_10000',  icon: Trophy,   color: '#eab308', category: 'volume', test: s => s.totalRepsAll >= 10000 },
  { id: 'rep_50000',  key: 'rep_50000',  icon: Rocket,   color: '#ec4899', category: 'volume', test: s => s.totalRepsAll >= 50000 },

  // ── Perfection ─────────────────────────────────────────────────────
  { id: 'perfect_one',         key: 'perfect_one',         icon: Star,  color: '#22d3d1', category: 'perfection', test: s => s.perfectDays >= 1 },
  { id: 'perfect_five',        key: 'perfect_five',        icon: Medal, color: '#a78bfa', category: 'perfection', test: s => s.perfectDays >= 5 },
  { id: 'perfect_fifty',       key: 'perfect_fifty',       icon: Crown, color: '#fbbf24', category: 'perfection', test: s => s.perfectDays >= 50 },
  { id: 'perfect_hundred',     key: 'perfect_hundred',     icon: Gem,   color: '#c084fc', category: 'perfection', test: s => s.perfectDays >= 100 },
  { id: 'perfect_two_hundred', key: 'perfect_two_hundred', icon: Gem,   color: '#c084fc', category: 'perfection', test: s => s.perfectDays >= 200 },

  // ── Schedule ───────────────────────────────────────────────────────
  { id: 'weekday_warrior', key: 'weekday_warrior', icon: Sun,    color: '#f59e0b', category: 'quantite', test: s => s.weekdayWorkouts >= 25 },
  { id: 'weekend_warrior', key: 'weekend_warrior', icon: Moon,   color: '#6366f1', category: 'quantite', test: s => s.weekendWorkouts >= 25 },
  { id: 'balanced',        key: 'balanced',        icon: Users,  color: '#14b8a6', category: 'quantite', test: s => s.weekdayWorkouts >= 10 && s.weekendWorkouts >= 10 },
  { id: 'morning_5',       key: 'morning_5',       icon: Sun,    color: '#fb923c', category: 'horaires',  test: s => s.morningWorkouts >= 5 },
  { id: 'morning_10',      key: 'morning_10',      icon: Sun,    color: '#f59e0b', category: 'horaires',  test: s => s.morningWorkouts >= 10 },
  { id: 'morning_25',      key: 'morning_25',      icon: Sun,    color: '#d97706', category: 'horaires',  test: s => s.morningWorkouts >= 25 },
  { id: 'afternoon_5',     key: 'afternoon_5',     icon: Zap,    color: '#22c55e', category: 'horaires',  test: s => s.afternoonWorkouts >= 5 },
  { id: 'afternoon_10',    key: 'afternoon_10',    icon: Zap,    color: '#16a34a', category: 'horaires',  test: s => s.afternoonWorkouts >= 10 },
  { id: 'afternoon_25',    key: 'afternoon_25',    icon: Zap,    color: '#15803d', category: 'horaires',  test: s => s.afternoonWorkouts >= 25 },
  { id: 'evening_5',       key: 'evening_5',       icon: Moon,   color: '#6366f1', category: 'horaires',  test: s => s.eveningWorkouts >= 5 },
  { id: 'evening_10',      key: 'evening_10',      icon: Moon,   color: '#4f46e5', category: 'horaires',  test: s => s.eveningWorkouts >= 10 },
  { id: 'evening_25',      key: 'evening_25',      icon: Moon,   color: '#4338ca', category: 'horaires',  test: s => s.eveningWorkouts >= 25 },

  // ── Secrets ────────────────────────────────────────────────────────
  { id: 'ghost',         key: 'ghost',         icon: Ghost,  color: '#6b7280', category: 'secrets', secret: true, test: s => s.ghostWorkout },
  { id: 'perfectionist', key: 'perfectionist', icon: Star,   color: '#6b7280', category: 'secrets', secret: true, test: s => s.perfectStreak >= 30 },
  { id: 'beast',         key: 'beast',         icon: Rocket, color: '#6b7280', category: 'secrets', secret: true, test: s => s.totalRepsAll >= 100000 },
];
