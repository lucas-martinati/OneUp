// Centralized icon system - single source of truth for all icons
// Avoids importing lucide-react everywhere, easy to modify in one place

import {
  // Exercise icons (from config/exercises.js & config/weights.js)
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Activity, MoveDown, MoveDiagonal,
  // UI icons
  X, Check, CheckCheck, ChevronLeft, ChevronRight, ChevronRight as ChevronNext,
  Plus, Minus, Play, RotateCcw, Save, Trash2, Edit3, Edit2 as Pencil,
  FolderOpen, GripVertical, Shuffle,
  // Social & gamification
  Trophy, Medal, Award, Star, Crown, Flame as FireStreak,
  Users, LogIn, UserPlus, Shield, HeartHandshake,
  LogOut, Hash,
  // Navigation & settings
  Settings as SettingsIcon, Bell, Volume2, Clock, Lock, Unlock,
  Globe, Gauge, ShoppingBag, ArrowLeft, ArrowRight,
  // Sharing & media
  Share2, Download, Image, Palette, Target, Clock as TimerIcon,
  History, Weight, Filter, Loader2, Smartphone,
  // Cloud & sync
  Cloud, CloudOff, Upload, AlertCircle, AlertTriangle,
  // Misc
  RefreshCw, Heart, Sparkles, Link, Calendar, TrendingUp,
} from 'lucide-react';

// ============ EXERCISES ============
export const EXERCISE_ICONS = {
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Square: Activity, MoveDown, MoveDiagonal,
};

// ============ UI ============
export const UI_ICONS = {
  X, Check, CheckCheck, ChevronLeft, ChevronRight, ChevronNext,
  Plus, Minus, Play, Pause: Play, RotateCcw, Save, Trash2, Edit3, Pencil,
  FolderOpen, GripVertical, Shuffle,
};

// ============ SOCIAL & GAMIFICATION ============
export const SOCIAL_ICONS = {
  Trophy, Medal, Award, Star, Crown, FireStreak,
  Users, LogIn, UserPlus, Shield, HeartHandshake,
  LogOut, Activity, Hash,
};

// ============ NAVIGATION & SETTINGS ============
export const NAV_ICONS = {
  Settings: SettingsIcon, Bell, Volume2, Clock, Lock, Unlock,
  Globe, Gauge, ShoppingBag, ArrowLeft, ArrowRight,
};

// ============ SHARING & MEDIA ============
export const SHARE_ICONS = {
  Share2, Download, Image, Palette, Target, TimerIcon,
  History, Weight, Filter, Loader2, Smartphone,
};

// ============ CLOUD & SYNC ============
export const CLOUD_ICONS = {
  Cloud, CloudOff, Upload, AlertCircle, AlertTriangle,
};

// ============ MISC ============
export const MISC_ICONS = {
  RefreshCw, Heart, Sparkles, Link, Calendar, TrendingUp,
};

// ============ CATEGORIES (re-exports for convenience) ============
export const CATEGORY_ICONS = {
  BODYWEIGHT: Dumbbell,
  WEIGHTS: ArrowUp,
  CUSTOM: Star,
};

// ============ ALL ICONS MERGED ============
export const ICON_MAP = {
  ...EXERCISE_ICONS,
  ...UI_ICONS,
  ...SOCIAL_ICONS,
  ...NAV_ICONS,
  ...SHARE_ICONS,
  ...CLOUD_ICONS,
  ...MISC_ICONS,
};

// ============ GET ICON FUNCTION ============
/**
 * Get icon component by name
 * @param {string} name - Icon name (e.g., 'Dumbbell', 'Trophy', 'X')
 * @param {string} [fallback='Dumbbell'] - Fallback icon name if not found
 * @returns {React.Component} lucide-react icon component
 */
export function getIcon(name, fallback = 'Dumbbell') {
  if (!name) return ICON_MAP[fallback] || Dumbbell;
  return ICON_MAP[name] || ICON_MAP[fallback] || Dumbbell;
}

/**
 * Get icon by category type
 * @param {string} category - 'bodyweight' | 'weights' | 'custom'
 * @returns {React.Component}
 */
export function getCategoryIcon(category) {
  const map = {
    bodyweight: 'Dumbbell',
    weights: 'ArrowUp',
    custom: 'Star',
  };
  return getIcon(map[category], 'Dumbbell');
}

/**
 * Get icon from exercise object
 * @param {Object|string} exercise - Exercise object with icon property or icon name string
 * @returns {React.Component}
 */
export function getExerciseIcon(exercise) {
  if (!exercise) return Dumbbell;
  if (typeof exercise === 'string') return getIcon(exercise);
  return getIcon(exercise.icon, 'Dumbbell');
}

// Default export for convenience
export default getIcon;