package com.lucasm548.oneup.wear;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import java.util.List;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=35)
public class WatchRepositoryTest {
    private WatchRepository repository;
    static JSONObject snapshot(String scope, int count, long timestamp) throws Exception {
        return new JSONObject().put("version",1).put("scope",scope).put("ready",true).put("updatedAt",timestamp)
            .put("catalogId","catalog-a").put("expiresAt",System.currentTimeMillis()+3600000).put("date","2026-10-29")
            .put("day",50).put("language","fr").put("streak",12).put("streakActive",true)
            .put("theme",new JSONObject().put("key","dark").put("accent","#818cf8").put("accent2","#c7d2fe"))
            .put("categories",new JSONArray().put(new JSONObject().put("id","bodyweight").put("name","Poids du corps").put("color","#8b5cf6")))
            .put("exercises",new JSONArray()
                .put(new JSONObject().put("id","pushups").put("name","Pompes").put("count",count).put("goal",50).put("icon","Dumbbell").put("categoryId","bodyweight").put("color","#818cf8"))
                .put(new JSONObject().put("id","squats").put("name","Squats").put("count",0).put("goal",50).put("icon","ArrowDownUp").put("categoryId","bodyweight").put("color","#34d399")))
            .put("routines",new JSONArray()
                .put(new JSONObject().put("id","r1").put("name","Full Body").put("exerciseIds",new JSONArray().put("pushups").put("squats"))))
            .put("receipts",new JSONObject());
    }
    @Before public void setup() throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        context.getSharedPreferences("oneup_watch",Context.MODE_PRIVATE).edit().clear().commit();
        repository=new WatchRepository(context);repository.accept(snapshot("account-a",30,1));
    }
    @Test public void offlineProgressSurvivesRestartAndAcknowledgmentDoesNotDoubleCount() throws Exception {
        repository.adjust("pushups",5);
        WatchRepository restarted=new WatchRepository(RuntimeEnvironment.getApplication());
        assertEquals(35,restarted.count(restarted.exercise("pushups")));
        JSONObject operation=restarted.pending().getJSONObject(0);
        JSONObject confirmed=snapshot("account-a",35,2).put("receipts",new JSONObject().put(operation.getString("device"),1));
        restarted.accept(confirmed);
        assertEquals(0,restarted.pending().length());assertEquals(35,restarted.count(restarted.exercise("pushups")));
        restarted.accept(snapshot("account-a",30,1));
        assertEquals(35,restarted.count(restarted.exercise("pushups")));
    }
    @Test public void pendingWorkNeverMovesAcrossAccounts() throws Exception {
        repository.adjust("pushups",5);repository.accept(snapshot("account-b",0,2));
        assertEquals(0,repository.pending().length());assertEquals(0,repository.count(repository.exercise("pushups")));
        repository.accept(snapshot("account-a",30,3));
        assertEquals(1,repository.pending().length());assertEquals(35,repository.count(repository.exercise("pushups")));
    }
    @Test public void sessionRoutineAndSummaryStatsAreDurableAndNavigationWraps() throws Exception {
        assertEquals(1,repository.routines().size());
        repository.start(List.of("pushups","squats"),"Full Body");
        assertEquals("Full Body",repository.pending().getJSONObject(0).getString("routineName"));
        repository.navigate(-1);assertEquals(1,repository.session().getInt("index"));
        repository.navigate(1);assertEquals(0,repository.session().getInt("index"));
        repository.adjust("pushups",5);repository.finish();
        assertEquals(0,repository.session().length());assertEquals(3,repository.pending().length());
        for(int i=0;i<3;i++)assertEquals(i+1,repository.pending().getJSONObject(i).getInt("sequence"));
        JSONObject sum=repository.summary();
        assertEquals(2,sum.getJSONArray("queue").length());
        assertEquals(1,sum.getInt("completedExercises"));
        assertEquals(35,sum.getInt("totalReps"));
        assertEquals("Full Body",sum.getString("routineName"));
    }
    @Test public void expiredGoalsCannotBeReusedOnAnotherDay() throws Exception {
        repository.accept(snapshot("account-a",30,2).put("expiresAt",System.currentTimeMillis()-1));
        assertFalse(repository.ready());
        try { repository.adjust("pushups",5);fail("Expected expired snapshot to be read-only"); }
        catch(IllegalStateException expected){assertEquals(0,repository.pending().length());}
    }
}
