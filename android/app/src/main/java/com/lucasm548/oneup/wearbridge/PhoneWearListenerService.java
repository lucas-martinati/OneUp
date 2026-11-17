package com.lucasm548.oneup.wearbridge;

import android.util.Log;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

public class PhoneWearListenerService extends WearableListenerService {
    @Override public void onDataChanged(DataEventBuffer events) {
        PhoneWearStore store = new PhoneWearStore(this);
        for (DataEvent event : events) {
            if (event.getType() != DataEvent.TYPE_CHANGED || event.getDataItem().getUri().getPath() == null
                || !event.getDataItem().getUri().getPath().startsWith(WearProtocol.OPERATIONS)) continue;
            try { store.receive(event.getDataItem().getUri(), WearProtocol.read(event.getDataItem())); }
            catch (Exception error) { Log.w("OneUpWear", "Invalid watch operation", error); }
        }
    }
    @Override public void onMessageReceived(MessageEvent event) {
        if (WearProtocol.REQUEST.equals(event.getPath())) new PhoneWearStore(this).republish();
    }
}
