import { cloudSync } from '../services/cloudSync';

/**
 * OneUp debug commands — available via window.oneupDebug in the browser console.
 * Extracted from App.jsx to keep the root component clean.
 */
export function installDebugCommands() {
  if (typeof window === 'undefined') return;

  const getActiveKey = (baseKey) => {
    const uid = cloudSync.getCurrentUserId();
    return uid ? `${baseKey}_${uid}` : baseKey;
  };

  window.oneupDebug = {
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
    showData() {
      const pKey = getActiveKey('pushup_challenge_data');
      const hKey = getActiveKey('oneup_session_history');
      const progress = localStorage.getItem(pKey);
      const history = localStorage.getItem(hKey);
      console.log(`[OneUp Debug] Current UID: ${cloudSync.getCurrentUserId() || 'Anonymous'}`);
      console.log(`[OneUp Debug] Progress (${pKey}):`, progress ? JSON.parse(progress) : null);
      console.log(`[OneUp Debug] History (${hKey}):`, history ? JSON.parse(history) : null);
    },
  };
  console.log('[OneUp Debug] Commands: window.oneupDebug.resetExercises(), .resetHistory(), .resetSettings(), .showData()');
}
