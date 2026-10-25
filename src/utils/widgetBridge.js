import i18n from '../i18n';
import { getDayLevel } from '@shared/exerciseLevels.js';
import { getLocalDateStr, getDayStatus, DAY_STATUS } from '@shared/dateUtils';
import { isAndroidPlatform } from './platform';

/**
 * Bridge between the web app and native Android widgets.
 * Writes streak and weekly progress data to SharedPreferences
 * so the native AppWidgetProvider can read and display it,
 * then sends a broadcast to refresh all widgets immediately.
 *
 * SharedPreferences key: "widget_data"
 * SharedPreferences file: "CapacitorStorage" (default for @capacitor/preferences)
 */

let coreModulePromise = null;
let preferencesModulePromise = null;
let widgetBridgeInstance = null;

async function getCoreModule() {
  if (!coreModulePromise) {
    coreModulePromise = import('@capacitor/core');
  }
  return coreModulePromise;
}

async function getPreferencesModule() {
  if (!preferencesModulePromise) {
    preferencesModulePromise = import('@capacitor/preferences');
  }
  return preferencesModulePromise;
}

/**
 * Get the singleton WidgetBridge plugin instance.
 * registerPlugin must only be called once per plugin name — calling it
 * again throws "Capacitor plugin already registered". Any other module
 * needing the plugin must go through this accessor.
 *
 * Returns a wrapper `{ plugin }` rather than the raw proxy on purpose: a
 * Capacitor plugin proxy is "thenable" on native (any property access,
 * including `.then`, resolves to a callable that forwards to native). Returning
 * it directly from an async function — or awaiting it — makes the JS runtime
 * adopt it as a thenable and call native `WidgetBridge.then()`, which throws
 * "WidgetBridge.then() is not implemented on android". Wrapping keeps the proxy
 * out of the promise-resolution path.
 * @returns {Promise<{plugin: Object}>} Wrapper around the registered plugin
 */
export async function getWidgetBridge() {
  if (!widgetBridgeInstance) {
    const { registerPlugin } = await getCoreModule();
    widgetBridgeInstance = registerPlugin('WidgetBridge');
  }
  return { plugin: widgetBridgeInstance };
}

/**
 * Compute the week days status for the current week.
 * When weekStartDay is 'monday', order is Mon→Sun.
 * When weekStartDay is 'sunday', order is Sun→Sat.
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted } } }
 * @param {Object} frozenDays - { [dateStr]: { consumedAt } }
 * @param {string} weekStartDay - 'monday' or 'sunday'
 * @returns {{weekDays: number[], weekLevels: number[]}} Daily status and earned level
 */
function getWeekProgress(completions, frozenDays = {}, weekStartDay = 'monday') {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  let startOffset;
  if (weekStartDay === 'sunday') {
    // Sunday-start: offset from Sunday = dayOfWeek directly
    startOffset = dayOfWeek;
  } else {
    // Monday-start: convert to Mon=0, Tue=1, ... Sun=6
    startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  const weekDays = [];
  const weekLevels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - startOffset + i);
    const dateStr = getLocalDateStr(d);
    
    const status = getDayStatus(dateStr, completions, frozenDays, getLocalDateStr(today), weekStartDay);
    
    const level = dateStr <= getLocalDateStr(today) ? getDayLevel(completions, dateStr, null, weekStartDay) : 0;
    let state = 0; // PENDING
    if (level > 0) {
      state = 1;
    } else if (status === DAY_STATUS.FROZEN) {
      state = 2;
    }
    
    weekDays.push(state);
    weekLevels.push(level);
  }

  return { weekDays, weekLevels };
}

/**
 * Get the current day index in the week.
 * When weekStartDay is 'monday': 0=Mon, 6=Sun.
 * When weekStartDay is 'sunday': 0=Sun, 6=Sat.
 * @param {string} weekStartDay - 'monday' or 'sunday'
 * @returns {number}
 */
function getTodayIndex(weekStartDay = 'monday') {
  const dayOfWeek = new Date().getDay(); // 0=Sun
  if (weekStartDay === 'sunday') {
    return dayOfWeek;
  }
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/**
 * Update widget data in SharedPreferences and trigger a widget refresh.
 * Called after each stats computation in ProgressContext.
 *
 * @param {Object} computedStats - Output of useComputedStats
 * @param {Object} completions - Raw completions data
 * @param {Object} frozenDays - Frozen days data
 */
export async function updateWidgetData(computedStats, completions, frozenDays = {}, weekStartDay = 'monday') {
  // Only run on native Android
  if (!isAndroidPlatform()) return;

  try {
    await getWidgetBridge();
    const { Preferences } = await getPreferencesModule();

    const widgetData = {
      // Show the ongoing streak even if today isn't done yet.
      // displayStreak = 0 when today isn't done and yesterday isn't done either,
      // but if yesterdayStreak > 0, the streak is still alive — show it.
      streak: computedStats.displayStreak
        || computedStats.yesterdayStreak
        || 0,
      streakActive: !!computedStats.streakActive,
      todayDone: !!computedStats.todayDone,
      ...getWeekProgress(completions, frozenDays, weekStartDay),
      weekStartDay,
      streakLevel: computedStats.streakLevel || 0,
      levelLabel: i18n.t('levels.short', { level: computedStats.streakLevel || 0 }),
      weekLevelLabels: Array.from({ length: 11 }, (_, level) => i18n.t('levels.short', { level })),
      todayIndex: getTodayIndex(weekStartDay),
      updatedAt: Date.now(),
      streakFrozen: !!computedStats.streakFrozen,
      // Translations
      streakLabel: i18n.t('widgets.streak'),
      daysLabel: i18n.t('widgets.days'),
      weekdayLabels: (() => {
        const labels = i18n.t('widgets.weekdays', { returnObjects: true });
        // widgets.weekdays are Mon-first by default; rotate for Sunday-start
        if (weekStartDay === 'sunday' && Array.isArray(labels)) {
          return [labels[6], ...labels.slice(0, 6)];
        }
        return labels;
      })(),
    };

    await Preferences.set({
      key: 'widget_data',
      value: JSON.stringify(widgetData),
    });

    // Send broadcast to refresh all widgets immediately
    if (widgetBridgeInstance) {
      await widgetBridgeInstance.refreshWidgets();
    }
  } catch (error) {
    // Silently fail — widget data is non-critical
    console.warn('[WidgetBridge] Failed to update widget data:', error);
  }
}
