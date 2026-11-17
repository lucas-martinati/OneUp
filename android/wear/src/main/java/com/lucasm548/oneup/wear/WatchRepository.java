package com.lucasm548.oneup.wear;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.android.gms.wearable.Wearable;
import com.lucasm548.oneup.wearbridge.WearProtocol;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.UUID;

/** Watch-owned immutable operations; phone-owned authoritative snapshots. */
public final class WatchRepository {
    private static final Object LOCK = new Object();
    private final Context context;
    final SharedPreferences prefs;
    public WatchRepository(Context context) {
        this.context = context.getApplicationContext();
        prefs = context.getSharedPreferences("oneup_watch", Context.MODE_PRIVATE);
    }
    private JSONObject object(String key) {
        try { return new JSONObject(prefs.getString(key, "{}")); }
        catch (JSONException error) { return new JSONObject(); }
    }
    private JSONArray array(String key) {
        try { return new JSONArray(prefs.getString(key, "[]")); }
        catch (JSONException error) { return new JSONArray(); }
    }
    public JSONObject snapshot() { return object("snapshot"); }
    public String scope() { return snapshot().optString("scope"); }
    public boolean ready() { return snapshot().optBoolean("ready") && snapshot().optLong("expiresAt") > System.currentTimeMillis(); }
    public JSONObject session() { return object("session_" + scope()); }
    public JSONObject summary() { return object("summary_" + scope()); }
    public JSONArray pending() { return array("pending_" + scope()); }
    public JSONObject exercise(String id) {
        JSONArray list = snapshot().optJSONArray("exercises");
        if (list != null) for (int i = 0; i < list.length(); i++) {
            JSONObject ex = list.optJSONObject(i);
            if (ex != null && id.equals(ex.optString("id"))) return ex;
        }
        return null;
    }
    public List<JSONObject> categories() {
        List<JSONObject> result = new ArrayList<>();
        JSONArray list = snapshot().optJSONArray("categories");
        if (list != null) for (int i = 0; i < list.length(); i++) if (list.optJSONObject(i) != null) result.add(list.optJSONObject(i));
        return result;
    }
    public List<JSONObject> exercises(String category) {
        List<JSONObject> result = new ArrayList<>();
        JSONArray list = snapshot().optJSONArray("exercises");
        if (list != null) for (int i = 0; i < list.length(); i++) {
            JSONObject ex = list.optJSONObject(i);
            if (ex != null && category.equals(ex.optString("categoryId"))) result.add(ex);
        }
        return result;
    }
    public int count(JSONObject exercise) {
        synchronized (LOCK) {
        int count = exercise.optInt("count");
        JSONArray pending = pending();
        String date = snapshot().optString("date");
        for (int i = 0; i < pending.length(); i++) {
            JSONObject op = pending.optJSONObject(i);
            if (op != null && "count".equals(op.optString("type")) && date.equals(op.optString("date"))
                && exercise.optString("id").equals(op.optString("exerciseId"))) count += op.optInt("delta");
        }
        return Math.max(0, Math.min(exercise.optInt("goal", 1), count));
    
        }
    }
    public void accept(JSONObject incoming) throws JSONException {
        synchronized (LOCK) {
            if (incoming.optLong("updatedAt") < snapshot().optLong("updatedAt")) return;
            String scope = incoming.getString("scope");
            JSONArray pending = array("pending_" + scope), remaining = new JSONArray();
            JSONObject receipts = incoming.optJSONObject("receipts");
            for (int i = 0; i < pending.length(); i++) {
                JSONObject op = pending.getJSONObject(i);
                if (op.optLong("sequence") > (receipts == null ? 0 : receipts.optLong(op.optString("device")))) remaining.put(op);
            }
            SharedPreferences.Editor edit = prefs.edit().putString("snapshot", incoming.toString()).putString("pending_" + scope, remaining.toString());
            JSONObject mobile = incoming.optJSONObject("session"), local = object("session_" + scope);
            if (incoming.optBoolean("ready") && local.length() == 0 && mobile != null
                && !mobile.optString("id").equals(prefs.getString("finished_" + scope, ""))) {
                edit.putString("session_" + scope, new JSONObject(mobile.toString()).put("origin", "phone").put("catalogId", incoming.optString("catalogId")).toString());
            } else if (incoming.optBoolean("ready") && (local.optString("id").equals(incoming.optString("lastFinishedSessionId", "-")) || ("phone".equals(local.optString("origin")) && mobile == null))) {
                edit.remove("session_" + scope).putString("finished_" + scope, local.optString("id"));
            }
            if (!edit.commit()) throw new IllegalStateException("Cannot persist phone snapshot");
        }
    }
    private void append(JSONObject operation, JSONObject session, JSONObject summary) throws JSONException {
        synchronized (LOCK) {
            String scope = scope();
            if (scope.isEmpty()) throw new IllegalStateException("Phone not configured");
            String deviceKey = "device_" + scope;
            String device = prefs.getString(deviceKey, UUID.randomUUID().toString());
            long sequence = prefs.getLong("sequence_" + scope, 0) + 1;
            operation.put("version", WearProtocol.VERSION).put("scope", scope).put("device", device).put("sequence", sequence)
                .put("occurredAt", System.currentTimeMillis()).put("localHour", Calendar.getInstance().get(Calendar.HOUR_OF_DAY));
            if (!operation.has("catalogId")) operation.put("catalogId", snapshot().optString("catalogId"));
            if (!operation.has("date")) operation.put("date", snapshot().optString("date"));
            JSONArray pending = pending(); pending.put(operation);
            SharedPreferences.Editor edit = prefs.edit().putString(deviceKey, device).putLong("sequence_" + scope, sequence).putString("pending_" + scope, pending.toString());
            if (session != null) edit.putString("session_" + scope, session.toString());
            if (summary != null) edit.putString("summary_" + scope, summary.toString()).remove("session_" + scope).putString("finished_" + scope, operation.optString("sessionId"));
            if (!edit.commit()) throw new IllegalStateException("Cannot save watch operation");
            publish(operation);
        }
    }
    private void publish(JSONObject op) {
        WearProtocol.put(context, WearProtocol.OPERATIONS + op.optString("device") + "/" + op.optLong("sequence"), op)
            .addOnFailureListener(error -> Log.d("OneUpWear", "Operation retained for retry", error));
    }
    public void retry() {
        JSONArray pending = pending();
        for (int i = 0; i < pending.length(); i++) if (pending.optJSONObject(i) != null) publish(pending.optJSONObject(i));
        WearProtocol.requestSnapshot(context);
        Wearable.getDataClient(context).getDataItems().addOnSuccessListener(items -> {
            try { for (var item : items) if (WearProtocol.SNAPSHOT.equals(item.getUri().getPath())) accept(WearProtocol.read(item)); }
            catch (Exception error) { Log.w("OneUpWear", "Cannot restore phone data", error); }
            finally { items.release(); }
        }).addOnFailureListener(error -> Log.d("OneUpWear", "Snapshot will retry", error));
    }
    public void adjust(String id, int delta) throws JSONException { adjust(id, delta, scope()); }
    public void adjust(String id, int delta, String expectedScope) throws JSONException {
        synchronized (LOCK) {
        if (!scope().equals(expectedScope)) throw new IllegalStateException("Account changed");
        JSONObject ex = exercise(id);
        if (!ready() || ex == null || ex.optBoolean("locked")) throw new IllegalStateException("Synchronise OneUp sur le téléphone");
        int before = count(ex), after = Math.max(0, Math.min(ex.optInt("goal"), before + delta));
        if (after != before) append(new JSONObject().put("type", "count").put("exerciseId", id).put("delta", after - before), null, null);
    
        }
    }
    public void start(List<String> selected) throws JSONException {
        synchronized (LOCK) {
        if (!ready() || selected.isEmpty()) return;
        JSONArray queue = new JSONArray();
        for (String id : selected) { JSONObject ex = exercise(id); if (ex != null && !ex.optBoolean("locked")) queue.put(id); }
        if (queue.length() == 0) return;
        JSONObject session = new JSONObject().put("id", UUID.randomUUID().toString()).put("date", snapshot().optString("date"))
            .put("catalogId", snapshot().optString("catalogId")).put("queue", queue).put("index", 0).put("startedAt", System.currentTimeMillis()).put("origin", "watch");
        append(sessionOperation("session_start", session), session, null);
    
        }
    }
    private JSONObject sessionOperation(String type, JSONObject session) throws JSONException {
        return new JSONObject().put("type", type).put("catalogId", session.optString("catalogId", snapshot().optString("catalogId"))).put("sessionId", session.getString("id")).put("date", session.getString("date"))
            .put("queue", session.getJSONArray("queue")).put("startedAt", session.getLong("startedAt"));
    }
    public void navigate(int direction) throws JSONException {
        synchronized (LOCK) {
        JSONObject session = session(); JSONArray queue = session.optJSONArray("queue");
        if (queue == null || queue.length() == 0) return;
        session.put("index", WatchMath.wrap(session.optInt("index"), direction, queue.length()));
        if (!prefs.edit().putString("session_" + scope(), session.toString()).commit()) throw new IllegalStateException("Cannot save position");
    
        }
    }
    public void finish() throws JSONException {
        synchronized (LOCK) {
        JSONObject session = session(); if (session.length() == 0) return;
        JSONObject summary = new JSONObject(session.toString()).put("duration", Math.max(0, (System.currentTimeMillis() - session.optLong("startedAt")) / 1000));
        append(sessionOperation("session_finish", session), null, summary);
    
        }
    }
}
