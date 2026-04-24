import React from 'react';
import {
  // Exercise icons
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Activity, MoveDown, MoveDiagonal, Square,
  // UI icons
  X, Check, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Minus, 
  Play, Pause, RotateCcw, Save, Trash2, Edit3, Edit2,
  FolderOpen, GripVertical, Shuffle, ArrowLeft, ArrowRight,
  // Social & gamification
  Trophy, Medal, Award, Star, Crown,
  Users, User, LogIn, UserPlus, Shield, HeartHandshake,
  LogOut, Hash, Swords,
  // Navigation & settings
  Settings, Settings2, Bell, Volume2, Clock, Lock, Unlock,
  Globe, Gauge, ShoppingBag, PieChart,
  // Sharing & media
  Share2, Download, Image, Palette, Target,
  History, Weight, Filter, Loader2, Smartphone,
  // Cloud & sync
  Cloud, CloudOff, Upload, AlertCircle, AlertTriangle,
  // Misc
  RefreshCw, Heart, Sparkles, Link, Calendar, TrendingUp, BarChart3,
  Gem, Ghost, Moon, Rocket, Sun,
} from 'lucide-react';

// ============ INDIVIDUAL EXPORTS ============
export {
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Activity, MoveDown, MoveDiagonal, Square,
  X, Check, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Minus,
  Play, Pause, RotateCcw, Save, Trash2, Edit3, Edit2,
  FolderOpen, GripVertical, Shuffle, ArrowLeft, ArrowRight,
  Trophy, Medal, Award, Star, Crown,
  Users, User, LogIn, UserPlus, Shield, HeartHandshake,
  LogOut, Hash, Swords,
  Settings, Settings2, Bell, Volume2, Clock, Lock, Unlock,
  Globe, Gauge, ShoppingBag, PieChart,
  Share2, Download, Image, Palette, Target,
  History, Weight, Filter, Loader2, Smartphone,
  Cloud, CloudOff, Upload, AlertCircle, AlertTriangle,
  RefreshCw, Heart, Sparkles, Link, Calendar, TrendingUp, BarChart3,
  Gem, Ghost, Moon, Rocket, Sun
};

// ============ ALIASES ============
export { 
  Edit2 as Pencil,
  Clock as TimerIcon,
  Flame as FireStreak,
  ChevronRight as ChevronNext,
  Settings as SettingsIcon
};

// ============ GROUPED OBJECTS (Compatibility) ============
export const EXERCISE_ICONS = {
  Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
  Flame, Square, MoveDown, MoveDiagonal,
};

export const UI_ICONS = {
  X, Check, CheckCheck, ChevronLeft, ChevronRight, ChevronNext: ChevronRight,
  Plus, Minus, Play, Pause, RotateCcw, Save, Trash2, Edit3, Pencil: Edit2,
  FolderOpen, GripVertical, Shuffle, ArrowLeft, ArrowRight
};

export const SOCIAL_ICONS = {
  Trophy, Medal, Award, Star, Crown, FireStreak: Flame,
  Users, User, LogIn, UserPlus, Shield, HeartHandshake,
  LogOut, Activity, Hash, Swords,
};

export const NAV_ICONS = {
  Settings, Settings2, Bell, Volume2, Clock, Lock, Unlock,
  Globe, Gauge, ShoppingBag, PieChart,
};

export const SHARE_ICONS = {
  Share2, Download, Image, Palette, Target, TimerIcon: Clock,
  History, Weight, Filter, Loader2, Smartphone,
};

export const CLOUD_ICONS = {
  Cloud, CloudOff, Upload, AlertCircle, AlertTriangle,
};

export const MISC_ICONS = {
  RefreshCw, Heart, Sparkles, Link, Calendar, TrendingUp, BarChart3,
};

export const CATEGORY_ICONS = {
  BODYWEIGHT: Dumbbell,
  WEIGHTS: ArrowUp,
  CUSTOM: Star,
};

// ============ MERGED MAP ============
export const ICON_MAP = {
  ...EXERCISE_ICONS,
  ...UI_ICONS,
  ...SOCIAL_ICONS,
  ...NAV_ICONS,
  ...SHARE_ICONS,
  ...CLOUD_ICONS,
  ...MISC_ICONS,
  Settings2,
};

// ============ UTILITIES ============
/**
 * Get icon component by name
 * @param {string} name - Icon name
 * @param {string} [fallback='Dumbbell'] - Fallback icon name
 */
export function getIcon(name, fallback = 'Dumbbell') {
  if (!name) return ICON_MAP[fallback] || Dumbbell;
  return ICON_MAP[name] || ICON_MAP[fallback] || Dumbbell;
}

/**
 * Get icon by category type
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
 */
export function getExerciseIcon(exercise) {
  if (!exercise) return Dumbbell;
  if (typeof exercise === 'string') return getIcon(exercise);
  return getIcon(exercise.icon, 'Dumbbell');
}

export default getIcon;

/**
 * A stable component for rendering icons dynamically by name.
 */
export const DynamicIcon = ({ icon, fallback = 'Dumbbell', ...props }) => {
  const IconComponent = getIcon(icon, fallback);
  return React.createElement(IconComponent, props);
};