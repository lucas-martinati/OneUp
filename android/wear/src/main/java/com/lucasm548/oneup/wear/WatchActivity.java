package com.lucasm548.oneup.wear;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.RelativeSizeSpan;
import android.text.style.ForegroundColorSpan;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public class WatchActivity extends ComponentActivity implements SharedPreferences.OnSharedPreferenceChangeListener {
    private static final int TEXT = 0xfffaf7ff, MUTED = 0xffc0b5ce, PURPLE = 0xff8b5cf6;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WatchRepository repository;
    private FrameLayout root;
    private WatchFace face;
    private Typeface outfit;
    private OnBackPressedCallback backCallback;
    private String page = "home", quickId = "", account = "";
    private int category = 0, gridPage = 0;
    private final LinkedHashSet<String> selected = new LinkedHashSet<>();
    private float scale = 1, offsetX, offsetY, downX, downY;
    private long lastWheel, timerStarted, timerCommitted, restUntil;
    private String timerExercise = "", timerScope = "";
    private boolean timerRunning, restAlerted;
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (timerRunning) {
                long seconds = (SystemClock.elapsedRealtime() - timerStarted) / 1000;
                if (seconds - timerCommitted >= 5) flushTimer(false);
            }
            if ("rest".equals(page) && restUntil > 0 && System.currentTimeMillis() >= restUntil && !restAlerted) {
                restAlerted = true; root.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
            }
            if (timerRunning || "rest".equals(page) || !repository.ready()) render();
            handler.postDelayed(this, 1000);
        }
    };
    private boolean fr() { return repository.snapshot().optString("language", Locale.getDefault().getLanguage()).startsWith("fr"); }
    private String tr(String french, String english) { return fr() ? french : english; }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        repository = new WatchRepository(this);
        outfit = new Typeface.Builder(getAssets(), "outfit.ttf").setFontVariationSettings("'wght' 500").build();
        root = new FrameLayout(this) {
            @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) {
                super.onSizeChanged(w, h, oldw, oldh); post(WatchActivity.this::render);
            }
        };
        root.setBackgroundColor(Color.BLACK); root.setFocusable(true);
        setContentView(root);
        backCallback = new OnBackPressedCallback(false) {
            @Override public void handleOnBackPressed() { flushTimer(true); page = "home"; render(); }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
        if (getWindow().getInsetsController() != null) getWindow().getInsetsController().hide(WindowInsets.Type.systemBars());
        if (state != null) {
            page = state.getString("page", "home"); quickId = state.getString("quickId", "");
            category = state.getInt("category"); gridPage = state.getInt("gridPage");
        }
    }
    @Override protected void onResume() {
        super.onResume(); repository.prefs.registerOnSharedPreferenceChangeListener(this); repository.retry();
        restUntil = repository.prefs.getLong("restUntil", 0); handler.post(tick); render();
    }
    @Override protected void onPause() {
        flushTimer(true); handler.removeCallbacks(tick); repository.prefs.unregisterOnSharedPreferenceChangeListener(this); super.onPause();
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        out.putString("page", page); out.putString("quickId", quickId); out.putInt("category", category); out.putInt("gridPage", gridPage);
        super.onSaveInstanceState(out);
    }
    @Override public void onSharedPreferenceChanged(SharedPreferences prefs, String key) { handler.post(this::render); }
    private interface Action { void run() throws Exception; }
    private void act(Action action) {
        try { if (!account.equals(repository.scope())) throw new IllegalStateException("Account changed"); action.run(); root.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); render(); }
        catch (Exception error) { Toast.makeText(this, tr("Échec de l’action. Réessaie après synchronisation.", "Check watch synchronization and try again."), Toast.LENGTH_LONG).show(); }
    }
    private int color(JSONObject object) {
        try { return Color.parseColor(object.optString("color", "#818cf8")); }
        catch (IllegalArgumentException error) { return PURPLE; }
    }
    private TextView text(String value, float size, int color) {
        TextView view = new TextView(this); view.setText(value); view.setGravity(Gravity.CENTER); view.setTextColor(color);
        view.setTypeface(Typeface.create(outfit, 500, false)); view.setIncludeFontPadding(false); view.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, Math.max(size * scale, 10 * getResources().getDisplayMetrics().scaledDensity));
        return view;
    }
    private GradientDrawable background(int color, int radius, boolean primary) {
        int dark = Color.rgb(Color.red(color)/5, Color.green(color)/5, Color.blue(color)/5);
        GradientDrawable drawable = new GradientDrawable(GradientDrawable.Orientation.TL_BR, primary ? new int[]{color, dark} : new int[]{dark, 0xff0d0a13});
        drawable.setCornerRadius(radius * scale); drawable.setStroke(Math.max(1, Math.round(scale)), (color & 0x00ffffff) | 0x55000000); return drawable;
    }
    private ImageView icon(String name, int color, float size) {
        ImageView view = new ImageView(this); view.setImageResource(WatchIcons.resource(name));
        view.setImageTintList(ColorStateList.valueOf(color)); view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        view.setLayoutParams(new LinearLayout.LayoutParams(Math.round(size*scale), Math.round(size*scale))); return view;
    }
    private void place(View view, float x, float y, float width, float height) {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(Math.round(width*scale), Math.round(height*scale));
        params.leftMargin = Math.round(offsetX+x*scale); params.topMargin = Math.round(offsetY+y*scale); root.addView(view, params);
    }
    private LinearLayout button(String label, String icon, int color, boolean primary, Action action) {
        LinearLayout view = new LinearLayout(this) {
            @Override public CharSequence getAccessibilityClassName() { return "android.widget.Button"; }
        };
        view.setGravity(Gravity.CENTER); view.setOrientation(LinearLayout.HORIZONTAL); view.setPadding(2,2,2,2);
        view.setBackground(background(color, 13, primary)); view.setFocusable(true); view.setClickable(true);
        view.setContentDescription(label); if (icon != null) view.addView(icon(icon, color == PURPLE && primary ? TEXT : color, 15));
        if (!label.isEmpty()) { TextView title = text(label, 12, TEXT); title.setPadding(3,0,0,0); view.addView(title); }
        view.setOnClickListener(v -> act(action)); return view;
    }
    private void iconButton(String name, String description, int color, float x, float y, Action action) {
        LinearLayout button = button("", name, color, false, action); button.setContentDescription(description); button.setBackgroundColor(Color.TRANSPARENT); place(button,x,y,38,38);
    }
    private void render() {
        if (root.getWidth() == 0) return;
        String scope = repository.scope();
        if (!scope.equals(account)) {
            account = scope; selected.clear(); category = 0; gridPage = 0; page = "home"; timerRunning = false; getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            try { JSONArray saved = new JSONArray(repository.prefs.getString("selection_"+scope,"[]")); for(int i=0;i<saved.length();i++) selected.add(saved.getString(i)); }
            catch (Exception ignored) { selected.clear(); }
        }
        scale = Math.min(root.getWidth(),root.getHeight())/276f;
        offsetX=(root.getWidth()-276*scale)/2; offsetY=(root.getHeight()-276*scale)/2;
        root.removeAllViews(); face = new WatchFace(this); root.addView(face,new FrameLayout.LayoutParams(-1,-1));
        place(text(android.text.format.DateFormat.format("HH:mm",new java.util.Date()).toString(),11,MUTED),105,12,66,16);
        if (!repository.ready()) { backCallback.setEnabled(false); syncScreen(); return; }
        if (repository.pending().length()>0) { TextView dot=text("•",12,0xfffbbf24); dot.setContentDescription(tr("Modifications à synchroniser", "Changes pending synchronization")); place(dot,175,12,12,15); }
        if (("work".equals(page)||"rest".equals(page)||"confirm".equals(page)) && repository.session().length()==0) page="home";
        switch(page) {
            case "prepare": home(true); break;
            case "work": case "quick": panel(); break;
            case "rest": rest(); break;
            case "confirm": confirm(); break;
            case "summary": summary(); break;
            default: home(false);
        }
        backCallback.setEnabled(!"home".equals(page));
        face.invalidate();
    }
    private void syncScreen() {
        face.title="ONEUP";
        place(text(tr("Ouvre OneUp\nsur ton téléphone", "Open OneUp\non your phone"),18,TEXT),42,91,192,62);
        place(text(tr("Pour synchroniser les exercices\net la progression du jour", "Sync today's exercises\nand progress"),12,MUTED),40,159,196,36);
        place(button(tr("Synchroniser", "Sync"),"RefreshCw",PURPLE,true,()->repository.retry()),67,207,142,34);
    }
    private List<JSONObject> currentExercises() {
        List<JSONObject> cats=repository.categories(); if(cats.isEmpty())return new ArrayList<>();
        category=Math.max(0,Math.min(category,cats.size()-1)); return repository.exercises(cats.get(category).optString("id"));
    }
    private int pageSize() { return root.getWidth()/getResources().getDisplayMetrics().density>=220?6:4; }
    private void home(boolean picking) {
        List<JSONObject> cats=repository.categories(); if(cats.isEmpty()){syncScreen();return;}
        List<JSONObject> exercises=currentExercises(); JSONObject cat=cats.get(category);
        face.title=picking?tr("MA SÉANCE", "MY WORKOUT"):"ONEUP"; face.category=cat.optString("name"); face.categoryColor=color(cat);
        LinearLayout streak = new LinearLayout(this); streak.setGravity(Gravity.CENTER);
        if (!picking) streak.addView(icon("Flame", 0xfffb923c, 12));
        streak.addView(text(picking ? selected.size()+" ex." : " "+repository.snapshot().optInt("streak"),11,picking?MUTED:0xfffb923c));
        place(streak,50,57,62,23);
        place(text(tr("JOUR ","DAY ")+repository.snapshot().optInt("day"),11,0xffc4b5fd),166,57,65,23);
        if(cat.optBoolean("locked")) {
            place(text(tr("Disponible avec OneUp Pro", "Available with OneUp Pro"),16,TEXT),42,105,192,45);
            place(text(tr("À activer sur le téléphone", "Activate on your phone"),12,MUTED),40,153,196,32);
        } else if(exercises.isEmpty()) {
            place(text(tr("Aucun exercice", "No exercises"),18,TEXT),45,110,186,35);
            place(text(tr("Ajoute-les sur ton téléphone", "Add them on your phone"),12,MUTED),43,151,190,35);
        } else {
            int size=pageSize(),pages=(exercises.size()+size-1)/size; gridPage=Math.floorMod(gridPage,pages);
            int start=gridPage*size,end=Math.min(start+size,exercises.size()),cols=size/2;
            place(text((start+1)+"–"+end+" / "+exercises.size(),10,MUTED),90,80,96,13);
            float tileWidth=(214f-(cols-1)*5)/cols,tileHeight=size==6?48:52;
            for(int i=start;i<end;i++) {
                JSONObject ex=exercises.get(i);String id=ex.optString("id");int c=color(ex);boolean chosen=selected.contains(id);
                LinearLayout card=button("",null,c,picking&&chosen,()->{
                    if(picking){if(!selected.remove(id))selected.add(id);repository.prefs.edit().putString("selection_"+account,new JSONArray(selected).toString()).apply();}
                    else{quickId=id;page="quick";}
                });
                card.setOrientation(LinearLayout.VERTICAL);card.setPadding(3,2,3,3);
                TextView meta=text(repository.count(ex)+"/"+ex.optInt("goal")+(ex.optString("type").equals("timer")?"s":""),11,c);
                LinearLayout metaRow = new LinearLayout(this); metaRow.setGravity(Gravity.CENTER);
                metaRow.addView(icon(ex.optString("icon"), c, 12)); metaRow.addView(meta); card.addView(metaRow);
                TextView name=text(ex.optString("name"),11,TEXT);name.setMaxLines(2);name.setLineSpacing(0,.95f);card.addView(name);
                View strip = new View(this) {
                    private final android.graphics.Paint paint = new android.graphics.Paint();
                    @Override protected void onDraw(android.graphics.Canvas canvas) {
                        int level=WatchMath.level(repository.count(ex),ex.optInt("goal",1));
                        for(int segment=0;segment<10;segment++){paint.setColor(segment<level?c:0x22ffffff);float w=getWidth()/10f;canvas.drawRect(segment*w,0,(segment+1)*w-1,getHeight(),paint);}
                    }
                };
                card.addView(strip,new LinearLayout.LayoutParams(-1,Math.max(2,Math.round(2*scale))));
                if(picking&&chosen)meta.setText(String.format(Locale.getDefault()," %d ✓",new ArrayList<>(selected).indexOf(id)+1));
                card.setContentDescription((picking?(chosen?tr("Retirer ","Remove "):tr("Ajouter ","Add ")):tr("Ouvrir ","Open "))+ex.optString("name")+", "+repository.count(ex)+" / "+ex.optInt("goal"));
                card.setSelected(chosen);place(card,31+(i-start)%cols*(tileWidth+5),94+(i-start)/cols*(tileHeight+5),tileWidth,tileHeight);
            }
        }
        if(picking) {
            iconButton("ArrowLeft",tr("Accueil","Home"),MUTED,45,207,()->page="home");
            place(text(selected.size()+tr(" choisis"," selected"),11,MUTED),88,213,100,20);
            LinearLayout start=button("","Play",PURPLE,true,()->{repository.start(new ArrayList<>(selected));page="work";});
            start.setContentDescription(tr("Démarrer la séance","Start workout"));start.setEnabled(!selected.isEmpty());start.setAlpha(selected.isEmpty()?.3f:1);place(start,194,207,36,36);
        } else {
            boolean active=repository.session().length()>0;
            place(button(active?tr("Reprendre","Resume"):tr("Ma séance","Workout"),active?"Play":"ListPlus",PURPLE,true,()->page=active?"work":"prepare"),78,200,120,30);
            iconButton("ChevronUp",tr("Catégorie précédente","Previous category"),MUTED,32,204,()->changeCategory(-1));
            iconButton("ChevronDown",tr("Catégorie suivante","Next category"),MUTED,207,204,()->changeCategory(1));
        }
    }
    private List<String> panelQueue() {
        List<String> queue=new ArrayList<>();
        if("quick".equals(page)) {
            JSONObject ex=repository.exercise(quickId);if(ex!=null)for(JSONObject item:repository.exercises(ex.optString("categoryId")))queue.add(item.optString("id"));
        } else { JSONArray ids=repository.session().optJSONArray("queue");if(ids!=null)for(int i=0;i<ids.length();i++)if(repository.exercise(ids.optString(i))!=null)queue.add(ids.optString(i)); }
        return queue;
    }
    private int panelIndex(List<String> queue) { return "quick".equals(page)?Math.max(0,queue.indexOf(quickId)):Math.floorMod(repository.session().optInt("index"),Math.max(1,queue.size())); }
    private void panel() {
        List<String> queue=panelQueue();if(queue.isEmpty()){if(repository.session().length()>0)confirm();else{page="home";home(false);}return;}
        int index=panelIndex(queue);JSONObject ex=repository.exercise(queue.get(index));int count=repository.count(ex),goal=ex.optInt("goal",1),c=color(ex);
        if(!"quick".equals(page)&&!repository.session().optString("date").equals(repository.snapshot().optString("date"))) { confirm();return; }
        face.accent=c;face.level=WatchMath.level(count,goal);
        place(text((index+1)+"/"+queue.size(),12,MUTED),105,34,66,19);
        if(queue.size()>1)for(int direction:new int[]{-1,1}) {
            JSONObject neighbor=repository.exercise(queue.get(WatchMath.wrap(index,direction,queue.size())));final int delta=direction;
            iconButton(neighbor.optString("icon"),tr(direction<0?"Précédent : ":"Suivant : ",direction<0?"Previous: ":"Next: ")+neighbor.optString("name"),color(neighbor),direction<0?5:233,106,()->navigate(delta));
        }
        place(text(ex.optString("name"),20,c),52,57,172,36);
        String number=String.valueOf(count);
        SpannableString metricValue=new SpannableString(number+" / "+goal+(ex.optString("type").equals("timer")?" s":""));
        metricValue.setSpan(new RelativeSizeSpan(.38f),number.length(),metricValue.length(),Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        metricValue.setSpan(new ForegroundColorSpan(MUTED),number.length(),metricValue.length(),Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        TextView metric=text("",43,TEXT);metric.setText(metricValue);metric.setSingleLine(true);metric.setTypeface(Typeface.create(outfit,700,false));place(metric,50,99,176,48);
        if(ex.has("weight"))place(text(ex.optDouble("weight")+" kg",11,MUTED),65,145,146,17);
        TextView badge=text(face.level+(face.level>0?" ✓":""),14,c);badge.setContentDescription(tr("Niveau ","Level ")+face.level+" / 10");place(badge,110,160,56,20);
        place(button("−1",null,c,false,()->{flushTimer(true);repository.adjust(ex.optString("id"),-1);}),60,184,47,36);
        boolean timed="timer".equals(ex.optString("type"));
        place(button(timed?(timerRunning?tr("Pause","Pause"):tr("Chrono","Timer")):"+5",timed?(timerRunning?"Pause":"Play"):null,c,true,()->{
            if(timed){if(timerRunning)flushTimer(true);else{timerRunning=true;timerExercise=ex.optString("id");timerScope=account;timerStarted=SystemClock.elapsedRealtime();timerCommitted=0;getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}}
            else repository.adjust(ex.optString("id"),5);
        }),113,184,103,36);
        iconButton("ArrowLeft",tr("Accueil","Home"),MUTED,73,223,()->{flushTimer(true);page="home";});
        if("quick".equals(page)) iconButton("ListPlus",tr("Préparer ma séance","Prepare workout"),PURPLE,165,223,()->{flushTimer(true);page="prepare";});
        else {
            place(button(tr("Repos","Rest"),null,c,false,()->{flushTimer(true);restUntil=System.currentTimeMillis()+45000;restAlerted=false;repository.prefs.edit().putLong("restUntil",restUntil).apply();page="rest";}),112,227,50,26);
            iconButton("Flag",tr("Terminer la séance","Finish workout"),0xffd8a1b2,166,223,()->{flushTimer(true);page="confirm";});
        }
    }
    private void flushTimer(boolean stop) {
        if(!timerRunning)return;
        long seconds=(SystemClock.elapsedRealtime()-timerStarted)/1000,delta=seconds-timerCommitted;
        if(delta>0)try{repository.adjust(timerExercise,(int)Math.min(3600,delta),timerScope);timerCommitted=seconds;}catch(Exception error){timerRunning=false;}
        if(stop){timerRunning=false;getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
    }
    private void rest() {
        long remaining=Math.max(0,(restUntil-System.currentTimeMillis()+999)/1000);
        place(text(tr("Récupération","Recovery"),17,MUTED),45,74,186,30);
        place(text(String.format(Locale.ROOT,"%02d:%02d",remaining/60,remaining%60),43,TEXT),45,111,186,58);
        place(button(tr("Reprendre","Resume"),"Play",PURPLE,true,()->page="work"),65,187,146,38);
    }
    private void confirm() {
        place(text(tr("Terminer\nla séance ?","Finish\nyour workout?"),22,TEXT),43,81,190,75);
        place(button(tr("Continuer","Continue"),null,PURPLE,false,()->page="work"),42,177,94,40);
        place(button(tr("Terminer","Finish"),null,0xffe8799a,true,()->{repository.finish();page="summary";}),142,177,94,40);
    }
    private void summary() {
        JSONObject summary=repository.summary();
        place(text(tr("Séance terminée","Workout complete"),22,TEXT),43,78,190,57);
        place(text(summary.optLong("duration")/60+tr(" min"," min"),24,0xffa78bfa),62,139,152,37);
        place(text(repository.pending().length()>0?tr("En attente de synchronisation","Waiting to sync"):tr("Synchronisée","Synced"),12,MUTED),40,180,196,28);
        place(button(tr("Accueil","Home"),null,PURPLE,true,()->page="home"),78,218,120,33);
    }
    private void changeCategory(int delta) { List<JSONObject> cats=repository.categories();category=Math.max(0,Math.min(cats.size()-1,category+delta));gridPage=0; }
    private void navigate(int direction) throws Exception {
        flushTimer(true);
        if("work".equals(page))repository.navigate(direction);
        else if("quick".equals(page)){List<String> queue=panelQueue();if(!queue.isEmpty())quickId=queue.get(WatchMath.wrap(panelIndex(queue),direction,queue.size()));}
        else if("home".equals(page)||"prepare".equals(page)) {List<JSONObject> list=currentExercises();int pages=(list.size()+pageSize()-1)/pageSize();gridPage=WatchMath.wrap(gridPage,direction,pages);}
    }
    @Override public boolean dispatchTouchEvent(MotionEvent event) {
        if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=event.getX();downY=event.getY();}
        if(event.getActionMasked()==MotionEvent.ACTION_UP&&downX>offsetX+8*scale){
            float dx=event.getX()-downX,dy=event.getY()-downY;
            if(Math.max(Math.abs(dx),Math.abs(dy))>30*scale){
                MotionEvent cancel=MotionEvent.obtain(event);cancel.setAction(MotionEvent.ACTION_CANCEL);super.dispatchTouchEvent(cancel);cancel.recycle();
                if(Math.abs(dx)>Math.abs(dy)*1.2)act(()->navigate(dx<0?1:-1));
                else if(("home".equals(page)||"prepare".equals(page))&&Math.abs(dy)>Math.abs(dx)*1.2)act(()->changeCategory(dy<0?1:-1));
                return true;
            }
        }
        return super.dispatchTouchEvent(event);
    }
    @Override public boolean onGenericMotionEvent(MotionEvent event) {
        if(event.getAction()==MotionEvent.ACTION_SCROLL&&(event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)||event.isFromSource(InputDevice.SOURCE_MOUSE))){
            if(SystemClock.elapsedRealtime()-lastWheel<250)return true;lastWheel=SystemClock.elapsedRealtime();
            float axis=event.getAxisValue(event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)?MotionEvent.AXIS_SCROLL:MotionEvent.AXIS_VSCROLL);
            act(()->{if("home".equals(page)||"prepare".equals(page))changeCategory(axis<0?1:-1);else navigate(axis<0?1:-1);});return true;
        }
        return super.onGenericMotionEvent(event);
    }
}
