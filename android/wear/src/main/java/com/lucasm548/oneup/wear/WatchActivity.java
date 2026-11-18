package com.lucasm548.oneup.wear;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.ForegroundColorSpan;
import android.text.style.RelativeSizeSpan;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public class WatchActivity extends ComponentActivity implements SharedPreferences.OnSharedPreferenceChangeListener {
    private static final int TEXT = 0xfffaf7ff, MUTED = 0xffc0b5ce, PURPLE = 0xff8b5cf6;
    private static final long DEFAULT_REST_MS = 45_000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WatchRepository repository;
    private FrameLayout root;
    private WatchFace face;
    private OnBackPressedCallback backCallback;

    private String page = "home", quickId = "", account = "";
    private int category = 0, gridPage = 0, routinePage = 0;
    private final LinkedHashSet<String> selected = new LinkedHashSet<>();
    private float scale = 1f, offsetX, offsetY, downX, downY;
    private long lastWheel, timerStarted, timerCommitted, restUntil, restTotalMs = DEFAULT_REST_MS;
    private String timerExercise = "", timerScope = "";
    private int lastTimerLevel = -1;
    private boolean timerRunning, restAlerted, suppressPrefsRender;

    // Live references updated in-place on 1s ticks to avoid tearing down View hierarchy
    private TextView liveClockView, liveMetricView, liveLevelTextView, liveRestTimerView;
    private View liveMedalView;

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (liveClockView != null) {
                liveClockView.setText(clockText());
            }
            if (!repository.ready()) {
                handler.postDelayed(this, 1000);
                return;
            }
            if (timerRunning) {
                updateLiveTimerTick();
            }
            if ("rest".equals(page)) {
                updateLiveRestTick();
            }
            handler.postDelayed(this, 1000);
        }
    };

    private String clockText() {
        return android.text.format.DateFormat.format("HH:mm", new Date()).toString();
    }

    private String s(String key, String fr, String en) {
        return repository.str(key, fr, en);
    }

    private void pulseWrist(boolean doublePulse) {
        if (root != null) {
            root.performHapticFeedback(doublePulse ? HapticFeedbackConstants.LONG_PRESS : HapticFeedbackConstants.CLOCK_TICK);
        }
        try {
            Vibrator vibrator = getSystemService(Vibrator.class);
            if (vibrator != null && vibrator.hasVibrator() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                VibrationEffect effect = doublePulse
                    ? VibrationEffect.createWaveform(new long[]{0, 140, 80, 220}, -1)
                    : VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE);
                vibrator.vibrate(effect);
            }
        } catch (Exception ignored) {}
    }

    private static float computeSubProgress(int count, int goal, int level) {
        if (goal <= 0 || level >= 10) return 0f;
        int prevThreshold = level <= 0 ? 0 : Math.max(1, (int) Math.ceil((double) goal * level / 10.0));
        int nextThreshold = Math.max(1, (int) Math.ceil((double) goal * (level + 1) / 10.0));
        if (nextThreshold <= prevThreshold) return 0f;
        return Math.max(0f, Math.min(1f, (float) (count - prevThreshold) / (nextThreshold - prevThreshold)));
    }

    private SpannableString formatHeroMetric(int count, int goal, boolean timed) {
        String number = String.valueOf(count);
        SpannableString metricValue = new SpannableString(number + " / " + goal + (timed ? " s" : ""));
        metricValue.setSpan(new RelativeSizeSpan(0.38f), number.length(), metricValue.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        metricValue.setSpan(new ForegroundColorSpan(MUTED), number.length(), metricValue.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        return metricValue;
    }

    private String formatLevelCaption(int level) {
        if (level >= 10) return "MAX ✓";
        return (repository.isFrench() ? "Niv. " : "Lvl ") + level + " / 10";
    }

    private void updateLiveTimerTick() {
        JSONObject ex = repository.exercise(timerExercise);
        if (ex == null) {
            flushTimer(true);
            render();
            return;
        }
        int goal = ex.optInt("goal", 1);
        long elapsedSec = (SystemClock.elapsedRealtime() - timerStarted) / 1000;
        long uncommitted = Math.max(0L, elapsedSec - timerCommitted);
        int liveCount = Math.min(goal, repository.count(ex) + (int) uncommitted);
        int liveLevel = WatchMath.level(liveCount, goal);

        if (lastTimerLevel >= 0 && liveLevel > lastTimerLevel) {
            pulseWrist(liveLevel >= 10);
        }
        lastTimerLevel = liveLevel;

        if (liveCount >= goal) {
            flushTimer(true);
            render();
            return;
        }
        if (uncommitted >= 5) {
            suppressPrefsRender = true;
            try { flushTimer(false); }
            finally { suppressPrefsRender = false; }
        }
        if (("work".equals(page) || "quick".equals(page)) && liveMetricView != null && face != null) {
            liveMetricView.setText(formatHeroMetric(liveCount, goal, true));
            face.level = liveLevel;
            face.subProgress = computeSubProgress(liveCount, goal, liveLevel);
            face.invalidate();
            if (liveLevelTextView != null) {
                liveLevelTextView.setText(formatLevelCaption(liveLevel));
                liveLevelTextView.setTextColor(liveLevel >= 10 ? 0xfffbbf24 : color(ex));
            }
            if (liveMedalView != null) liveMedalView.invalidate();
        }
    }

    private void updateLiveRestTick() {
        long now = System.currentTimeMillis();
        long remainingMs = Math.max(0L, restUntil - now);
        long remainingSec = (remainingMs + 999L) / 1000L;
        if (restUntil > 0 && now >= restUntil && !restAlerted) {
            restAlerted = true;
            pulseWrist(true);
            syncKeepScreenOn();
        }
        if (liveRestTimerView != null) {
            liveRestTimerView.setText(String.format(Locale.ROOT, "%02d:%02d", remainingSec / 60, remainingSec % 60));
            liveRestTimerView.setTextColor(remainingSec == 0 ? 0xff34d399 : TEXT);
        }
        if (face != null) {
            face.restProgress = restTotalMs > 0 ? Math.max(0f, Math.min(1f, (float) remainingMs / restTotalMs)) : 0f;
            face.invalidate();
        }
    }

    private void syncKeepScreenOn() {
        boolean keepAwake = timerRunning || ("rest".equals(page) && restUntil > System.currentTimeMillis());
        if (keepAwake) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        repository = new WatchRepository(this);
        WatchFace.font(this, 500);
        root = new FrameLayout(this) {
            @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) {
                super.onSizeChanged(w, h, oldw, oldh);
                post(WatchActivity.this::render);
            }
        };
        root.setBackgroundColor(Color.BLACK);
        root.setFocusable(true);
        setContentView(root);
        backCallback = new OnBackPressedCallback(false) {
            @Override public void handleOnBackPressed() {
                flushTimer(true);
                page = "routines".equals(page) ? "prepare" : "home";
                render();
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
        if (getWindow().getInsetsController() != null) {
            getWindow().getInsetsController().hide(WindowInsets.Type.systemBars());
        }
        if (state != null) {
            page = state.getString("page", "home");
            quickId = state.getString("quickId", "");
            category = state.getInt("category");
            gridPage = state.getInt("gridPage");
            routinePage = state.getInt("routinePage");
        }
    }

    @Override protected void onResume() {
        super.onResume();
        repository.prefs.registerOnSharedPreferenceChangeListener(this);
        repository.retry();
        restUntil = repository.prefs.getLong("restUntil", 0);
        restTotalMs = Math.max(15_000L, repository.prefs.getLong("restTotalMs", DEFAULT_REST_MS));
        syncKeepScreenOn();
        handler.removeCallbacks(tick);
        handler.post(tick);
        render();
    }

    @Override protected void onPause() {
        flushTimer(true);
        handler.removeCallbacks(tick);
        repository.prefs.unregisterOnSharedPreferenceChangeListener(this);
        super.onPause();
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        out.putString("page", page);
        out.putString("quickId", quickId);
        out.putInt("category", category);
        out.putInt("gridPage", gridPage);
        out.putInt("routinePage", routinePage);
        super.onSaveInstanceState(out);
    }

    @Override public void onSharedPreferenceChanged(SharedPreferences prefs, String key) {
        if (suppressPrefsRender) return;
        handler.post(this::render);
    }

    private interface Action { void run() throws Exception; }

    private void act(Action action) {
        try {
            if (!account.equals(repository.scope())) throw new IllegalStateException("Account changed");
            action.run();
            root.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            render();
        } catch (Exception error) {
            Toast.makeText(this, repository.isFrench()
                ? "Échec de l’action. Réessaie après synchronisation."
                : "Check watch synchronization and try again.", Toast.LENGTH_LONG).show();
        }
    }

    private int color(JSONObject object) {
        if (object == null) return repository.themeAccent();
        try { return Color.parseColor(object.optString("color", "#818cf8")); }
        catch (IllegalArgumentException error) { return repository.themeAccent(); }
    }

    private TextView text(String value, float size, int color) {
        return text(value, size, color, 500);
    }

    private TextView text(String value, float size, int color, int weight) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setGravity(Gravity.CENTER);
        view.setTextColor(color);
        view.setTypeface(WatchFace.font(this, weight));
        view.setIncludeFontPadding(false);
        float minPx = 8.5f * getResources().getDisplayMetrics().scaledDensity;
        view.setTextSize(TypedValue.COMPLEX_UNIT_PX, Math.max(size * scale, minPx));
        return view;
    }

    private GradientDrawable background(int color, int radius, boolean primary) {
        int dark = Color.rgb(Color.red(color) / 5 + 6, Color.green(color) / 5 + 5, Color.blue(color) / 5 + 10);
        GradientDrawable drawable = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            primary ? new int[]{color, dark} : new int[]{dark, 0xff0d0a14}
        );
        drawable.setCornerRadius(radius * scale);
        drawable.setStroke(Math.max(1, Math.round(scale)), primary ? 0x66ffffff : ((color & 0x00ffffff) | 0x55000000));
        return drawable;
    }

    private ImageView icon(String name, int color, float size) {
        ImageView view = new ImageView(this);
        view.setImageResource(WatchIcons.resource(name));
        view.setImageTintList(ColorStateList.valueOf(color));
        view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        view.setLayoutParams(new LinearLayout.LayoutParams(Math.round(size * scale), Math.round(size * scale)));
        return view;
    }

    private void place(View view, float x, float y, float width, float height) {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(Math.round(width * scale), Math.round(height * scale));
        params.leftMargin = Math.round(offsetX + x * scale);
        params.topMargin = Math.round(offsetY + y * scale);
        root.addView(view, params);
    }

    private LinearLayout button(String label, String iconName, int color, boolean primary, Action action) {
        LinearLayout view = new LinearLayout(this) {
            @Override public CharSequence getAccessibilityClassName() { return "android.widget.Button"; }
        };
        view.setGravity(Gravity.CENTER);
        view.setOrientation(LinearLayout.HORIZONTAL);
        int pad = Math.max(2, Math.round(3 * scale));
        view.setPadding(pad, 2, pad, 2);
        view.setBackground(background(color, 14, primary));
        view.setFocusable(true);
        view.setClickable(true);
        view.setContentDescription(label);
        if (iconName != null) {
            view.addView(icon(iconName, primary ? TEXT : color, 13.5f));
        }
        if (!label.isEmpty()) {
            TextView title = text(label, 11.5f, TEXT, 600);
            title.setSingleLine(true);
            title.setEllipsize(TextUtils.TruncateAt.END);
            if (iconName != null) title.setPadding(Math.max(2, Math.round(3.5f * scale)), 0, 0, 0);
            view.addView(title);
        }
        view.setOnClickListener(v -> act(action));
        return view;
    }

    private void circleIconButton(String iconName, String description, int color, float x, float y, float size, boolean tintedSurface, Action action) {
        LinearLayout btn = button("", iconName, color, false, action);
        btn.setContentDescription(description);
        if (tintedSurface) {
            GradientDrawable bg = new GradientDrawable();
            bg.setShape(GradientDrawable.OVAL);
            bg.setColor(0x22ffffff);
            bg.setStroke(Math.max(1, Math.round(scale)), (color & 0x00ffffff) | 0x44000000);
            btn.setBackground(bg);
        } else {
            btn.setBackgroundColor(Color.TRANSPARENT);
        }
        place(btn, x, y, size, size);
    }

    private void render() {
        if (root.getWidth() == 0) return;
        liveClockView = null;
        liveMetricView = null;
        liveLevelTextView = null;
        liveRestTimerView = null;
        liveMedalView = null;

        String scope = repository.scope();
        if (!scope.equals(account)) {
            account = scope;
            selected.clear();
            category = 0;
            gridPage = 0;
            routinePage = 0;
            page = "home";
            timerRunning = false;
            try {
                JSONArray saved = new JSONArray(repository.prefs.getString("selection_" + scope, "[]"));
                for (int i = 0; i < saved.length(); i++) selected.add(saved.getString(i));
            } catch (Exception ignored) {
                selected.clear();
            }
        }
        syncKeepScreenOn();

        scale = Math.min(root.getWidth(), root.getHeight()) / 276f;
        offsetX = (root.getWidth() - 276f * scale) / 2f;
        offsetY = (root.getHeight() - 276f * scale) / 2f;

        int accent = repository.themeAccent();
        root.removeAllViews();
        face = new WatchFace(this);
        face.themeAccent = accent;
        face.accent = accent;
        root.addView(face, new FrameLayout.LayoutParams(-1, -1));

        boolean inRingScreen = repository.ready() && ("work".equals(page) || "quick".equals(page) || "rest".equals(page));
        if (!inRingScreen) {
            LinearLayout topClockRow = new LinearLayout(this);
            topClockRow.setGravity(Gravity.CENTER);
            liveClockView = text(clockText(), 10.5f, MUTED, 600);
            topClockRow.addView(liveClockView);
            if (repository.ready() && repository.pending().length() > 0) {
                TextView dot = text(" •", 11.5f, 0xfffbbf24, 800);
                dot.setContentDescription(s("waitingSync", "En attente de synchronisation", "Waiting to sync"));
                topClockRow.addView(dot);
            }
            place(topClockRow, 92, 5, 92, 15);
        }

        if (!repository.ready()) {
            backCallback.setEnabled(false);
            syncScreen();
            return;
        }

        if (("work".equals(page) || "rest".equals(page) || "confirm".equals(page)) && repository.session().length() == 0) {
            page = "home";
        }

        switch (page) {
            case "prepare": home(true); break;
            case "routines": routinesScreen(); break;
            case "work":
            case "quick": panel(); break;
            case "rest": rest(); break;
            case "confirm": confirm(); break;
            case "summary": summary(); break;
            default: home(false);
        }
        backCallback.setEnabled(!"home".equals(page));
        face.invalidate();
    }

    private void syncScreen() {
        int accent = repository.themeAccent();
        face.title = "ONEUP";
        place(icon("Watch", accent, 26), 125, 48, 26, 26);
        place(text(s("openOnPhone", "Ouvre OneUp\nsur ton téléphone", "Open OneUp\non your phone"), 17f, TEXT, 700), 34, 78, 208, 54);
        place(text(s("syncSubtitle", "Pour synchroniser les exercices\net la progression du jour", "Sync today's exercises\nand progress"), 11.5f, MUTED), 34, 136, 208, 36);
        place(button(s("syncBtn", "Synchroniser", "Sync"), "RefreshCw", accent, true, () -> repository.retry()), 64, 182, 148, 36);
    }

    private List<JSONObject> currentExercises() {
        List<JSONObject> cats = repository.categories();
        if (cats.isEmpty()) return new ArrayList<>();
        category = Math.max(0, Math.min(category, cats.size() - 1));
        return repository.exercises(cats.get(category).optString("id"));
    }

    private int pageSize() {
        return root.getWidth() / getResources().getDisplayMetrics().density >= 210 ? 6 : 4;
    }

    private void home(boolean picking) {
        List<JSONObject> cats = repository.categories();
        if (cats.isEmpty()) { syncScreen(); return; }
        List<JSONObject> exercises = currentExercises();
        JSONObject cat = cats.get(category);
        int accent = repository.themeAccent();
        int accent2 = repository.themeAccent2();

        face.title = picking ? s("myWorkout", "Ma séance", "My workout").toUpperCase(Locale.getDefault()) : "ONEUP";
        // Hide bottom curved text on Prepare so bottom bar has clean space inside round bezel
        face.category = picking ? "" : cat.optString("name");
        face.categoryColor = color(cat);

        if (picking) {
            List<JSONObject> routines = repository.routines();
            if (!routines.isEmpty()) {
                LinearLayout routineBtn = button(s("routines", "Routines", "Routines"), "Bookmark", accent, false, () -> {
                    routinePage = 0;
                    page = "routines";
                });
                place(routineBtn, 50, 48, 88, 22);
                place(text(selected.size() + " " + s("selectedSuffix", "choisis", "selected"), 11f, accent2, 600), 140, 48, 86, 22);
            } else {
                place(text(selected.size() + " " + s("selectedSuffix", "choisis", "selected"), 11f, accent2, 600), 48, 48, 88, 22);
                place(text(cat.optString("name"), 11f, color(cat), 600), 138, 48, 90, 22);
            }
        } else {
            boolean frozen = repository.snapshot().optBoolean("streakFrozen");
            boolean activeStreak = repository.snapshot().optBoolean("streakActive");
            int flameColor = frozen ? 0xff38bdf8 : (activeStreak ? 0xfffb923c : 0xccf59e0b);
            LinearLayout streak = new LinearLayout(this);
            streak.setGravity(Gravity.CENTER);
            streak.addView(icon(frozen ? "Snowflake" : "Flame", flameColor, 13));
            streak.addView(text(" " + repository.snapshot().optInt("streak"), 12f, flameColor, 700));
            place(streak, 44, 47, 72, 22);

            String dayWord = s("day", "Jour", "Day").toUpperCase(Locale.getDefault());
            place(text(dayWord + " " + repository.snapshot().optInt("day"), 11f, accent2, 700), 150, 47, 82, 22);
        }

        if (cat.optBoolean("locked")) {
            place(icon("Lock", accent, 22), 127, 84, 22, 22);
            place(text(s("proRequired", "Disponible avec OneUp Pro", "Available with OneUp Pro"), 15f, TEXT, 700), 36, 108, 204, 38);
            place(text(s("activateOnPhone", "À activer sur le téléphone", "Activate on your phone"), 11.5f, MUTED), 36, 148, 204, 28);
        } else if (exercises.isEmpty()) {
            place(text(s("noExercises", "Aucun exercice", "No exercises"), 16.5f, TEXT, 700), 40, 104, 196, 32);
            place(text(s("addOnPhone", "Ajoute-les sur ton téléphone", "Add them on your phone"), 11.5f, MUTED), 40, 140, 196, 30);
        } else {
            int size = pageSize();
            int pages = (exercises.size() + size - 1) / size;
            gridPage = Math.floorMod(gridPage, pages);
            int start = gridPage * size;
            int end = Math.min(start + size, exercises.size());
            int cols = size / 2;

            String subHeader = (start + 1) + "–" + end + " / " + exercises.size()
                + (picking ? " • " + cat.optString("name") : "");
            TextView pager = text(subHeader, 10f, MUTED, 600);
            pager.setSingleLine(true);
            pager.setEllipsize(TextUtils.TruncateAt.END);
            place(pager, 52, 71, 172, 14);

            float gridWidth = 232f;
            float gap = 5f;
            float tileWidth = (gridWidth - (cols - 1) * gap) / cols;
            float tileHeight = size == 6 ? 51f : 55f;
            List<String> orderedSelection = new ArrayList<>(selected);

            for (int i = start; i < end; i++) {
                JSONObject ex = exercises.get(i);
                String id = ex.optString("id");
                int c = color(ex);
                int count = repository.count(ex);
                int goal = ex.optInt("goal", 1);
                int lvl = WatchMath.level(count, goal);
                boolean chosen = selected.contains(id);

                String metaText = picking && chosen
                    ? "#" + (orderedSelection.indexOf(id) + 1) + " ✓"
                    : count + "/" + goal + ("timer".equals(ex.optString("type")) ? "s" : "");

                WatchTileView tile = new WatchTileView(
                    this, ex.optString("icon"), ex.optString("name"), metaText, c, lvl, picking && chosen, scale
                );
                String actionVerb = picking
                    ? (chosen ? (repository.isFrench() ? "Retirer " : "Remove ") : (repository.isFrench() ? "Ajouter " : "Add "))
                    : (repository.isFrench() ? "Ouvrir " : "Open ");
                tile.setContentDescription(actionVerb + ex.optString("name") + ", " + count + " / " + goal);
                tile.setSelected(chosen);
                tile.setOnClickListener(v -> act(() -> {
                    if (picking) {
                        if (!selected.remove(id)) selected.add(id);
                        repository.prefs.edit().putString("selection_" + account, new JSONArray(selected).toString()).apply();
                    } else {
                        quickId = id;
                        page = "quick";
                    }
                }));

                int cell = i - start;
                float tx = 22f + (cell % cols) * (tileWidth + gap);
                float ty = 86f + (cell / cols) * (tileHeight + gap);
                place(tile, tx, ty, tileWidth, tileHeight);
            }
        }

        if (picking) {
            // Safe inside round bezel: corners inside radius 132 < 138
            circleIconButton("ArrowLeft", s("home", "Accueil", "Home"), MUTED, 50, 196, 36, true, () -> page = "home");
            String startLabel = s("startWorkout", "Démarrer la séance", "Start workout");
            String shortCta = selected.isEmpty()
                ? "0 " + s("selectedSuffix", "choisis", "selected")
                : (repository.isFrench() ? "Démarrer (" : "Start (") + selected.size() + ")";
            LinearLayout startBtn = button(shortCta, "Play", accent, true, () -> {
                repository.start(new ArrayList<>(selected));
                page = "work";
            });
            startBtn.setContentDescription(startLabel);
            startBtn.setEnabled(!selected.isEmpty());
            startBtn.setAlpha(selected.isEmpty() ? 0.38f : 1f);
            place(startBtn, 92, 196, 134, 36);
        } else {
            boolean active = repository.session().length() > 0;
            String mainCta = active ? s("resume", "Reprendre", "Resume") : s("myWorkout", "Ma séance", "My workout");
            LinearLayout workoutBtn = button(mainCta, active ? "Play" : "ListPlus", accent, true, () -> page = active ? "work" : "prepare");
            workoutBtn.setContentDescription(mainCta);
            place(workoutBtn, 72, 196, 132, 34);
            circleIconButton("ChevronUp", repository.isFrench() ? "Catégorie précédente" : "Previous category", MUTED, 34, 196, 34, false, () -> changeCategory(-1));
            circleIconButton("ChevronDown", repository.isFrench() ? "Catégorie suivante" : "Next category", MUTED, 208, 196, 34, false, () -> changeCategory(1));
        }
    }

    private void routinesScreen() {
        int accent = repository.themeAccent();
        face.title = s("routines", "Mes Routines", "My Routines").toUpperCase(Locale.getDefault());
        List<JSONObject> routines = repository.routines();
        if (routines.isEmpty()) {
            place(text(s("noRoutines", "Crée tes routines sur le téléphone", "Save routines on your phone"), 14.5f, MUTED), 38, 102, 200, 54);
        } else {
            int perPage = 3;
            int pages = (routines.size() + perPage - 1) / perPage;
            routinePage = Math.floorMod(routinePage, pages);
            int start = routinePage * perPage;
            int end = Math.min(start + perPage, routines.size());
            if (pages > 1) {
                place(text((routinePage + 1) + " / " + pages, 10f, MUTED, 600), 108, 48, 60, 14);
            }
            for (int i = start; i < end; i++) {
                JSONObject r = routines.get(i);
                String name = r.optString("name");
                JSONArray exIds = r.optJSONArray("exerciseIds");
                List<String> ids = new ArrayList<>();
                if (exIds != null) for (int j = 0; j < exIds.length(); j++) ids.add(exIds.optString(j));

                LinearLayout row = button("", null, accent, false, () -> {
                    repository.start(ids, name);
                    page = "work";
                });
                row.setGravity(Gravity.CENTER_VERTICAL);
                int padH = Math.round(11 * scale);
                row.setPadding(padH, 0, padH, 0);
                row.setContentDescription(name + " (" + ids.size() + ")");

                TextView titleView = text(name, 13f, TEXT, 700);
                titleView.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
                titleView.setSingleLine(true);
                titleView.setEllipsize(TextUtils.TruncateAt.END);
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1f);
                row.addView(titleView, lp);

                TextView countBadge = text(ids.size() + " ex. ", 11f, repository.themeAccent2(), 600);
                row.addView(countBadge);
                row.addView(icon("Play", accent, 14));

                place(row, 36, 66 + (i - start) * 42, 204, 38);
            }
        }
        place(button(s("back", "Retour", "Back"), "ArrowLeft", MUTED, false, () -> page = "prepare"), 83, 197, 110, 34);
    }

    private List<String> panelQueue() {
        List<String> queue = new ArrayList<>();
        if ("quick".equals(page)) {
            JSONObject ex = repository.exercise(quickId);
            if (ex != null) {
                for (JSONObject item : repository.exercises(ex.optString("categoryId"))) {
                    queue.add(item.optString("id"));
                }
            }
        } else {
            JSONArray ids = repository.session().optJSONArray("queue");
            if (ids != null) {
                for (int i = 0; i < ids.length(); i++) {
                    if (repository.exercise(ids.optString(i)) != null) queue.add(ids.optString(i));
                }
            }
        }
        return queue;
    }

    private int panelIndex(List<String> queue) {
        return "quick".equals(page)
            ? Math.max(0, queue.indexOf(quickId))
            : Math.floorMod(repository.session().optInt("index"), Math.max(1, queue.size()));
    }

    private void adjustWithMilestone(JSONObject ex, int delta) throws Exception {
        int goal = ex.optInt("goal", 1);
        int beforeLevel = WatchMath.level(repository.count(ex), goal);
        repository.adjust(ex.optString("id"), delta);
        int afterLevel = WatchMath.level(repository.count(ex), goal);
        if (afterLevel > beforeLevel) {
            pulseWrist(afterLevel >= 10);
        }
    }

    private void panel() {
        List<String> queue = panelQueue();
        if (queue.isEmpty()) {
            if (repository.session().length() > 0) confirm();
            else { page = "home"; home(false); }
            return;
        }
        if (!"quick".equals(page) && !repository.session().optString("date").equals(repository.snapshot().optString("date"))) {
            confirm();
            return;
        }

        int index = panelIndex(queue);
        JSONObject ex = repository.exercise(queue.get(index));
        boolean timed = "timer".equals(ex.optString("type"));
        int goal = ex.optInt("goal", 1);
        int baseCount = repository.count(ex);
        int uncommitted = 0;
        if (timerRunning && ex.optString("id").equals(timerExercise)) {
            uncommitted = (int) Math.max(0L, (SystemClock.elapsedRealtime() - timerStarted) / 1000 - timerCommitted);
        }
        int count = Math.min(goal, baseCount + uncommitted);
        int c = color(ex);
        int lvl = WatchMath.level(count, goal);

        face.accent = c;
        face.level = lvl;
        face.subProgress = computeSubProgress(count, goal, lvl);

        // Top info bar cleanly INSIDE the 10-segment ring
        LinearLayout headerRow = new LinearLayout(this);
        headerRow.setGravity(Gravity.CENTER);
        liveClockView = text(clockText(), 11f, MUTED, 600);
        headerRow.addView(liveClockView);
        headerRow.addView(text("  •  " + (index + 1) + "/" + queue.size(), 11f, c, 700));
        if (repository.pending().length() > 0) {
            TextView dot = text(" •", 11.5f, 0xfffbbf24, 800);
            dot.setContentDescription(s("waitingSync", "En attente de synchronisation", "Waiting to sync"));
            headerRow.addView(dot);
        }
        place(headerRow, 50, 18, 176, 17);

        // Neighbor buttons cleanly inside the ring (r = 126 < 135)
        if (queue.size() > 1) {
            for (int direction : new int[]{-1, 1}) {
                JSONObject neighbor = repository.exercise(queue.get(WatchMath.wrap(index, direction, queue.size())));
                final int delta = direction;
                String prefix = direction < 0
                    ? (repository.isFrench() ? "Précédent : " : "Previous: ")
                    : (repository.isFrench() ? "Suivant : " : "Next: ");
                circleIconButton(
                    neighbor.optString("icon"),
                    prefix + neighbor.optString("name"),
                    color(neighbor),
                    direction < 0 ? 16 : 226,
                    92,
                    32,
                    true,
                    () -> navigate(delta)
                );
            }
        }

        // Exercise title + optional weight badge
        TextView exTitle = text(ex.optString("name"), ex.has("weight") ? 16f : 18.5f, c, 700);
        exTitle.setSingleLine(true);
        exTitle.setEllipsize(TextUtils.TruncateAt.END);
        place(exTitle, 36, 38, 204, 26);

        if (ex.has("weight")) {
            double w = ex.optDouble("weight");
            String wStr = (w == Math.floor(w) ? String.valueOf((int) w) : String.valueOf(w)) + " kg";
            place(text(wStr, 11f, MUTED, 600), 86, 63, 104, 15);
        }

        // Hero count (tappable for +1 on counter exercises)
        liveMetricView = text("", 42f, TEXT, 800);
        liveMetricView.setText(formatHeroMetric(count, goal, timed));
        liveMetricView.setSingleLine(true);
        if (!timed) {
            liveMetricView.setClickable(true);
            liveMetricView.setOnClickListener(v -> act(() -> adjustWithMilestone(ex, 1)));
        }
        place(liveMetricView, 38, ex.has("weight") ? 76 : 69, 200, 48);

        // Genuine OneUp Hexagonal LevelEmblem + level label
        LinearLayout levelRow = new LinearLayout(this);
        levelRow.setGravity(Gravity.CENTER);
        final Typeface medalBold = WatchFace.font(this, 800);
        liveMedalView = new View(this) {
            private final Paint medalPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            private final Path hexPath = new Path();
            @Override protected void onDraw(Canvas canvas) {
                int currentLvl = face != null && face.level >= 0 ? face.level : lvl;
                float r = Math.min(getWidth(), getHeight()) * 0.44f;
                WatchFace.drawHexMedal(canvas, medalPaint, hexPath, medalBold, getWidth() / 2f, getHeight() / 2f, r, currentLvl, c);
            }
        };
        int medalPx = Math.round(22 * scale);
        levelRow.addView(liveMedalView, new LinearLayout.LayoutParams(medalPx, medalPx));
        liveLevelTextView = text(formatLevelCaption(lvl), 12.5f, lvl >= 10 ? 0xfffbbf24 : c, 700);
        liveLevelTextView.setPadding(Math.round(5 * scale), 0, 0, 0);
        levelRow.addView(liveLevelTextView);
        levelRow.setContentDescription((repository.isFrench() ? "Niveau " : "Level ") + lvl + " / 10");
        place(levelRow, 68, 122, 140, 24);

        // Action row (inside ring: corners at r = 123 < 135)
        if (timed) {
            place(button("−5s", null, c, false, () -> {
                flushTimer(true);
                repository.adjust(ex.optString("id"), -5);
            }), 34, 150, 52, 38);

            String chronoLabel = timerRunning ? s("pause", "Pause", "Pause") : s("timer", "Chrono", "Timer");
            place(button(chronoLabel, timerRunning ? "Pause" : "Play", c, true, () -> {
                if (timerRunning) {
                    flushTimer(true);
                } else {
                    timerRunning = true;
                    timerExercise = ex.optString("id");
                    timerScope = account;
                    timerStarted = SystemClock.elapsedRealtime();
                    timerCommitted = 0;
                    lastTimerLevel = WatchMath.level(repository.count(ex), goal);
                    syncKeepScreenOn();
                }
            }), 92, 150, 92, 38);

            place(button("+5s", null, c, false, () -> {
                flushTimer(true);
                adjustWithMilestone(ex, 5);
            }), 190, 150, 52, 38);
        } else {
            place(button("−1", null, c, false, () -> repository.adjust(ex.optString("id"), -1)), 34, 150, 54, 40);
            place(button("+1", null, c, true, () -> adjustWithMilestone(ex, 1)), 94, 150, 74, 40);
            LinearLayout plusFive = button("+5", null, c, true, () -> adjustWithMilestone(ex, 5));
            plusFive.setOnLongClickListener(v -> {
                act(() -> adjustWithMilestone(ex, 10));
                return true;
            });
            place(plusFive, 174, 150, 68, 40);
        }

        // Bottom controls (inside ring)
        if ("quick".equals(page)) {
            circleIconButton("ArrowLeft", s("home", "Accueil", "Home"), MUTED, 82, 195, 34, false, () -> {
                flushTimer(true);
                page = "home";
            });
            circleIconButton("ListPlus", s("myWorkout", "Ma séance", "My workout"), repository.themeAccent(), 158, 195, 34, false, () -> {
                flushTimer(true);
                page = "prepare";
            });
        } else {
            circleIconButton("ArrowLeft", s("home", "Accueil", "Home"), MUTED, 58, 195, 34, false, () -> {
                flushTimer(true);
                page = "home";
            });
            place(button(s("rest", "Repos", "Rest"), "Clock", c, false, () -> {
                flushTimer(true);
                restTotalMs = DEFAULT_REST_MS;
                restUntil = System.currentTimeMillis() + DEFAULT_REST_MS;
                restAlerted = false;
                repository.prefs.edit().putLong("restUntil", restUntil).putLong("restTotalMs", restTotalMs).apply();
                page = "rest";
            }), 98, 196, 80, 32);
            circleIconButton("Flag", s("finishSession", "Terminer la séance", "Finish session"), 0xffe8799a, 184, 195, 34, false, () -> {
                flushTimer(true);
                page = "confirm";
            });
        }
    }

    private void flushTimer(boolean stop) {
        if (!timerRunning) return;
        long seconds = (SystemClock.elapsedRealtime() - timerStarted) / 1000;
        long delta = seconds - timerCommitted;
        if (delta > 0) {
            try {
                repository.adjust(timerExercise, (int) Math.min(3600, delta), timerScope);
                timerCommitted = seconds;
            } catch (Exception error) {
                timerRunning = false;
            }
        }
        if (stop) {
            timerRunning = false;
            lastTimerLevel = -1;
            syncKeepScreenOn();
        }
    }

    private void adjustRest(long deltaMs) {
        long now = System.currentTimeMillis();
        long base = Math.max(now, restUntil);
        restUntil = Math.max(now, base + deltaMs);
        restTotalMs = Math.max(restTotalMs, restUntil - now);
        restAlerted = restUntil <= now;
        repository.prefs.edit().putLong("restUntil", restUntil).putLong("restTotalMs", restTotalMs).apply();
        syncKeepScreenOn();
    }

    private void rest() {
        long now = System.currentTimeMillis();
        long remainingMs = Math.max(0L, restUntil - now);
        long remainingSec = (remainingMs + 999L) / 1000L;
        int accent = repository.themeAccent();

        face.restProgress = restTotalMs > 0 ? Math.max(0f, Math.min(1f, (float) remainingMs / restTotalMs)) : 0f;

        liveClockView = text(clockText(), 11f, MUTED, 600);
        place(liveClockView, 105, 18, 66, 16);

        place(text(s("recovery", "Récupération", "Recovery"), 14f, repository.themeAccent2(), 700), 54, 38, 168, 22);

        liveRestTimerView = text(
            String.format(Locale.ROOT, "%02d:%02d", remainingSec / 60, remainingSec % 60),
            46f,
            remainingSec == 0 ? 0xff34d399 : TEXT,
            800
        );
        place(liveRestTimerView, 42, 63, 192, 54);

        List<String> queue = panelQueue();
        if (!queue.isEmpty()) {
            int nextIndex = WatchMath.wrap(panelIndex(queue), 1, queue.size());
            JSONObject nextEx = repository.exercise(queue.get(nextIndex));
            if (nextEx != null) {
                String preview = s("next", "Suivant", "Next") + " : " + nextEx.optString("name")
                    + " (" + repository.count(nextEx) + "/" + nextEx.optInt("goal", 1) + ")";
                TextView nextView = text(preview, 11f, MUTED, 600);
                nextView.setSingleLine(true);
                nextView.setEllipsize(TextUtils.TruncateAt.END);
                place(nextView, 38, 121, 200, 20);
            }
        }

        place(button("−15s", null, accent, false, () -> adjustRest(-15_000L)), 34, 148, 54, 38);
        place(button(s("resume", "Reprendre", "Resume"), "Play", accent, true, () -> page = "work"), 94, 148, 94, 38);
        place(button("+15s", null, accent, false, () -> adjustRest(15_000L)), 194, 148, 54, 38);

        circleIconButton("Flag", s("finishSession", "Terminer la séance", "Finish session"), 0xffe8799a, 120, 196, 36, false, () -> page = "confirm");
    }

    private void confirm() {
        int accent = repository.themeAccent();
        place(icon("Flag", 0xffe8799a, 24), 126, 42, 24, 24);
        place(text(s("finishPrompt", "Terminer\nla séance ?", "Finish\nyour workout?"), 20f, TEXT, 700), 38, 70, 200, 64);
        place(button(s("continueBtn", "Continuer", "Continue"), null, accent, false, () -> page = "work"), 38, 150, 96, 40);
        place(button(s("finishBtn", "Terminer", "Finish"), "Check", 0xffe8799a, true, () -> {
            repository.finish();
            page = "summary";
        }), 142, 150, 96, 40);
    }

    private String formatSummaryDuration(long seconds) {
        if (seconds < 60) return seconds + " s";
        long mins = seconds / 60;
        long secs = seconds % 60;
        if (mins < 60) {
            return secs > 0 ? mins + " min " + String.format(Locale.ROOT, "%02d", secs) + " s" : mins + " min";
        }
        return (mins / 60) + " h " + String.format(Locale.ROOT, "%02d", mins % 60) + " min";
    }

    private void summary() {
        JSONObject sum = repository.summary();
        int accent = repository.themeAccent();
        boolean synced = repository.pending().length() == 0;

        place(icon("CircleCheck", 0xff34d399, 26), 125, 32, 26, 26);
        place(text(s("workoutDone", "Séance terminée !", "Session Complete!"), 18.5f, TEXT, 700), 34, 62, 208, 28);
        place(text(formatSummaryDuration(sum.optLong("duration")), 26f, repository.themeAccent2(), 800), 40, 92, 196, 32);

        int totalEx = sum.optInt("totalExercises", sum.optJSONArray("queue") == null ? 0 : sum.optJSONArray("queue").length());
        int doneEx = sum.optInt("completedExercises", totalEx);
        int totalReps = sum.optInt("totalReps", 0);
        String statsLine = doneEx + "/" + totalEx + " ex.  •  " + totalReps + " " + s("reps", "reps", "reps");
        place(text(statsLine, 12f, TEXT, 600), 38, 126, 200, 22);

        String syncLabel = synced
            ? "✓ " + s("synced", "Synchronisée", "Synced with phone")
            : "• " + s("waitingSync", "En attente de synchronisation", "Waiting to sync");
        place(text(syncLabel, 11f, synced ? 0xff34d399 : 0xfffbbf24, 600), 34, 152, 208, 20);

        place(button(s("home", "Accueil", "Home"), null, accent, true, () -> page = "home"), 70, 184, 136, 38);
    }

    private void changeCategory(int delta) {
        List<JSONObject> cats = repository.categories();
        category = Math.max(0, Math.min(cats.size() - 1, category + delta));
        gridPage = 0;
    }

    private void navigate(int direction) throws Exception {
        flushTimer(true);
        if ("work".equals(page)) {
            repository.navigate(direction);
        } else if ("quick".equals(page)) {
            List<String> queue = panelQueue();
            if (!queue.isEmpty()) quickId = queue.get(WatchMath.wrap(panelIndex(queue), direction, queue.size()));
        } else if ("routines".equals(page)) {
            List<JSONObject> list = repository.routines();
            int pages = Math.max(1, (list.size() + 2) / 3);
            routinePage = WatchMath.wrap(routinePage, direction, pages);
        } else if ("home".equals(page) || "prepare".equals(page)) {
            List<JSONObject> list = currentExercises();
            int pages = (list.size() + pageSize() - 1) / pageSize();
            gridPage = WatchMath.wrap(gridPage, direction, pages);
        }
    }

    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            downX = event.getX();
            downY = event.getY();
        }
        if (event.getActionMasked() == MotionEvent.ACTION_UP && downX > offsetX + 8 * scale) {
            float dx = event.getX() - downX, dy = event.getY() - downY;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 30 * scale) {
                MotionEvent cancel = MotionEvent.obtain(event);
                cancel.setAction(MotionEvent.ACTION_CANCEL);
                super.dispatchTouchEvent(cancel);
                cancel.recycle();
                if (Math.abs(dx) > Math.abs(dy) * 1.2f) {
                    act(() -> navigate(dx < 0 ? 1 : -1));
                } else if (("home".equals(page) || "prepare".equals(page)) && Math.abs(dy) > Math.abs(dx) * 1.2f) {
                    act(() -> changeCategory(dy < 0 ? 1 : -1));
                }
                return true;
            }
        }
        return super.dispatchTouchEvent(event);
    }

    @Override public boolean onGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL
            && (event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER) || event.isFromSource(InputDevice.SOURCE_MOUSE))) {
            if (SystemClock.elapsedRealtime() - lastWheel < 220) return true;
            lastWheel = SystemClock.elapsedRealtime();
            float axis = event.getAxisValue(
                event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER) ? MotionEvent.AXIS_SCROLL : MotionEvent.AXIS_VSCROLL
            );
            act(() -> {
                if ("home".equals(page) || "prepare".equals(page)) changeCategory(axis < 0 ? 1 : -1);
                else navigate(axis < 0 ? 1 : -1);
            });
            return true;
        }
        return super.onGenericMotionEvent(event);
    }
}
