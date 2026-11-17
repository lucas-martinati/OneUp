package com.lucasm548.oneup.wearbridge;

import android.content.Context;
import android.util.Log;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.Wearable;
import org.json.JSONException;
import org.json.JSONObject;

public final class WearProtocol {
    public static final int VERSION = 1;
    public static final String ROOT = "/oneup/v1/";
    public static final String SNAPSHOT = ROOT + "snapshot";
    public static final String OPERATIONS = ROOT + "operations/";
    public static final String REQUEST = ROOT + "request";
    private WearProtocol() {}

    public static JSONObject read(DataItem item) throws JSONException {
        String raw = DataMapItem.fromDataItem(item).getDataMap().getString("json");
        if (raw == null || raw.length() > 95000) throw new JSONException("Invalid Wear payload");
        JSONObject data = new JSONObject(raw);
        if (data.optInt("version") != VERSION) throw new JSONException("Unsupported Wear protocol");
        return data;
    }

    public static Task<DataItem> put(Context context, String path, JSONObject data) {
        PutDataMapRequest request = PutDataMapRequest.create(path);
        request.getDataMap().putString("json", data.toString());
        return Wearable.getDataClient(context).putDataItem(request.asPutDataRequest().setUrgent());
    }

    public static void requestSnapshot(Context context) {
        Wearable.getNodeClient(context).getConnectedNodes().addOnSuccessListener(nodes -> {
            for (var node : nodes) {
                Wearable.getMessageClient(context).sendMessage(node.getId(), REQUEST, new byte[0])
                    .addOnFailureListener(error -> Log.d("OneUpWear", "Phone not connected", error));
            }
        }).addOnFailureListener(error -> Log.d("OneUpWear", "Wear network unavailable", error));
    }
}
