package com.lucasm548.oneup;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        // Handle custom refresh broadcast
        if (ACTION_REFRESH.equals(intent.getAction())) {
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

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Read widget data from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String rawData = prefs.getString(WIDGET_DATA_KEY, null);

        int streak = 0;
        boolean streakActive = false;
        boolean todayDone = false;
        boolean[] weekDays = new boolean[7];
        int todayIndex = 0;

        if (rawData != null) {
            try {
                JSONObject data = new JSONObject(rawData);
                streak = data.optInt("streak", 0);
                streakActive = data.optBoolean("streakActive", false);
                todayDone = data.optBoolean("todayDone", false);
                todayIndex = data.optInt("todayIndex", 0);

                JSONArray weekArray = data.optJSONArray("weekDays");
                if (weekArray != null) {
                    for (int i = 0; i < Math.min(weekArray.length(), 7); i++) {
                        weekDays[i] = weekArray.optBoolean(i, false);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
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
                    streak, streakActive, todayDone, weekDays, todayIndex);
            } else {
                updateSmallWidget(context, appWidgetManager, appWidgetId, pendingIntent,
                    streak, streakActive);
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
                                    int streak, boolean streakActive) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak_small);

        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
        // Flame is colored only when today's exercise is done
        views.setImageViewResource(R.id.widget_flame_icon,
            streakActive ? R.drawable.ic_flame : R.drawable.ic_flame_gray);

        // Clickable root layout
        views.setOnClickPendingIntent(R.id.widget_small_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private void updateLargeWidget(Context context, AppWidgetManager appWidgetManager,
                                    int appWidgetId, PendingIntent pendingIntent,
                                    int streak, boolean streakActive, boolean todayDone,
                                    boolean[] weekDays, int todayIndex) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak_large);

        views.setTextViewText(R.id.widget_large_streak_count, String.valueOf(streak));
        // Flame is colored only when today's exercise is done
        views.setImageViewResource(R.id.widget_large_flame_icon,
            streakActive ? R.drawable.ic_flame : R.drawable.ic_flame_gray);

        // Update week day dots and labels
        int[] dotIds = {
            R.id.dot_mon, R.id.dot_tue, R.id.dot_wed,
            R.id.dot_thu, R.id.dot_fri, R.id.dot_sat, R.id.dot_sun
        };
        int[] labelIds = {
            R.id.label_mon, R.id.label_tue, R.id.label_wed,
            R.id.label_thu, R.id.label_fri, R.id.label_sat, R.id.label_sun
        };

        // Colors: green done, orange today, dim default
        int colorDone = 0xFF10b981;
        int colorToday = 0xFFf97316;
        int colorDefault = 0x60FFFFFF;

        for (int i = 0; i < 7; i++) {
            int drawableRes;
            int labelColor;
            if (weekDays[i]) {
                drawableRes = R.drawable.dot_done;
                labelColor = colorDone;
            } else if (i == todayIndex) {
                drawableRes = R.drawable.dot_today;
                labelColor = colorToday;
            } else {
                drawableRes = R.drawable.dot_pending;
                labelColor = colorDefault;
            }
            views.setImageViewResource(dotIds[i], drawableRes);
            views.setTextColor(labelIds[i], labelColor);
        }

        // Clickable root layout
        views.setOnClickPendingIntent(R.id.widget_large_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
