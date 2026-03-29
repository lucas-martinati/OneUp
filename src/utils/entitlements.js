import { Heart, Crown } from 'lucide-react';

const PRO_FEATURES = ['weights', 'customExercises', 'customPrograms', 'interDashboard', 'mergedStats'];
const LS_SUPPORTER = 'oneup_supporter';
const LS_PRO = 'oneup_pro';

// ── localStorage helpers ────────────────────────────────────────────────

export function loadCachedEntitlements() {
  return {
    isSupporter: localStorage.getItem(LS_SUPPORTER) === 'true',
    isPro: localStorage.getItem(LS_PRO) === 'true',
  };
}

export function saveCachedEntitlements({ isSupporter, isPro }) {
  localStorage.setItem(LS_SUPPORTER, isSupporter ? 'true' : 'false');
  localStorage.setItem(LS_PRO, isPro ? 'true' : 'false');
}

export function clearCachedEntitlements() {
  localStorage.removeItem(LS_SUPPORTER);
  localStorage.removeItem(LS_PRO);
}

// ── Access checks ───────────────────────────────────────────────────────

export function canAccessFeature(feature, { isPro } = {}) {
  if (PRO_FEATURES.includes(feature)) return !!isPro;
  return true;
}

export function filterLeaderboardByTier(entries, domain) {
  if (domain === 'weights') return entries.filter(e => e.isPro);
  return entries;
}

// ── Entitlement resolution ──────────────────────────────────────────────

export function resolveEntitlements(primary, fallback) {
  const sup = primary.isSupporter || fallback.isSupporter || false;
  const pro = primary.isPro || fallback.isPro || false;
  return { isSupporter: sup, isPro: pro, hasAnyEntitlement: sup || pro };
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
