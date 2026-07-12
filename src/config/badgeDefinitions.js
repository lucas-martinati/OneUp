import {
  Target, Flame, Zap, Calendar, TrendingUp, Trophy, Medal, Gem, Rocket,
  Star, Award, Crown, Activity, Sun, Moon, Users, Ghost, Share2
} from '@utils/icons';

// Single source of truth for all 40 achievement badges.
// test(stats) → boolean determines unlock condition.
// i18n keys are derived as `achievements.badges.${def.id}.title` / `.desc`
import { BADGE_RULES } from '@shared/badgeRules.js';

export const BADGE_ICONS = {
  Target, Flame, Zap, Calendar, TrendingUp, Trophy, Medal, Gem, Rocket,
  Star, Award, Crown, Activity, Sun, Moon, Users, Ghost, Share2
};

const METADATA = [
  // ── Streak ─────────────────────────────────────────────────────────
  { id: 'first_blood',        icon: 'Target',   color: '#3b82f6', category: 'streak' },
  { id: 'consistent',         icon: 'Flame',    color: '#f97316', category: 'streak' },
  { id: 'week_warrior',       icon: 'Calendar', color: '#8b5cf6', category: 'streak' },
  { id: 'two_weeks',          icon: 'TrendingUp',color: '#06b6d4', category: 'streak' },
  { id: 'month_warrior',      icon: 'Zap',      color: '#eab308', category: 'streak' },
  { id: 'two_months',         icon: 'Trophy',   color: '#dc2626', category: 'streak' },
  { id: 'quarter_year',       icon: 'Medal',    color: '#7c3aed', category: 'streak' },
  { id: 'half_year',          icon: 'Gem',      color: '#059669', category: 'streak' },
  { id: 'year_beast',         icon: 'Rocket',   color: '#db2777', category: 'streak' },

  // ── Quantity ───────────────────────────────────────────────────────
  { id: 'ten_sessions',          icon: 'Star',  color: '#22c55e', category: 'quantite' },
  { id: 'fifty_sessions',        icon: 'Award', color: '#14b8a6', category: 'quantite' },
  { id: 'hundred_sessions',      icon: 'Crown', color: '#f472b6', category: 'quantite' },
  { id: 'two_hundred_sessions',  icon: 'Star',  color: '#fb923c', category: 'quantite' },
  { id: 'all_exercises',         icon: 'Target',color: '#8b5cf6', category: 'quantite' },

  // ── Volume ─────────────────────────────────────────────────────────
  { id: 'rep_500',   icon: 'Activity', color: '#ef4444', category: 'volume' },
  { id: 'rep_1000',  icon: 'Zap',      color: '#facc15', category: 'volume' },
  { id: 'rep_5000',  icon: 'Flame',    color: '#f97316', category: 'volume' },
  { id: 'rep_10000', icon: 'Trophy',   color: '#eab308', category: 'volume' },
  { id: 'rep_50000', icon: 'Rocket',   color: '#ec4899', category: 'volume' },

  // ── Perfection ─────────────────────────────────────────────────────
  { id: 'perfect_one',          icon: 'Star',  color: '#22d3d1', category: 'perfection' },
  { id: 'perfect_five',         icon: 'Medal', color: '#a78bfa', category: 'perfection' },
  { id: 'perfect_fifty',        icon: 'Crown', color: '#fbbf24', category: 'perfection' },
  { id: 'perfect_hundred',      icon: 'Gem',   color: '#c084fc', category: 'perfection' },

  // ── Schedule ───────────────────────────────────────────────────────
  { id: 'weekday_warrior', icon: 'Sun',    color: '#f59e0b', category: 'quantite' },
  { id: 'weekend_warrior', icon: 'Moon',   color: '#6366f1', category: 'quantite' },
  { id: 'balanced',        icon: 'Users',  color: '#14b8a6', category: 'quantite' },
  { id: 'morning_5',       icon: 'Sun',    color: '#fb923c', category: 'horaires' },
  { id: 'morning_10',      icon: 'Sun',    color: '#f59e0b', category: 'horaires' },
  { id: 'morning_25',      icon: 'Sun',    color: '#d97706', category: 'horaires' },
  { id: 'afternoon_5',     icon: 'Zap',    color: '#22c55e', category: 'horaires' },
  { id: 'afternoon_10',   icon: 'Zap',    color: '#16a34a', category: 'horaires' },
  { id: 'afternoon_25',   icon: 'Zap',    color: '#15803d', category: 'horaires' },
  { id: 'evening_5',      icon: 'Moon',   color: '#6366f1', category: 'horaires' },
  { id: 'evening_10',     icon: 'Moon',   color: '#4f46e5', category: 'horaires' },
  { id: 'evening_25',     icon: 'Moon',   color: '#4338ca', category: 'horaires' },

  // ── Social ───────────────────────────────────────────────────────────
  { id: 'first_share',    icon: 'Share2', color: '#3b82f6', category: 'social' },
  { id: 'white_hat',      icon: 'Award',  color: '#ffffff', category: 'social' },

  // ── Secrets ──────────────────────────────────────────────────────────
  { id: 'ghost',         icon: 'Ghost',  color: '#6b7280', category: 'secrets', secret: true },
  { id: 'perfectionist', icon: 'Star',   color: '#6b7280', category: 'secrets', secret: true },
  { id: 'beast',         icon: 'Rocket', color: '#6b7280', category: 'secrets', secret: true },
];

export const BADGE_DEFINITIONS = METADATA.map(meta => {
  const rule = BADGE_RULES.find(r => r.id === meta.id);
  return {
    ...meta,
    test: rule ? rule.test : () => false
  };
});

export const BADGE_MAP = Object.fromEntries(BADGE_DEFINITIONS.map(b => [b.id, b]));
export const getBadgeById = (id) => BADGE_MAP[id];

// Helper to get the icon component from a badge definition
export function getBadgeIconFromDef(def) {
  return BADGE_ICONS[def.icon] || Star;
}

// Test if a badge is unlocked (supports manual override via achievements)
export function isBadgeUnlocked(badgeId, stats, achievements = {}) {
  const val = achievements[badgeId];

  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  
  const def = BADGE_RULES.find(b => b.id === badgeId);
  return def ? def.test(stats) : false;
}
