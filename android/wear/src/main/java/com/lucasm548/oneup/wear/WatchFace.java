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
import android.util.SparseArray;
import android.view.View;
import java.util.Locale;

/** Background, bezel framing, curved captions, 10-segment level ring, rest arc & hexagonal medals. */
final class WatchFace extends View {
    private static final SparseArray<Typeface> FONT_CACHE = new SparseArray<>(4);

    static synchronized Typeface font(Context context, int weight) {
        Typeface cached = FONT_CACHE.get(weight);
        if (cached == null) {
            cached = new Typeface.Builder(context.getAssets(), "outfit.ttf")
                .setFontVariationSettings("'wght' " + weight)
                .build();
            if (cached == null) cached = Typeface.create(Typeface.SANS_SERIF, weight >= 700 ? Typeface.BOLD : Typeface.NORMAL);
            FONT_CACHE.put(weight, cached);
        }
        return cached;
    }

    static void drawHexMedal(Canvas canvas, Paint paint, Path hexPath, Typeface boldFont,
                             float cx, float cy, float radius, int level, int accent) {
        hexPath.reset();
        for (int i = 0; i < 6; i++) {
            double angle = Math.toRadians(-90 + i * 60);
            float vx = cx + (float) Math.cos(angle) * radius;
            float vy = cy + (float) Math.sin(angle) * radius;
            if (i == 0) hexPath.moveTo(vx, vy);
            else hexPath.lineTo(vx, vy);
        }
        hexPath.close();

        int badgeColor = level >= 10 ? 0xfffbbf24 : (level > 0 ? accent : 0xff4b4458);
        int fill = level > 0
            ? Color.argb(235, Color.red(badgeColor) / 4 + 14, Color.green(badgeColor) / 4 + 10, Color.blue(badgeColor) / 4 + 20)
            : 0xff16121f;

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(fill);
        canvas.drawPath(hexPath, paint);

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(Math.max(1.2f, radius * 0.13f));
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setColor(level > 0 ? badgeColor : 0x55ffffff);
        canvas.drawPath(hexPath, paint);

        paint.setStyle(Paint.Style.FILL);
        paint.setTypeface(boldFont);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTextSize(radius * (level >= 10 ? 0.92f : 1.05f));
        paint.setColor(level >= 10 ? 0xfffef08a : (level > 0 ? 0xfffaf7ff : 0xff9f94b0));
        Paint.FontMetrics fm = paint.getFontMetrics();
        canvas.drawText(String.valueOf(level), cx, cy - (fm.ascent + fm.descent) / 2f, paint);
        paint.setTextAlign(Paint.Align.LEFT);
    }

    private final Typeface semiBold, extraBold;
    private final RectF ring = new RectF(4.5f, 4.5f, 271.5f, 271.5f);
    private final Path top = new Path(), bottom = new Path();
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private RadialGradient cachedBg;
    private int cachedBgAccent = 0;

    String title = "", category = "";
    int accent = Color.rgb(139, 92, 246), themeAccent = accent, level = -1, categoryColor = accent;
    float subProgress = 0f, restProgress = -1f;

    WatchFace(Context context) {
        super(context);
        semiBold = font(context, 600);
        extraBold = font(context, 800);
        // Outer curved labels: apex at y=30 (top) and y=264 (bottom) to utilize the full round glass
        top.addArc(new RectF(30, 30, 246, 246), 225, 90);
        bottom.addArc(new RectF(12, 12, 264, 264), 135, -90);
        setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
    }

    private RadialGradient backgroundGradient() {
        int glowColor = level >= 0 ? accent : themeAccent;
        if (cachedBg == null || cachedBgAccent != glowColor) {
            cachedBgAccent = glowColor;
            int core = Color.rgb(
                Math.min(52, Color.red(glowColor) / 5 + 14),
                Math.min(44, Color.green(glowColor) / 6 + 9),
                Math.min(64, Color.blue(glowColor) / 5 + 18)
            );
            cachedBg = new RadialGradient(138, 118, 152, new int[]{core, 0xff09070e, 0xff040406}, new float[]{0f, 0.68f, 1f}, Shader.TileMode.CLAMP);
        }
        return cachedBg;
    }

    @Override protected void onDraw(Canvas canvas) {
        float scale = Math.min(getWidth(), getHeight()) / 276f;
        canvas.save();
        canvas.translate((getWidth() - 276 * scale) / 2f, (getHeight() - 276 * scale) / 2f);
        canvas.scale(scale, scale);

        paint.setShader(backgroundGradient());
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRect(0, 0, 276, 276, paint);
        paint.setShader(null);

        if (level >= 0) {
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(6.2f);
            paint.setStrokeCap(Paint.Cap.ROUND);
            int activeColor = level >= 10 ? 0xfffbbf24 : accent;
            for (int i = 0; i < 10; i++) {
                float startAngle = -86.5f + i * 36f;
                paint.setColor(i < level ? activeColor : 0xff262030);
                canvas.drawArc(ring, startAngle, 29f, false, paint);
                if (i == level && subProgress > 0.02f) {
                    paint.setColor((accent & 0x00ffffff) | 0x99000000);
                    canvas.drawArc(ring, startAngle, Math.max(2f, 29f * Math.min(1f, subProgress)), false, paint);
                }
            }
            paint.setStyle(Paint.Style.FILL);
        } else if (restProgress >= 0f) {
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(6.2f);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setColor(0xff251f30);
            canvas.drawArc(ring, -90f, 360f, false, paint);
            if (restProgress > 0.005f) {
                paint.setColor(themeAccent);
                canvas.drawArc(ring, -90f, 360f * Math.min(1f, restProgress), false, paint);
            }
            paint.setStyle(Paint.Style.FILL);
        }

        curved(canvas, title, false, (themeAccent & 0x00ffffff) | 0xee000000, 108f, 13.5f);
        curved(canvas, category.toUpperCase(Locale.getDefault()), true, categoryColor, 126f, 12f);
        canvas.restore();
    }

    private void curved(Canvas canvas, String text, boolean isBottom, int color, float radius, float textSize) {
        if (text == null || text.isEmpty()) return;
        paint.setColor(color);
        paint.setTypeface(isBottom ? semiBold : extraBold);
        paint.setTextSize(textSize);
        paint.setLetterSpacing(isBottom ? 0.06f : 0.08f);
        Path path = isBottom ? bottom : top;
        float length = (float) (Math.PI * radius / 2.0);
        if (paint.measureText(text) > length - 14f) {
            int count = paint.breakText(text, true, length - 24f, null);
            text = text.substring(0, Math.max(1, count)) + "…";
        }
        canvas.drawTextOnPath(text, path, (length - paint.measureText(text)) / 2f, 0, paint);
        paint.setLetterSpacing(0f);
    }
}
