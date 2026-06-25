package com.lucasm548.oneup;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

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

    /**
     * Robust one-shot vibration.
     *
     * The official @capacitor/haptics plugin calls createOneShot(..,
     * DEFAULT_AMPLITUDE) with no VibrationAttributes. On several devices
     * (notably Samsung) DEFAULT_AMPLITUDE produces no perceptible vibration on
     * short pulses, and the missing attributes classify the effect as
     * USAGE_UNKNOWN which the system can filter out — so the call succeeds but
     * nothing is felt, even though games vibrate fine. Here we force a strong
     * explicit amplitude and tag the effect with an overridable usage channel
     * (default "ringtone", which MIUI/HyperOS does not gate like touch haptics).
     */
    @PluginMethod()
    public void vibrate(PluginCall call) {
        int duration = call.getInt("duration", 50);
        // Channel ("usage") controls which system intensity/gate applies. MIUI &
        // friends block touch/unknown vibrations from third-party apps but let
        // ringtone/alarm through — so this is overridable to find a channel that
        // is not filtered on a given device.
        String usage = call.getString("usage", "ringtone");

        Vibrator vibrator;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager manager = (VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            vibrator = manager != null ? manager.getDefaultVibrator() : null;
        } else {
            vibrator = getDeprecatedVibrator();
        }

        if (vibrator == null || !vibrator.hasVibrator()) {
            call.resolve();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int amplitude = vibrator.hasAmplitudeControl() ? 255 : VibrationEffect.DEFAULT_AMPLITUDE;
            VibrationEffect effect = VibrationEffect.createOneShot(duration, amplitude);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                VibrationAttributes attributes = new VibrationAttributes.Builder()
                    .setUsage(vibrationUsage(usage))
                    .build();
                vibrator.vibrate(effect, attributes);
            } else {
                // API 26-32: route via AudioAttributes usage instead.
                vibrator.vibrate(effect, audioAttributes(usage));
            }
        } else {
            vibratePre26(vibrator, duration);
        }

        call.resolve();
    }

    private int vibrationUsage(String usage) {
        switch (usage) {
            case "alarm": return VibrationAttributes.USAGE_ALARM;
            case "notification": return VibrationAttributes.USAGE_NOTIFICATION;
            case "media": return VibrationAttributes.USAGE_MEDIA;
            case "touch": return VibrationAttributes.USAGE_TOUCH;
            case "hardware": return VibrationAttributes.USAGE_HARDWARE_FEEDBACK;
            case "unknown": return VibrationAttributes.USAGE_UNKNOWN;
            case "ringtone":
            default: return VibrationAttributes.USAGE_RINGTONE;
        }
    }

    private AudioAttributes audioAttributes(String usage) {
        int audioUsage;
        switch (usage) {
            case "alarm": audioUsage = AudioAttributes.USAGE_ALARM; break;
            case "notification": audioUsage = AudioAttributes.USAGE_NOTIFICATION; break;
            case "media": audioUsage = AudioAttributes.USAGE_MEDIA; break;
            case "ringtone":
            default: audioUsage = AudioAttributes.USAGE_NOTIFICATION_RINGTONE; break;
        }
        return new AudioAttributes.Builder()
            .setUsage(audioUsage)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
    }

    @SuppressWarnings("deprecation")
    private Vibrator getDeprecatedVibrator() {
        return (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
    }

    @SuppressWarnings("deprecation")
    private void vibratePre26(Vibrator vibrator, int duration) {
        vibrator.vibrate(duration);
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
