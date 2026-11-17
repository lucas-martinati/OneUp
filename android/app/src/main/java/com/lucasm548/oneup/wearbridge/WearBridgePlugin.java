package com.lucasm548.oneup.wearbridge;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WearBridge")
public class WearBridgePlugin extends Plugin {
    private PhoneWearStore store;
    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { notifyListeners("wearOperations", new JSObject()); }
    };
    @Override public void load() {
        store = new PhoneWearStore(getContext());
        ContextCompat.registerReceiver(getContext(), receiver, new IntentFilter(PhoneWearStore.CHANGED), ContextCompat.RECEIVER_NOT_EXPORTED);
    }
    @Override protected void handleOnResume() { store.recoverPending(); }
    @Override protected void handleOnDestroy() { getContext().unregisterReceiver(receiver); }
    @PluginMethod public void configure(PluginCall call) {
        try { String scope = store.configure(call.getString("userId", "")); store.recoverPending(); call.resolve(new JSObject().put("scope", scope)); }
        catch (Exception error) { call.reject("Cannot configure watch", error); }
    }
    @PluginMethod public void publish(PluginCall call) {
        try { store.publish(call.getObject("snapshot")); call.resolve(); }
        catch (Exception error) { call.reject("Cannot publish watch snapshot", error); }
    }
    @PluginMethod public void getPending(PluginCall call) {
        try { call.resolve(new JSObject().put("operations", store.pending(call.getString("scope", "")))); }
        catch (Exception error) { call.reject("Cannot load watch inbox", error); }
    }
    @PluginMethod public void acknowledge(PluginCall call) {
        try { store.acknowledge(call.getArray("uris")); call.resolve(); }
        catch (Exception error) { call.reject("Cannot acknowledge watch inbox", error); }
    }
}
