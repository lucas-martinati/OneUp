package com.lucasm548.oneup;

import android.Manifest;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Capacitor plugin that sends a broadcast to refresh all OneUp widgets,
 * and handles native permission requests for camera access.
 */
@CapacitorPlugin(
    name = "WidgetBridge",
    permissions = {
        @Permission(
            alias = "camera",
            strings = { Manifest.permission.CAMERA }
        )
    }
)
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod()
    public void refreshWidgets(PluginCall call) {
        Intent intent = new Intent(StreakWidgetProvider.ACTION_REFRESH);
        intent.setPackage(getContext().getPackageName());
        getContext().sendBroadcast(intent);
        call.resolve();
    }

    @PluginMethod()
    public void checkCameraPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("status", getPermissionState("camera").toString());
        call.resolve(result);
    }

    @PluginMethod()
    public void requestCameraPermission(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraCallback");
        } else {
            JSObject result = new JSObject();
            result.put("status", "GRANTED");
            call.resolve(result);
        }
    }

    @PermissionCallback
    private void cameraCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("status", getPermissionState("camera").toString());
        call.resolve(result);
    }
}
