package com.lucasm548.oneup.wear;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;
import android.view.View;
import androidx.core.content.ContextCompat;

/**
 * Self-contained Canvas exercise tile for 225dp+ round Wear OS screens.
 * Eliminates nested LinearLayouts and guarantees 2-line titles never push
 * the 10-segment level strip outside the card border.
 */
final class WatchTileView extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final TextPaint textPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rect = new RectF();
    private final RectF segRect = new RectF();
    private final Drawable iconDrawable;
    private final Typeface mediumFont, boldFont;
    private final String title, meta;
    private final int color, level;
    private final boolean highlighted;
    private final float scale;
    private LinearGradient cardGradient;
    private int cachedW, cachedH;

    WatchTileView(Context context, String iconName, String title, String meta,
                  int color, int level, boolean highlighted, float scale) {
        super(context);
        this.title = title == null ? "" : title;
        this.meta = meta == null ? "" : meta;
        this.color = color;
        this.level = Math.max(0, Math.min(10, level));
        this.highlighted = highlighted;
        this.scale = scale;
        this.mediumFont = WatchFace.font(context, 600);
        this.boldFont = WatchFace.font(context, 700);
        Drawable raw = ContextCompat.getDrawable(context, WatchIcons.resource(iconName));
        this.iconDrawable = raw != null ? raw.mutate() : null;
        if (this.iconDrawable != null) {
            this.iconDrawable.setTint(highlighted ? 0xfffaf7ff : color);
        }
        setClickable(true);
        setFocusable(true);
    }

    @Override public CharSequence getAccessibilityClassName() {
        return "android.widget.Button";
    }

    @Override protected void onDraw(Canvas canvas) {
        int w = getWidth(), h = getHeight();
        if (w <= 0 || h <= 0) return;

        if (cardGradient == null || cachedW != w || cachedH != h) {
            cachedW = w;
            cachedH = h;
            int dark = Color.rgb(Color.red(color) / 5 + 8, Color.green(color) / 5 + 6, Color.blue(color) / 5 + 12);
            int topColor = highlighted
                ? Color.rgb(Color.red(color) * 3 / 4, Color.green(color) * 3 / 4, Color.blue(color) * 3 / 4)
                : dark;
            int bottomColor = highlighted ? dark : 0xff0d0a14;
            cardGradient = new LinearGradient(0, 0, w, h, topColor, bottomColor, Shader.TileMode.CLAMP);
        }

        float inset = Math.max(0.75f, 0.75f * scale);
        float radius = 10.5f * scale;
        rect.set(inset, inset, w - inset, h - inset);

        // Card fill + crisp border
        paint.setStyle(Paint.Style.FILL);
        paint.setShader(cardGradient);
        canvas.drawRoundRect(rect, radius, radius, paint);
        paint.setShader(null);

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(highlighted ? Math.max(1.5f, 1.5f * scale) : Math.max(1f, scale));
        paint.setColor(highlighted ? 0xccffffff : ((color & 0x00ffffff) | 0x58000000));
        canvas.drawRoundRect(rect, radius, radius, paint);
        paint.setStyle(Paint.Style.FILL);

        float padX = 4.5f * scale;
        float topY = 3.8f * scale;
        int iconSize = Math.round(10.5f * scale);

        // Top row: Exercise icon (left) + count/goal or selection order (right)
        if (iconDrawable != null) {
            int ix = Math.round(padX);
            int iy = Math.round(topY);
            iconDrawable.setBounds(ix, iy, ix + iconSize, iy + iconSize);
            iconDrawable.draw(canvas);
        }

        textPaint.setTypeface(boldFont);
        textPaint.setTextSize(Math.max(8.8f * scale, 11f));
        textPaint.setColor(highlighted ? 0xfffaf7ff : (level >= 10 ? 0xfffbbf24 : color));
        String fitMeta = TextUtils.ellipsize(meta, textPaint, Math.max(16f, w - padX * 2 - iconSize - 2f * scale), TextUtils.TruncateAt.END).toString();
        Paint.FontMetrics mfm = textPaint.getFontMetrics();
        float metaBaseline = topY + (iconSize - (mfm.ascent + mfm.descent)) / 2f;
        canvas.drawText(fitMeta, w - padX - textPaint.measureText(fitMeta), metaBaseline, textPaint);

        // Bottom pinned 10-segment level strip (always cleanly inside border)
        float barHeight = Math.max(2.2f, 2.4f * scale);
        float barBottom = h - 3.6f * scale;
        float barTop = barBottom - barHeight;
        float barLeft = padX;
        float barWidth = w - padX * 2;
        float segGap = Math.max(1f, 1.1f * scale);
        float segW = (barWidth - segGap * 9f) / 10f;
        int activeBarColor = level >= 10 ? 0xfffbbf24 : (highlighted ? 0xfffaf7ff : color);
        for (int s = 0; s < 10; s++) {
            float sx = barLeft + s * (segW + segGap);
            segRect.set(sx, barTop, sx + segW, barBottom);
            paint.setColor(s < level ? activeBarColor : 0x26ffffff);
            canvas.drawRoundRect(segRect, barHeight / 2f, barHeight / 2f, paint);
        }

        // Middle bounded 1–2 line exercise name (never overlaps top row or bottom bar)
        float textTop = topY + iconSize + 1.2f * scale;
        float textBottom = barTop - 1.8f * scale;
        float availH = Math.max(10f, textBottom - textTop);
        int availW = Math.max(16, Math.round(w - padX * 2));

        textPaint.setTypeface(mediumFont);
        textPaint.setColor(0xfffaf7ff);
        float nameSize = 9.8f * scale;
        textPaint.setTextSize(nameSize);
        StaticLayout layout = StaticLayout.Builder.obtain(title, 0, title.length(), textPaint, availW)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, 0.92f)
            .setIncludePad(false)
            .setMaxLines(2)
            .setEllipsize(TextUtils.TruncateAt.END)
            .build();
        if (layout.getHeight() > availH) {
            textPaint.setTextSize(8.6f * scale);
            layout = StaticLayout.Builder.obtain(title, 0, title.length(), textPaint, availW)
                .setAlignment(Layout.Alignment.ALIGN_CENTER)
                .setLineSpacing(0f, 0.90f)
                .setIncludePad(false)
                .setMaxLines(2)
                .setEllipsize(TextUtils.TruncateAt.END)
                .build();
        }
        canvas.save();
        float ty = textTop + Math.max(0f, (availH - layout.getHeight()) / 2f);
        canvas.translate(padX, ty);
        layout.draw(canvas);
        canvas.restore();
    }
}
