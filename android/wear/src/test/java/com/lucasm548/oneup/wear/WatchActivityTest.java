package com.lucasm548.oneup.wear;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
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
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=35,qualifiers="w225dp-h225dp-round-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class WatchActivityTest {
    private View find(View root,String label) {
        if(label.contentEquals(root.getContentDescription()==null?"":root.getContentDescription()))return root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View child=find(((ViewGroup)root).getChildAt(i),label);if(child!=null)return child;}
        return null;
    }
    private void screenshot(View root,String name)throws Exception{
        Bitmap bitmap=Bitmap.createBitmap(450,450,Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));
        File directory=new File("build/test-previews");directory.mkdirs();
        try(FileOutputStream output=new FileOutputStream(new File(directory,name+".png"))){bitmap.compress(Bitmap.CompressFormat.PNG,100,output);}
    }
    @Test public void nativeHomePreparationAndSessionRenderAndStayNavigable() throws Exception {
        Context context=RuntimeEnvironment.getApplication();context.getSharedPreferences("oneup_watch",Context.MODE_PRIVATE).edit().clear().commit();
        WatchRepository repository=new WatchRepository(context);JSONObject snapshot=WatchRepositoryTest.snapshot("test",30,1);
        JSONArray exercises=snapshot.getJSONArray("exercises");
        String[] names={"Tractions","Abdos","Jumping jacks","Fentes"};
        for(int i=0;i<4;i++)exercises.put(new JSONObject(exercises.getJSONObject(0).toString()).put("id","ex"+i).put("name",names[i]));
        repository.accept(snapshot);
        var controller=Robolectric.buildActivity(WatchActivity.class).setup();WatchActivity activity=controller.get();
        View root=((ViewGroup)activity.findViewById(android.R.id.content)).getChildAt(0);
        root.measure(View.MeasureSpec.makeMeasureSpec(450,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(450,View.MeasureSpec.EXACTLY));root.layout(0,0,450,450);shadowOf(Looper.getMainLooper()).idle();
        screenshot(root,"home");
        View workout=find(root,"Ma séance");assertNotNull(workout);workout.performClick();shadowOf(Looper.getMainLooper()).idle();
        View pushups=find(root,"Ajouter Pompes, 30 / 50");assertNotNull(pushups);pushups.performClick();shadowOf(Looper.getMainLooper()).idle();
        View start=find(root,"Démarrer la séance");assertNotNull(start);start.performClick();shadowOf(Looper.getMainLooper()).idle();
        screenshot(root,"session");
        assertNotNull(find(root,"Terminer la séance"));assertEquals(1,repository.session().getJSONArray("queue").length());
        controller.pause().stop().destroy();
    }
}
