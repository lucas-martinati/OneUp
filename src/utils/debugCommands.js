/**
 * OneUp debug commands — available via window.oneupDebug in the browser console.
 * Extracted from App.jsx to keep the root component clean.
 */
export function installDebugCommands() {
  if (typeof window === 'undefined') return;

  window.oneupDebug = {
    resetExercises() {
      const raw = localStorage.getItem('pushup_challenge_data');
      if (!raw) { console.log('[OneUp Debug] No data found.'); return; }
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
          localStorage.setItem('pushup_challenge_data', JSON.stringify(data));
          console.log(`[OneUp Debug] Today (${todayStr}) exercises reset. Reload to apply.`);
        } else {
          console.log(`[OneUp Debug] No data for today (${todayStr}).`);
        }
      } catch (e) {
        console.error('[OneUp Debug] Error:', e);
      }
    },
    resetHistory() {
      localStorage.removeItem('oneup_session_history');
      console.log('[OneUp Debug] Session history cleared. Reload to apply.');
    },
    resetSettings() {
      localStorage.removeItem('oneup_settings');
      console.log('[OneUp Debug] Settings reset. Reload to apply.');
    },
    showData() {
      const progress = localStorage.getItem('pushup_challenge_data');
      const history = localStorage.getItem('oneup_session_history');
      console.log('[OneUp Debug] Progress:', progress ? JSON.parse(progress) : null);
      console.log('[OneUp Debug] History:', history ? JSON.parse(history) : null);
    },
  };
  console.log('[OneUp Debug] Commands: window.oneupDebug.resetExercises(), .resetHistory(), .resetSettings(), .showData()');
}
