package com.lucasm548.oneup.wear;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.view.View;

/** Background, curved captions and ten physical level segments; controls remain native views. */
final class WatchFace extends View {
    private final Typeface regular, bold;
    private final RadialGradient background = new RadialGradient(138,125,150,new int[]{0xff181025,0xff050505},null,Shader.TileMode.CLAMP);
    private final RectF ring = new RectF(12,12,264,264);
    private final Path top = new Path(), bottom = new Path();
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    String title = "", category = "";
    int accent = Color.rgb(139, 92, 246), level = -1, categoryColor = accent;
    WatchFace(Context context) { super(context); regular=new Typeface.Builder(context.getAssets(), "outfit.ttf").setFontVariationSettings("'wght' 600").build(); bold=new Typeface.Builder(context.getAssets(), "outfit.ttf").setFontVariationSettings("'wght' 800").build();
        top.addArc(new RectF(38,38,238,238),225,90); bottom.addArc(new RectF(28,28,248,248),135,-90); setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO); }
    @Override protected void onDraw(Canvas canvas) {
        float scale = Math.min(getWidth(), getHeight()) / 276f;
        canvas.save();
        canvas.translate((getWidth() - 276 * scale) / 2f, (getHeight() - 276 * scale) / 2f);
        canvas.scale(scale, scale);
        paint.setShader(background);
        paint.setStyle(Paint.Style.FILL); canvas.drawRect(0, 0, 276, 276, paint); paint.setShader(null);
        if (level >= 0) {
            paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(5); paint.setStrokeCap(Paint.Cap.ROUND);
            for (int i = 0; i < 10; i++) { paint.setColor(i < level ? accent : 0xff292431); canvas.drawArc(ring, -87 + i * 36, 30, false, paint); }
            paint.setStyle(Paint.Style.FILL);
        }
        curved(canvas, title, false, 0xffb39bff);
        curved(canvas, category.toUpperCase(java.util.Locale.getDefault()), true, categoryColor);
        canvas.restore();
    }
    private void curved(Canvas canvas, String text, boolean bottom, int color) {
        if (text.isEmpty()) return;
        paint.setColor(color); paint.setTypeface(bottom ? regular : bold);
        paint.setTextSize(bottom ? 11 : 16);
        Path path = bottom ? this.bottom : top;
        float radius = bottom ? 110 : 100;
        float length = (float) (Math.PI * radius / 2);
        if (paint.measureText(text) > length-16) text=text.substring(0,paint.breakText(text,true,length-25,null))+"…";
        canvas.drawTextOnPath(text, path, (length - paint.measureText(text)) / 2f, 0, paint);
    }
}
