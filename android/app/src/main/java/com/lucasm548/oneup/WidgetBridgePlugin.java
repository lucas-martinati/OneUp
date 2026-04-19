package com.lucasm548.oneup;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin that sends a broadcast to refresh all OneUp widgets.
 * Called from JS after writing widget data to SharedPreferences.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod()
    public void refreshWidgets(PluginCall call) {
        Intent intent = new Intent(StreakWidgetProvider.ACTION_REFRESH);
        intent.setPackage(getContext().getPackageName());
        getContext().sendBroadcast(intent);
        call.resolve();
    }
}
