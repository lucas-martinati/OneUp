package com.lucasm548.oneup.wearbridge;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;
import com.google.android.gms.wearable.Wearable;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

final class PhoneWearStore {
    static final String CHANGED = "com.lucasm548.oneup.WEAR_OPERATIONS";
    private static final Object LOCK = new Object();
    private final Context context;
    private final SharedPreferences prefs;
    PhoneWearStore(Context context) {
        this.context = context.getApplicationContext();
        prefs = context.getSharedPreferences("oneup_wear_bridge", Context.MODE_PRIVATE);
    }
    private JSONObject read(String key) {
        try { return new JSONObject(prefs.getString(key, "{}")); }
        catch (JSONException error) { return new JSONObject(); }
    }
    private void save(String key, JSONObject data) {
        if (!prefs.edit().putString(key, data.toString()).commit()) throw new IllegalStateException("Cannot persist Wear data");
    }
    String configure(String user) throws Exception {
        synchronized (LOCK) {
            String installation = prefs.getString("installation", null);
            if (installation == null) {
                installation = UUID.randomUUID().toString();
                if (!prefs.edit().putString("installation", installation).commit()) throw new IllegalStateException("Cannot save installation");
            }
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((installation + ":" + user).getBytes(StandardCharsets.UTF_8));
            StringBuilder scope = new StringBuilder();
            for (byte b : digest) scope.append(String.format("%02x", b));
            if (!scope.toString().equals(prefs.getString("scope", ""))) {
                prefs.edit().putString("scope", scope.toString()).remove("snapshot").commit();
                JSONObject disconnected = new JSONObject().put("version", WearProtocol.VERSION).put("scope", scope.toString()).put("ready", false);
                publish(disconnected);
            }
            return scope.toString();
        }
    }
    void publish(JSONObject snapshot) throws JSONException {
        synchronized (LOCK) {
            if (!snapshot.optString("scope").equals(prefs.getString("scope", ""))) return;
            JSONObject copy = new JSONObject(snapshot.toString()).put("updatedAt", System.currentTimeMillis());
            if (copy.optBoolean("ready")) {
                JSONArray definitions = new JSONArray();
                JSONArray exercises = copy.optJSONArray("exercises");
                if (exercises != null) for (int i = 0; i < exercises.length(); i++) {
                    JSONObject definition = new JSONObject(exercises.getJSONObject(i).toString());
                    definition.remove("count"); definitions.put(definition);
                }
                try {
                    byte[] hash = MessageDigest.getInstance("SHA-256").digest((copy.optString("scope") + copy.optString("date") + definitions).getBytes(StandardCharsets.UTF_8));
                    StringBuilder id = new StringBuilder(); for (byte b : hash) id.append(String.format("%02x", b));
                    copy.put("catalogId", id.toString());
                } catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
            }
            save("snapshot", copy);
            if (copy.optBoolean("ready")) {
                JSONObject catalogs = read("catalogs");
                catalogs.put(copy.getString("catalogId"), copy);
                // Keep historical targets until their watch operations have been imported.
                save("catalogs", catalogs);
            }
            WearProtocol.put(context, WearProtocol.SNAPSHOT, copy)
                .addOnFailureListener(error -> Log.d("OneUpWear", "Snapshot queued locally; retry on resume", error));
        }
    }
    void recoverPending() {
        Wearable.getDataClient(context).getDataItems().addOnSuccessListener(items -> {
            try {
                for (var item : items) if (item.getUri().getPath() != null && item.getUri().getPath().startsWith(WearProtocol.OPERATIONS)) {
                    receive(item.getUri(), WearProtocol.read(item));
                }
            } catch (Exception error) { Log.w("OneUpWear", "Cannot recover watch inbox", error); }
            finally { items.release(); }
        }).addOnFailureListener(error -> Log.d("OneUpWear", "Inbox recovery will retry", error));
    }
    void republish() {
        synchronized (LOCK) {
            JSONObject data = read("snapshot");
            if (data.optInt("version") == WearProtocol.VERSION) WearProtocol.put(context, WearProtocol.SNAPSHOT, data)
                .addOnFailureListener(error -> Log.d("OneUpWear", "Phone snapshot unavailable", error));
        }
    }
    void receive(Uri uri, JSONObject operation) throws JSONException {
        synchronized (LOCK) {
            if (!uri.getPath().startsWith(WearProtocol.OPERATIONS)) return;
            JSONObject inbox = read("inbox");
            inbox.put(uri.toString(), operation);
            save("inbox", inbox);
        }
        context.sendBroadcast(new Intent(CHANGED).setPackage(context.getPackageName()));
    }
    JSONArray pending(String scope) throws JSONException {
        synchronized (LOCK) {
            JSONObject inbox = read("inbox"), catalogs = read("catalogs");
            JSONArray result = new JSONArray();
            for (var keys = inbox.keys(); keys.hasNext();) {
                String uri = keys.next();
                JSONObject operation = inbox.getJSONObject(uri);
                if (!scope.equals(operation.optString("scope"))) continue;
                JSONObject catalog = catalogs.optJSONObject(operation.optString("catalogId"));
                result.put(new JSONObject().put("uri", uri).put("operation", operation).put("catalog", catalog));
            }
            return result;
        }
    }
    void acknowledge(JSONArray uris) {
        synchronized (LOCK) {
            JSONObject inbox = read("inbox");
            for (int i = 0; i < uris.length(); i++) {
                String uri = uris.optString(i);
                if (!inbox.has(uri)) continue;
                inbox.remove(uri);
                Wearable.getDataClient(context).deleteDataItems(Uri.parse(uri))
                    .addOnFailureListener(error -> Log.d("OneUpWear", "Receipt will deduplicate retry", error));
            }
            save("inbox", inbox);
        }
    }
}
