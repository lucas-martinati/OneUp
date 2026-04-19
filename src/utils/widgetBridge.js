import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { getLocalDateStr } from './dateUtils';

/**
 * Bridge between the web app and native Android widgets.
 * Writes streak and weekly progress data to SharedPreferences
 * so the native AppWidgetProvider can read and display it,
 * then sends a broadcast to refresh all widgets immediately.
 *
 * SharedPreferences key: "widget_data"
 * SharedPreferences file: "CapacitorStorage" (default for @capacitor/preferences)
 */

// Register the native WidgetBridge plugin (Android only)
const WidgetBridge = Capacitor.getPlatform() === 'android'
  ? registerPlugin('WidgetBridge')
  : null;

/**
 * Compute the week days status (Mon→Sun) for the current week.
 * @param {Object} completions - { [dateStr]: { [exerciseId]: { isCompleted } } }
 * @returns {boolean[]} Array of 7 booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 */
function getWeekDaysStatus(completions) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  // Convert to Mon=0, Tue=1, ... Sun=6
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + i);
    const dateStr = getLocalDateStr(d);
    const dayData = completions[dateStr];
    const isDone = dayData
      ? Object.values(dayData).some(ex => ex?.isCompleted)
      : false;
    weekDays.push(isDone);
  }

  return weekDays;
}

/**
 * Get the current day index in the week (0=Mon, 6=Sun).
 * @returns {number}
 */
function getTodayIndex() {
  const dayOfWeek = new Date().getDay(); // 0=Sun
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/**
 * Update widget data in SharedPreferences and trigger a widget refresh.
 * Called after each stats computation in ProgressContext.
 *
 * @param {Object} computedStats - Output of useComputedStats
 * @param {Object} completions - Raw completions data
 */
export async function updateWidgetData(computedStats, completions) {
  // Only run on native Android
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    const widgetData = {
      // Show the ongoing streak even if today isn't done yet.
      // displayStreak = 0 when today isn't done and yesterday isn't done either,
      // but if yesterdayStreak > 0, the streak is still alive — show it.
      streak: computedStats.displayStreak
        || computedStats.yesterdayStreak
        || 0,
      streakActive: !!computedStats.streakActive,
      todayDone: !!computedStats.todayDone,
      weekDays: getWeekDaysStatus(completions),
      todayIndex: getTodayIndex(),
      updatedAt: Date.now(),
    };

    await Preferences.set({
      key: 'widget_data',
      value: JSON.stringify(widgetData),
    });

    // Send broadcast to refresh all widgets immediately
    if (WidgetBridge) {
      await WidgetBridge.refreshWidgets();
    }
  } catch (error) {
    // Silently fail — widget data is non-critical
    console.warn('[WidgetBridge] Failed to update widget data:', error);
  }
}
