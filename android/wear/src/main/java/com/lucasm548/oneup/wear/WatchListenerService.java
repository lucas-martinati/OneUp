package com.lucasm548.oneup.wear;
import android.util.Log;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.WearableListenerService;
import com.lucasm548.oneup.wearbridge.WearProtocol;
public class WatchListenerService extends WearableListenerService {
    @Override public void onDataChanged(DataEventBuffer events) {
        WatchRepository repository = new WatchRepository(this);
        for (DataEvent event : events) {
            if (event.getType() != DataEvent.TYPE_CHANGED || !WearProtocol.SNAPSHOT.equals(event.getDataItem().getUri().getPath())) continue;
            try { repository.accept(WearProtocol.read(event.getDataItem())); }
            catch (Exception error) { Log.w("OneUpWear", "Invalid phone snapshot", error); }
        }
    }
}
