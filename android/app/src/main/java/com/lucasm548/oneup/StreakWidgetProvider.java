package com.lucasm548.oneup;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * AppWidgetProvider for OneUp streak widgets.
 * Reads widget data from SharedPreferences (written by the Capacitor app via @capacitor/preferences)
 * and updates the widget layouts.
 *
 * Handles both small (2x1) and large (4x2) widget sizes.
 * Also listens for a custom REFRESH action broadcast from the web app bridge.
 */
public class StreakWidgetProvider extends AppWidgetProvider {

    // SharedPreferences file used by @capacitor/preferences
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String WIDGET_DATA_KEY = "widget_data";

    // Custom action for triggering widget refresh from the app
    public static final String ACTION_REFRESH = "com.lucasm548.oneup.REFRESH_WIDGETS";

    // Stable request code for the midnight-rollover alarm PendingIntent
    private static final int MIDNIGHT_ALARM_REQUEST_CODE = 4801;

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        scheduleNextMidnightUpdate(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();

        // Handle custom refresh, date change, timezone change, and manual time set
        if (ACTION_REFRESH.equals(action)
            || Intent.ACTION_DATE_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
            || Intent.ACTION_TIME_CHANGED.equals(action)) {

            AppWidgetManager manager = AppWidgetManager.getInstance(context);

            // Refresh small widgets
            int[] smallIds = manager.getAppWidgetIds(
                new ComponentName(context, StreakWidgetProvider.class));
            if (smallIds.length > 0) {
                onUpdate(context, manager, smallIds);
            }

            // Refresh large widgets
            int[] largeIds = manager.getAppWidgetIds(
                new ComponentName(context, StreakWidgetLargeProvider.class));
            if (largeIds.length > 0) {
                onUpdate(context, manager, largeIds);
            }
        }
    }

    /**
     * Schedule an explicit ACTION_REFRESH broadcast for the next local midnight.
     *
     * ACTION_DATE_CHANGED is never delivered to manifest receivers on Android 8+
     * (implicit broadcast restrictions), and updatePeriodMillis is batched or
     * blocked by aggressive OEMs — so without this alarm the widget keeps showing
     * yesterday until the app is opened. Explicit broadcasts are exempt from the
     * restrictions. The alarm is one-shot and re-armed by every onUpdate pass
     * (including the one it triggers itself), so it repeats daily as long as at
     * least one widget exists.
     */
    private static void scheduleNextMidnightUpdate(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, StreakWidgetProvider.class);
        intent.setAction(ACTION_REFRESH);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, MIDNIGHT_ALARM_REQUEST_CODE, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        java.util.Calendar midnight = java.util.Calendar.getInstance();
        midnight.add(java.util.Calendar.DAY_OF_YEAR, 1);
        midnight.set(java.util.Calendar.HOUR_OF_DAY, 0);
        midnight.set(java.util.Calendar.MINUTE, 0);
        midnight.set(java.util.Calendar.SECOND, 5);
        midnight.set(java.util.Calendar.MILLISECOND, 0);

        // RTC (no wakeup): the widget isn't visible while the device sleeps, so
        // updating on the next wake is enough. AllowWhileIdle survives Doze.
        // No SCHEDULE_EXACT_ALARM permission needed for inexact alarms.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC, midnight.getTimeInMillis(), pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC, midnight.getTimeInMillis(), pendingIntent);
        }
    }

    /** Local midnight (start of day) for the given epoch millis. */
    private static long startOfLocalDay(long timeMs) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTimeInMillis(timeMs);
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Re-arm the daily rollover alarm on every update pass
        scheduleNextMidnightUpdate(context);

        // Read widget data from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String rawData = prefs.getString(WIDGET_DATA_KEY, null);

        int streak = 0;
        boolean streakActive = false;
        boolean todayDone = false;
        int[] weekDays = new int[7];
        int storedTodayIndex = -1;
        long updatedAt = 0;
        boolean streakFrozen = false;

        String streakLabel = "STREAK";
        String daysLabel = "DAYS";
        String[] weekdayLabels = {"M", "T", "W", "T", "F", "S", "S"};

        if (rawData != null) {
            try {
                JSONObject data = new JSONObject(rawData);
                streak = data.optInt("streak", 0);
                streakActive = data.optBoolean("streakActive", false);
                todayDone = data.optBoolean("todayDone", false);
                storedTodayIndex = data.optInt("todayIndex", -1);
                updatedAt = data.optLong("updatedAt", 0);
                streakFrozen = data.optBoolean("streakFrozen", false);

                streakLabel = data.optString("streakLabel", streakLabel);
                daysLabel = data.optString("daysLabel", daysLabel);
                JSONArray labelsArray = data.optJSONArray("weekdayLabels");
                if (labelsArray != null) {
                    for (int i = 0; i < Math.min(labelsArray.length(), 7); i++) {
                        weekdayLabels[i] = labelsArray.optString(i, weekdayLabels[i]);
                    }
                }

                JSONArray weekArray = data.optJSONArray("weekDays");
                if (weekArray != null) {
                    for (int i = 0; i < Math.min(weekArray.length(), 7); i++) {
                        weekDays[i] = weekArray.optInt(i, 0);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Always recalculate todayIndex from the current system date (Mon=0 ... Sun=6)
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int dayOfWeek = cal.get(java.util.Calendar.DAY_OF_WEEK); // Sun=1, Mon=2, ... Sat=7
        int todayIndex = (dayOfWeek == java.util.Calendar.SUNDAY) ? 6 : dayOfWeek - 2;

        // Days elapsed since the JS bridge last wrote data. Prefer the write
        // timestamp: comparing weekday indexes alone misses exact 7-day jumps.
        // Math.round absorbs the 23h/25h days around DST transitions.
        long daysElapsed = 0;
        if (updatedAt > 0) {
            daysElapsed = Math.round(
                (startOfLocalDay(System.currentTimeMillis()) - startOfLocalDay(updatedAt)) / 86400000.0);
            if (daysElapsed < 0) daysElapsed = 0; // clock moved backwards
        } else if (storedTodayIndex >= 0 && storedTodayIndex != todayIndex) {
            // Data written by an older app version without updatedAt
            daysElapsed = (todayIndex - storedTodayIndex + 7) % 7;
        }

        // If the day has changed since the JS bridge last wrote data
        if (daysElapsed > 0) {
            // If the stored day wasn't completed, streak is broken
            if (!streakActive) {
                streak = 0;
            }
            todayDone = false;
            streakActive = false;

            // Detect if we rolled into a new week (Mon=0)
            // New week = todayIndex < storedTodayIndex (e.g. Sun→Mon = 6→0)
            // OR jumped by 7 days or more
            boolean newWeek = daysElapsed >= 7 || todayIndex < storedTodayIndex;

            if (newWeek) {
                // New week: reset all dots, only keep days already done this new week
                for (int i = 0; i < 7; i++) {
                    weekDays[i] = 0;
                }
            } else {
                // Same week, just moved forward: mark future days (from today onward) as not done
                // Past days keep their green dots
                for (int i = storedTodayIndex + 1; i < 7; i++) {
                    weekDays[i] = 0;
                }
            }
        }

        // Create intent to open the app when widget is tapped
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        for (int appWidgetId : appWidgetIds) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            android.os.Bundle options = manager.getAppWidgetOptions(appWidgetId);
            int minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110);

            if (minWidth >= 200) {
                updateLargeWidget(context, appWidgetManager, appWidgetId, pendingIntent,
                    streak, streakActive, todayDone, weekDays, todayIndex,
                    streakLabel, daysLabel, weekdayLabels, streakFrozen);
            } else {
                updateSmallWidget(context, appWidgetManager, appWidgetId, pendingIntent,
                    streak, streakActive, streakLabel, streakFrozen);
            }
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                           int appWidgetId, android.os.Bundle newOptions) {
        onUpdate(context, appWidgetManager, new int[]{appWidgetId});
    }

    private void updateSmallWidget(Context context, AppWidgetManager appWidgetManager,
                                    int appWidgetId, PendingIntent pendingIntent,
                                    int streak, boolean streakActive, String streakLabel,
                                    boolean isFrozen) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak_small);

        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
        views.setTextViewText(R.id.widget_streak_label, streakLabel);

        // Sad state when streak is 0: dormant, dim, extinguished-ember look
        boolean isSad = streak == 0;

        if (isFrozen) {
            views.setInt(R.id.widget_small_root, "setBackgroundResource", R.drawable.widget_background_frozen);
            views.setTextColor(R.id.widget_streak_count, 0xFFFFFFFF);
            views.setTextColor(R.id.widget_streak_label, 0x80FFFFFF);
            views.setImageViewResource(R.id.widget_flame_icon, R.drawable.ic_flame_frozen);
        } else {
            views.setInt(R.id.widget_small_root, "setBackgroundResource",
                isSad ? R.drawable.widget_background_sad : R.drawable.widget_background);
            views.setTextColor(R.id.widget_streak_count,
                isSad ? 0x99b0a596 : 0xFFFFFFFF);
            views.setTextColor(R.id.widget_streak_label,
                isSad ? 0x66a3978a : 0x80FFFFFF);
                
            if (isSad) {
                views.setImageViewResource(R.id.widget_flame_icon, R.drawable.ic_flame_sad);
            } else {
                views.setImageViewResource(R.id.widget_flame_icon,
                    streakActive ? R.drawable.ic_flame : R.drawable.ic_flame_gray);
            }
        }

        // Clickable root layout
        views.setOnClickPendingIntent(R.id.widget_small_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private void updateLargeWidget(Context context, AppWidgetManager appWidgetManager,
                                    int appWidgetId, PendingIntent pendingIntent,
                                    int streak, boolean streakActive, boolean todayDone,
                                    int[] weekDays, int todayIndex,
                                    String streakLabel, String daysLabel, String[] weekdayLabels,
                                    boolean isFrozen) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak_large);

        // Sad state when streak is 0: dormant, dim, extinguished-ember look
        boolean isSad = streak == 0;

        if (isFrozen) {
            views.setInt(R.id.widget_large_root, "setBackgroundResource", R.drawable.widget_background_frozen);
            views.setTextColor(R.id.widget_large_streak_count, 0xFFFFFFFF);
            views.setTextColor(R.id.widget_large_streak_label, 0x60FFFFFF);
            views.setImageViewResource(R.id.widget_large_flame_icon, R.drawable.ic_flame_frozen);
        } else {
            views.setInt(R.id.widget_large_root, "setBackgroundResource",
                isSad ? R.drawable.widget_background_sad : R.drawable.widget_background);
            views.setTextColor(R.id.widget_large_streak_count,
                isSad ? 0x99b0a596 : 0xFFFFFFFF);
            views.setTextColor(R.id.widget_large_streak_label,
                isSad ? 0x66a3978a : 0x60FFFFFF);
                
            if (isSad) {
                views.setImageViewResource(R.id.widget_large_flame_icon, R.drawable.ic_flame_sad);
            } else {
                views.setImageViewResource(R.id.widget_large_flame_icon,
                    streakActive ? R.drawable.ic_flame : R.drawable.ic_flame_gray);
            }
        }

        views.setTextViewText(R.id.widget_large_streak_count, String.valueOf(streak));
        views.setTextViewText(R.id.widget_large_streak_label, daysLabel);

        // Update week day dots and labels
        int[] dotIds = {
            R.id.dot_mon, R.id.dot_tue, R.id.dot_wed,
            R.id.dot_thu, R.id.dot_fri, R.id.dot_sat, R.id.dot_sun
        };
        int[] labelIds = {
            R.id.label_mon, R.id.label_tue, R.id.label_wed,
            R.id.label_thu, R.id.label_fri, R.id.label_sat, R.id.label_sun
        };

        // Label colors: frozen uses icy sky-blue, default uses violet/cyan
        int colorDone = 0xFFa78bfa;
        int colorToday = 0xFF22d3ee;
        int colorDefault = 0x60FFFFFF;

        // Always reflect the real per-day completion, even when the streak is broken
        // (isSad). A day that was validated this week must keep its "done" dot — losing
        // the streak dims the background/flame, not the history of completed days.
        for (int i = 0; i < 7; i++) {
            int drawableRes;
            int labelColor;
            
            if (weekDays[i] == 1) { // DONE
                drawableRes = R.drawable.dot_done;
                labelColor = colorDone;
            } else if (weekDays[i] == 2) { // FROZEN
                drawableRes = R.drawable.dot_done_frozen;
                labelColor = 0xFF7dd3fc; // sky-blue
            } else if (i == todayIndex) { // TODAY (pending)
                drawableRes = R.drawable.dot_today;
                labelColor = colorToday;
            } else { // PENDING
                drawableRes = R.drawable.dot_pending;
                labelColor = colorDefault;
            }
            
            views.setImageViewResource(dotIds[i], drawableRes);
            views.setTextColor(labelIds[i], labelColor);
            views.setTextViewText(labelIds[i], weekdayLabels[i]);
        }

        // Clickable root layout
        views.setOnClickPendingIntent(R.id.widget_large_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
