package com.lucasm548.oneup;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;

/** Bitmap counterpart of the app's LevelEmblem, supported by RemoteViews. */
final class WidgetLevelEmblem {
    private WidgetLevelEmblem() {}

    static Bitmap render(int level, boolean today) {
        int rank = Math.max(0, Math.min(10, level));
        int color = Color.parseColor(rank == 0 ? "#94a3b8"
            : rank == 10 ? "#fbbf24" : rank >= 7 ? "#c4b5fd" : "#67e8f9");
        // Render at 3x the largest display size to stay crisp on dense screens.
        Bitmap bitmap = Bitmap.createBitmap(120, 120, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        // Leave a transparent safety margin around the outer ring, including
        // today's highlight, so scaling never trims its antialiased edges.
        canvas.scale(120f / 44f, 120f / 44f);
        canvas.translate(2, 2);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(color);
        Path hex = new Path();
        hex.moveTo(20, 7);
        hex.lineTo(31, 13.5f);
        hex.lineTo(31, 25);
        hex.lineTo(20, 33);
        hex.lineTo(9, 25);
        hex.lineTo(9, 13.5f);
        hex.close();
        paint.setAlpha(36);
        canvas.drawPath(hex, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(0.8f);
        paint.setAlpha(115);
        canvas.drawPath(hex, paint);
        paint.setStrokeWidth(2.4f);
        paint.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 10; i++) {
            paint.setAlpha(i < rank ? 255 : 38);
            canvas.drawArc(new RectF(2.5f, 2.5f, 37.5f, 37.5f), -85 + i * 36, 26, false, paint);
        }
        if (today) {
            paint.setColor(Color.parseColor("#22d3ee"));
            paint.setAlpha(160);
            paint.setStrokeWidth(0.7f);
            canvas.drawCircle(20, 20, 19.2f, paint);
        }
        paint.setColor(color);
        paint.setStyle(Paint.Style.FILL);
        paint.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        paint.setTextSize(17);
        paint.setTextAlign(Paint.Align.CENTER);
        Paint.FontMetrics metrics = paint.getFontMetrics();
        canvas.drawText(String.valueOf(rank), 20, 20 - (metrics.ascent + metrics.descent) / 2, paint);
        return bitmap;
    }
}
