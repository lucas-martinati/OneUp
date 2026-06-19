import { cloudSync } from '@services/cloudSync';
import { BADGE_DEFINITIONS } from '@config/badgeDefinitions';
import { useUIStore } from '@store/useUIStore';
import i18n from '../i18n';

/**
 * OneUp debug commands — available via window.oneupDebug (also aliased as the
 * lowercase window.oneupdebug) in the browser console.
 * Extracted from App.jsx to keep the root component clean.
 */
export function installDebugCommands() {
  if (typeof window === 'undefined') return;

  const getActiveKey = (baseKey) => {
    const uid = cloudSync.getCurrentUserId();
    return uid ? `${baseKey}_${uid}` : baseKey;
  };

  const badgeTitle = (id) => i18n?.t?.(`achievements.badges.${id}.title`, id) ?? id;

  const debug = {
    // ── Data inspection ────────────────────────────────────────────────
    showData() {
      const pKey = getActiveKey('pushup_challenge_data');
      const hKey = getActiveKey('oneup_session_history');
      const sKey = getActiveKey('oneup_settings');
      const progress = localStorage.getItem(pKey);
      const history = localStorage.getItem(hKey);
      const settings = localStorage.getItem(sKey);
      console.log(`[OneUp Debug] Current UID: ${cloudSync.getCurrentUserId() || 'Anonymous'}`);
      console.log(`[OneUp Debug] Progress (${pKey}):`, progress ? JSON.parse(progress) : null);
      console.log(`[OneUp Debug] History (${hKey}):`, history ? JSON.parse(history) : null);
      console.log(`[OneUp Debug] Settings (${sKey}):`, settings ? JSON.parse(settings) : null);
    },

    // ── Achievements ───────────────────────────────────────────────────
    /** Print every badge id + title so you can copy one to use below. */
    listAchievements() {
      const rows = BADGE_DEFINITIONS.map(b => ({
        id: b.id, title: badgeTitle(b.id), category: b.category, secret: !!b.secret,
      }));
      console.table(rows);
      console.log(`[OneUp Debug] ${rows.length} badges. e.g. window.oneupDebug.giveAchievement('${BADGE_DEFINITIONS[0]?.id}')`);
      return rows.map(r => r.id);
    },

    /** Trigger the unlock toast for a badge (and mark it earned). */
    giveAchievement(badgeId) {
      if (!BADGE_DEFINITIONS.some(b => b.id === badgeId)) {
        console.warn(`[OneUp Debug] Unknown badge "${badgeId}". Use .listAchievements() to see all ids.`);
        return;
      }
      window.dispatchEvent(new CustomEvent('show-achievement', { detail: { badgeId } }));
      console.log(`[OneUp Debug] Showed achievement toast for "${badgeId}" (${badgeTitle(badgeId)}).`);
    },

    /** Show a custom achievement toast with arbitrary title/color. */
    showCustomAchievement(title = 'Test Achievement', color = '#fbbf24') {
      window.dispatchEvent(new CustomEvent('show-achievement-custom', { detail: { title, color } }));
      console.log(`[OneUp Debug] Showed custom achievement toast "${title}".`);
    },

    /** Open the achievements panel — optionally scrolled to & highlighting a badge. */
    openAchievements(badgeId = null) {
      if (badgeId && !BADGE_DEFINITIONS.some(b => b.id === badgeId)) {
        console.warn(`[OneUp Debug] Unknown badge "${badgeId}". Opening without highlight.`);
        badgeId = null;
      }
      useUIStore.getState().openAchievements(badgeId);
      const highlightStr = badgeId ? ` highlighting "${badgeId}"` : '';
      console.log(`[OneUp Debug] Opened achievements panel${highlightStr}.`);
    },

    // ── Social ─────────────────────────────────────────────────────────
    /** Inject a fake "poke" toast (no Firestore needed). */
    poke(fromName = 'Coach', message = '👋 Poke de test !') {
      window.dispatchEvent(new CustomEvent('oneup-debug-poke', { detail: { fromName, message } }));
      console.log(`[OneUp Debug] Injected poke from "${fromName}".`);
    },

    // ── Resets ─────────────────────────────────────────────────────────
    resetExercises() {
      const key = getActiveKey('pushup_challenge_data');
      const raw = localStorage.getItem(key);
      if (!raw) {
        console.log(`[OneUp Debug] No data found at ${key}`);
        return;
      }
      try {
        const data = JSON.parse(raw);
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const day = data.completions?.[todayStr];
        if (day && typeof day === 'object') {
          for (const exId of Object.keys(day)) {
            if (day[exId] && typeof day[exId] === 'object') {
              day[exId].isCompleted = false;
              delete day[exId].count;
            }
          }
          localStorage.setItem(key, JSON.stringify(data));
          console.log(`[OneUp Debug] Today (${todayStr}) exercises reset in ${key}. Reload to apply.`);
        } else {
          console.log(`[OneUp Debug] No data for today (${todayStr}) in ${key}.`);
        }
      } catch (e) {
        console.error('[OneUp Debug] Error:', e);
      }
    },
    resetHistory() {
      const key = getActiveKey('oneup_session_history');
      localStorage.removeItem(key);
      console.log(`[OneUp Debug] Session history cleared for ${key}. Reload to apply.`);
    },
    resetSettings() {
      const key = getActiveKey('oneup_settings');
      localStorage.removeItem(key);
      console.log(`[OneUp Debug] Settings reset for ${key}. Reload to apply.`);
    },
    /** Clear progress + history + settings in one go. */
    resetAll() {
      ['pushup_challenge_data', 'oneup_session_history', 'oneup_settings']
        .forEach(base => localStorage.removeItem(getActiveKey(base)));
      console.log('[OneUp Debug] Progress, history and settings cleared. Reload to apply.');
    },

    /** Reprint the command list with descriptions. */
    help() {
      printHelp();
    },
  };

  window.oneupDebug = debug;
  window.oneupdebug = debug; // case-insensitivity convenience alias

  const printHelp = () => {
    const lines = [
      ['showData()', 'Dump progress / history / settings for the current user'],
      ['listAchievements()', 'Table of every badge id + title'],
      ["giveAchievement('first_blood')", 'Trigger an unlock toast for a badge'],
      ["showCustomAchievement('Title', '#fbbf24')", 'Show a custom achievement toast'],
      ["openAchievements('first_blood')", 'Open the panel (optionally highlighting a badge)'],
      ["poke('Coach', 'Hello!')", 'Inject a fake poke toast'],
      ['resetExercises()', "Reset today's exercises"],
      ['resetHistory()', 'Clear session history'],
      ['resetSettings()', 'Reset settings'],
      ['resetAll()', 'Clear progress + history + settings'],
      ['help()', 'Show this list again'],
    ];
    const pad = Math.max(...lines.map(([c]) => c.length));
    console.log(
      '%c[OneUp Debug]%c commands (also on window.oneupdebug):\n' +
      lines.map(([c, d]) => `  window.oneupDebug.${c.padEnd(pad)}  // ${d}`).join('\n'),
      'color:#fbbf24;font-weight:bold', 'color:inherit'
    );
  };

  printHelp();
}
