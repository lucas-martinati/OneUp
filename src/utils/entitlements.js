import { Heart, Crown } from './icons';

const LS_SUPPORTER = 'oneup_supporter';
const LS_PRO = 'oneup_pro';
const LS_HAD_PRO = 'oneup_had_pro';

// ── Feature → required tier map ─────────────────────────────────────────

export const FEATURES = Object.freeze({
  WEIGHTS: 'weights',
  CUSTOM_EXERCISES: 'customExercises',
  CUSTOM_PROGRAMS: 'customPrograms',
  INTER_DASHBOARD: 'interDashboard',
  MERGED_STATS: 'mergedStats',
});

const FEATURE_TIER = Object.freeze({
  [FEATURES.WEIGHTS]: 'pro',
  [FEATURES.CUSTOM_EXERCISES]: 'pro',
  [FEATURES.CUSTOM_PROGRAMS]: 'pro',
  [FEATURES.INTER_DASHBOARD]: 'pro',
  [FEATURES.MERGED_STATS]: 'pro',
});

// ── localStorage helpers ────────────────────────────────────────────────

export function loadCachedEntitlements() {
  return {
    isSupporter: localStorage.getItem(LS_SUPPORTER) === 'true',
    isPro: localStorage.getItem(LS_PRO) === 'true',
    hadPro: localStorage.getItem(LS_HAD_PRO) === 'true',
  };
}

export function saveCachedEntitlements({ isSupporter, isPro, hadPro }) {
  localStorage.setItem(LS_SUPPORTER, isSupporter ? 'true' : 'false');
  localStorage.setItem(LS_PRO, isPro ? 'true' : 'false');
  if (hadPro !== undefined) {
    localStorage.setItem(LS_HAD_PRO, hadPro ? 'true' : 'false');
  }
}

export function clearCachedEntitlements() {
  localStorage.removeItem(LS_SUPPORTER);
  localStorage.removeItem(LS_PRO);
  // Specifically do not clear LS_HAD_PRO, as it's a permanent unlock if it was ever true
}

// ── Access checks ───────────────────────────────────────────────────────

export function canAccessFeature(feature, { isPro } = {}) {
  const requiredTier = FEATURE_TIER[feature];
  if (requiredTier === undefined) {
    throw new Error(`Unknown feature: "${feature}". Valid: ${Object.values(FEATURES).join(', ')}`);
  }
  return requiredTier === 'pro' ? !!isPro : true;
}

// ── Entitlement resolution ──────────────────────────────────────────────

export function resolveEntitlements(primary, fallback) {
  const sup = primary.isSupporter || fallback.isSupporter || false;
  const pro = primary.isPro || fallback.isPro || false;
  const hadPro = pro || primary.hadPro || fallback.hadPro || false;
  return { isSupporter: sup, isPro: pro, hadPro, hasAnyEntitlement: sup || hadPro };
}

// ── Badge config for tier display ───────────────────────────────────────

export function getTierBadgeConfigs(user) {
  const badges = [];
  if (user.isSupporter) {
    badges.push({ key: 'supporter', icon: Heart, color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.25)', fill: '#ef4444' });
  }
  if (user.isPro) {
    badges.push({ key: 'pro', icon: Crown, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.25)', fill: '#8b5cf6' });
  }
  return badges;
}
