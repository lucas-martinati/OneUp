package com.lucasm548.oneup.wear;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import java.io.File;
import java.io.FileOutputStream;
import java.time.Duration;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=35,qualifiers="w225dp-h225dp-round-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class WatchActivityTest {
    private View find(View root, String label) {
        if (label.contentEquals(root.getContentDescription() == null ? "" : root.getContentDescription())) return root;
        if (root instanceof ViewGroup) {
            for (int i = 0; i < ((ViewGroup) root).getChildCount(); i++) {
                View child = find(((ViewGroup) root).getChildAt(i), label);
                if (child != null) return child;
            }
        }
        return null;
    }

    private void layoutWatch(View root) {
        root.measure(View.MeasureSpec.makeMeasureSpec(450, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(450, View.MeasureSpec.EXACTLY));
        root.layout(0, 0, 450, 450);
        shadowOf(Looper.getMainLooper()).idle();
    }

    private void screenshot(View root, String name) throws Exception {
        layoutWatch(root);
        Bitmap bitmap = Bitmap.createBitmap(450, 450, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Path clip = new Path();
        clip.addCircle(225f, 225f, 224f, Path.Direction.CW);
        canvas.save();
        canvas.clipPath(clip);
        root.draw(canvas);
        canvas.restore();
        Paint bezel = new Paint(Paint.ANTI_ALIAS_FLAG);
        bezel.setStyle(Paint.Style.STROKE);
        bezel.setStrokeWidth(2f);
        bezel.setColor(0x33ffffff);
        canvas.drawCircle(225f, 225f, 224f, bezel);

        File directory = new File("build/test-previews");
        directory.mkdirs();
        try (FileOutputStream output = new FileOutputStream(new File(directory, name + ".png"))) {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
        }
    }

    @Test public void nativeScreensRenderCleanlyAndSupportRoutinesPlusOneAndLiveTimers() throws Exception {
        java.util.Locale.setDefault(java.util.Locale.FRANCE);
        Context context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("oneup_watch", Context.MODE_PRIVATE).edit().clear().commit();
        WatchRepository repository = new WatchRepository(context);

        // 1. Unsynced initial screen
        var syncController = Robolectric.buildActivity(WatchActivity.class).setup();
        View syncRoot = ((ViewGroup) syncController.get().findViewById(android.R.id.content)).getChildAt(0);
        screenshot(syncRoot, "after_01_sync");
        assertNotNull(find(syncRoot, "Synchroniser"));
        syncController.pause().stop().destroy();

        // 2. Populate realistic 6-exercise snapshot with 2-line titles, timer exercise, weight & routines
        JSONObject snapshot = WatchRepositoryTest.snapshot("test", 32, 1);
        JSONArray exercises = snapshot.getJSONArray("exercises");
        exercises.getJSONObject(1).put("count", 20);
        exercises.put(new JSONObject().put("id", "pullups").put("name", "Tractions").put("count", 14).put("goal", 20).put("icon", "ArrowUp").put("categoryId", "bodyweight").put("color", "#f472b6"));
        exercises.put(new JSONObject().put("id", "abs").put("name", "Abdos").put("count", 50).put("goal", 50).put("icon", "Flame").put("categoryId", "bodyweight").put("color", "#fb923c"));
        exercises.put(new JSONObject().put("id", "jumpingjacks").put("name", "Jumping jacks").put("count", 45).put("goal", 75).put("icon", "Zap").put("categoryId", "bodyweight").put("color", "#facc15"));
        exercises.put(new JSONObject().put("id", "planche").put("name", "Gainage").put("count", 40).put("goal", 100).put("type", "timer").put("icon", "Square").put("categoryId", "bodyweight").put("color", "#38bdf8"));
        snapshot.put("routines", new JSONArray()
            .put(new JSONObject().put("id", "r1").put("name", "Haut du corps").put("exerciseIds", new JSONArray().put("pushups").put("pullups").put("planche")))
            .put(new JSONObject().put("id", "r2").put("name", "Express Jambes").put("exerciseIds", new JSONArray().put("squats").put("jumpingjacks"))));
        repository.accept(snapshot);

        var controller = Robolectric.buildActivity(WatchActivity.class).setup();
        WatchActivity activity = controller.get();
        View root = ((ViewGroup) activity.findViewById(android.R.id.content)).getChildAt(0);
        screenshot(root, "after_02_home");

        // 3. Prepare screen + selection
        View workout = find(root, "Ma séance");
        assertNotNull(workout);
        workout.performClick();
        layoutWatch(root);

        View pushups = find(root, "Ajouter Pompes, 32 / 50");
        assertNotNull(pushups);
        pushups.performClick();
        layoutWatch(root);
        View pullups = find(root, "Ajouter Tractions, 14 / 20");
        assertNotNull(pullups);
        pullups.performClick();
        layoutWatch(root);
        View plank = find(root, "Ajouter Gainage, 40 / 100");
        assertNotNull(plank);
        plank.performClick();
        screenshot(root, "after_03_prepare");

        // 4. Routines screen + 1-tap launch
        View routinesBtn = find(root, "Routines");
        assertNotNull(routinesBtn);
        routinesBtn.performClick();
        screenshot(root, "after_04_routines");

        View launchRoutine = find(root, "Haut du corps (3)");
        assertNotNull(launchRoutine);
        launchRoutine.performClick();
        layoutWatch(root);
        assertEquals(3, repository.session().getJSONArray("queue").length());
        assertEquals("Haut du corps", repository.session().getString("routineName"));

        // 5. Counter session screen (+1 and +5 controls)
        View plusOne = find(root, "+1");
        assertNotNull(plusOne);
        plusOne.performClick();
        assertEquals(33, repository.count(repository.exercise("pushups")));
        screenshot(root, "after_05_session_counter");

        // 6. Navigate to Gainage timer screen & verify live 1s tick
        View prevNeighbor = find(root, "Précédent : Gainage");
        assertNotNull(prevNeighbor);
        prevNeighbor.performClick();
        layoutWatch(root);
        View startChrono = find(root, "Chrono");
        assertNotNull(startChrono);
        startChrono.performClick();
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(3));
        screenshot(root, "after_06_session_timer");
        View pauseChrono = find(root, "Pause");
        assertNotNull(pauseChrono);
        pauseChrono.performClick();
        assertEquals(43, repository.count(repository.exercise("planche")));

        // 7. Rest screen with countdown ring, next preview, and +15s/-15s
        View restBtn = find(root, "Repos");
        assertNotNull(restBtn);
        restBtn.performClick();
        layoutWatch(root);
        View minusRest = find(root, "−15s");
        assertNotNull(minusRest);
        minusRest.performClick();
        screenshot(root, "after_07_rest");

        // 8. Confirm finish screen (simulate 4 min 20 s workout duration)
        JSONObject activeSession = repository.session();
        activeSession.put("startedAt", System.currentTimeMillis() - 260_000L);
        repository.prefs.edit().putString("session_" + repository.scope(), activeSession.toString()).commit();
        View finishBtn = find(root, "Terminer la séance");
        assertNotNull(finishBtn);
        finishBtn.performClick();
        screenshot(root, "after_08_confirm");

        // 9. Summary screen
        View confirmFinish = find(root, "Terminer");
        assertNotNull(confirmFinish);
        confirmFinish.performClick();
        screenshot(root, "after_09_summary");

        controller.pause().stop().destroy();
    }
}
