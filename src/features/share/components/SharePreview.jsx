import React, { useRef, useState, useLayoutEffect } from 'react';
import { Maximize2 } from '@utils/icons';
import { useBackHandler } from '@hooks/useBackHandler';

/** Measures a fixed-size card and returns the scale/box to fit constraints. */
function useFitBox(contentRef, containerRef, computeScale) {
  const [box, setBox] = useState(null); // { scale, width, height }

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const update = () => {
      const cardW = content.offsetWidth;
      const cardH = content.offsetHeight;
      if (!cardW || !cardH) return;
      const availW = containerRef?.current?.clientWidth ?? window.innerWidth;
      if (!availW) return;
      const scale = computeScale({ cardW, cardH, availW });
      setBox(prev => {
        const next = { scale, width: Math.round(cardW * scale), height: Math.round(cardH * scale) };
        if (prev && Math.abs(prev.height - next.height) <= 1 && Math.abs(prev.width - next.width) <= 1) return prev;
        return next;
      });
    };

    update();
    window.addEventListener('resize', update);
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(content);
      if (containerRef?.current) ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
    // computeScale is stable per mode; refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return box;
}

const tapZoomScale = ({ cardW }) => Math.min(1, (window.innerWidth * 0.94) / cardW);

/**
 * Fullscreen viewer for touch devices: width-fitted and vertically
 * scrollable so long (>9:16) cards can be inspected; tap closes it.
 */
function CardZoomOverlay({ onClose, children }) {
  const contentRef = useRef(null);
  const box = useFitBox(contentRef, null, tapZoomScale);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        overflowY: 'auto',
        padding: '20px 0',
        animation: 'overlayFadeIn 0.15s ease-out',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* margin:auto centers short cards and scrolls long ones correctly */}
      <div style={{
        width: box ? `${box.width}px` : 'auto',
        height: box ? `${box.height}px` : 'auto',
        margin: 'auto',
        flexShrink: 0,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div
          ref={contentRef}
          style={{
            transform: box ? `scale(${box.scale})` : 'none',
            transformOrigin: 'top left',
            width: 'max-content',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * SharePreview — scale-to-fit wrapper for the ShareCard.
 * The card renders at its fixed logical size (540px wide, snapped height);
 * this wrapper scales it down so the full card always stays visible next to
 * the options. On touch devices, tapping the preview opens a fullscreen,
 * scrollable viewer for long cards.
 *
 * `zoomContent` must be a second render of the same card WITHOUT cardRef /
 * onFormatChange, so the enlarged copy never steals the export ref.
 */
export function SharePreview({ formatLabel, zoomContent, className, children }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  // Evaluated once: does the device have a real pointer?
  const [canHover] = useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  );

  // Desktop: width-driven, the card fills the column and its height follows.
  // Mobile: also capped by the fixed 45vh stage (see ShareModal.module.css),
  // so toggling options never shifts the controls below the preview.
  const box = useFitBox(contentRef, containerRef, ({ cardW, cardH, availW }) => {
    const wScale = Math.min(1, availW / cardW);
    if (window.matchMedia('(min-width: 768px)').matches) return wScale;
    return Math.min(wScale, (window.innerHeight * 0.45) / cardH);
  });

  // Android back button closes the fullscreen viewer first
  useBackHandler(() => {
    if (zoomed) {
      setZoomed(false);
      return true;
    }
    return false;
  }, zoomed);

  const showZoom = zoomed && !!zoomContent;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
    >
      <div
        onClick={!canHover ? () => setZoomed(true) : undefined}
        style={{
          width: box ? `${box.width}px` : 'auto',
          height: box ? `${box.height}px` : 'auto',
          overflow: 'hidden',
          borderRadius: '16px',
          transition: 'height 0.25s ease',
          cursor: canHover ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: box ? `scale(${box.scale})` : 'none',
            transformOrigin: 'top left',
            width: 'max-content',
          }}
        >
          {children}
        </div>
        {/* Touch hint: the preview expands fullscreen */}
        {!canHover && (
          <span style={{
            position: 'absolute', bottom: '8px', right: '8px',
            width: '26px', height: '26px', borderRadius: '9px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Maximize2 size={14} color="rgba(255,255,255,0.8)" />
          </span>
        )}
        {formatLabel && (
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            padding: '3px 8px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px',
            pointerEvents: 'none',
          }}>
            {formatLabel}
          </span>
        )}
      </div>
      {showZoom && (
        <CardZoomOverlay onClose={() => setZoomed(false)}>
          {zoomContent}
        </CardZoomOverlay>
      )}
    </div>
  );
}
