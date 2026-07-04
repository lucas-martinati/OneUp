import { THEMES as GLOBAL_THEMES } from '@config/themes';

export function darkenHex(hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex;
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const CARD_THEMES = {};
GLOBAL_THEMES.forEach(t => {
  CARD_THEMES[t.key] = {
    bg: `linear-gradient(165deg, ${t.color} 0%, ${darkenHex(t.color, 0.6)} 40%, ${darkenHex(t.color, 0.8)} 100%)`,
    accent: t.accent,
    glow1: hexToRgba(t.accent, 0.15),
    glow2: hexToRgba(t.accent2 || t.accent, 0.1),
    streakGlow: hexToRgba(t.accent, 0.18)
  };
});
// Gold theme for perfect days
CARD_THEMES.gold = {
  bg: 'linear-gradient(165deg, #1a1305 0%, #171104 40%, #1f1b0a 100%)',
  accent: '#fbbf24',
  glow1: 'rgba(251,191,36,0.15)',
  glow2: 'rgba(245,158,11,0.1)',
  streakGlow: 'rgba(251,191,36,0.18)'
};
