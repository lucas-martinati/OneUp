import React, { useRef, useState, useEffect } from 'react';

// Finite animations currently running inside the element (infinite ones such as
// pulses are ignored). These transiently alter the layout height — e.g. the
// panel's staggered translateY/opacity entrance — so measuring mid-animation
// would yield a scale that "settles" back once they finish.
function entranceAnimations(el) {
  try {
    return el.getAnimations({ subtree: true }).filter(
      a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity
    );
  } catch {
    return [];
  }
}

// Resolves when all given animations finish/cancel, or after a safety timeout
// so a hung animation can never block the measurement.
function waitForAnimations(animations) {
  return Promise.race([
    Promise.all(
      animations.map(
        a =>
          new Promise(res => {
            a.addEventListener('finish', res, { once: true });
            a.addEventListener('cancel', res, { once: true });
          })
      )
    ),
    new Promise(res => setTimeout(res, 1200))
  ]);
}

/**
 * FitToView component
 * Automatically measures available container height vs content natural height.
 * If content overflows available height, scales down the content so 100% of the UI
 * fits inside the container without scrolling.
 */
export function FitToView({
  children,
  minScale = 0.5,
  maxScale = 1,
  className = '',
  style = {},
  contentStyle = {},
  disabled = false
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [transitionsOn, setTransitionsOn] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let cancelled = false;
    let started = false;
    let raf = 0;
    let deferTimer = null;
    let cleanup = () => {};

    const updateScale = () => {
      const running = entranceAnimations(content);
      if (running.length > 0) {
        if (deferTimer) return;
        deferTimer = waitForAnimations(running).then(() => {
          deferTimer = null;
          if (!cancelled) updateScale();
        });
        return;
      }

      const availableHeight = container.clientHeight;
      const contentHeight = content.scrollHeight;

      if (contentHeight > availableHeight && availableHeight > 0) {
        const rawRatio = availableHeight / contentHeight;
        const newScale = Math.max(minScale, Math.min(maxScale, rawRatio));
        setScale(prev => (Math.abs(prev - newScale) > 0.001 ? newScale : prev));
      } else {
        setScale(prev => (prev !== 1 ? 1 : prev));
      }
    };

    // Re-measure whenever the content's DOM changes (lazy/Suspense children,
    // done-state flips…). ResizeObserver only fires on box-size changes, and a
    // height:100% wrapper won't report growth in its scrollHeight — which is
    // exactly when content overflows and the bottom (counter button) would get
    // clipped instead of scaled down.
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateScale();
      });
    };

    // Attach observers and take the first measurement. Runs once fonts are
    // ready so the initial scale is computed against the final metrics.
    const bootstrap = () => {
      if (cancelled || started) return;
      started = true;

      const observer = new ResizeObserver(updateScale);
      observer.observe(container);
      observer.observe(content);

      const mutObserver = new MutationObserver(schedule);
      mutObserver.observe(content, { childList: true, subtree: true, characterData: true });

      updateScale();

      // Smooth any later correction (e.g. a font that still settles) instead of
      // snapping; one frame later so the initial scale is applied without
      // animating from scale 1.
      requestAnimationFrame(() => {
        if (!cancelled) setTransitionsOn(true);
      });

      // Re-measure again a little later to catch any late reflow.
      const lateTimers = [400, 1200].map(ms => setTimeout(updateScale, ms));

      cleanup = () => {
        observer.disconnect();
        mutObserver.disconnect();
        lateTimers.forEach(clearTimeout);
        if (raf) cancelAnimationFrame(raf);
      };
    };

    // Fonts load asynchronously. Measuring against the fallback fonts yields a
    // scale that only corrects ~1s later, so the panel looks "slightly too
    // high" until it settles. Defer the first measurement until the fonts are
    // ready (usually already the case by the time the panel opens) so it is
    // correct from the very first frame. A short safety timer covers browsers
    // where fonts.ready never resolves.
    let fontTimer = 0;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      fontTimer = setTimeout(bootstrap, 1500);
      document.fonts.ready
        .then(() => {
          clearTimeout(fontTimer);
          bootstrap();
        })
        .catch(() => {});
    } else {
      bootstrap();
    }

    return () => {
      cancelled = true;
      clearTimeout(fontTimer);
      cleanup();
    };
  }, [minScale, maxScale, disabled]);

  const isScaled = scale < 1 && !disabled;

  return (
    <div
      ref={containerRef}
      className={`fit-to-view-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        position: 'relative',
        boxSizing: 'border-box',
        // Center the (possibly wider-than-container, scaled) content. As a
        // plain block the content would be left-aligned, so once scaled its
        // own center sits right of the container center and the panel looks
        // shifted to the right. Flexbox centers overflows symmetrically, which
        // pairs with the content's `transform-origin: top center`.
        // `align-items: flex-start` (not stretch) is required so the scaled
        // content keeps its `max-content` height instead of being stretched.
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        ...style
      }}
    >
      <div
        ref={contentRef}
        className="fit-to-view-content"
        style={{
          // `contentStyle` is spread last on purpose: layouts that distribute
          // their children across the full container (e.g. the exercise panel's
          // `justify-content: space-between`) need a fixed `height: 100%` even
          // while scaled, otherwise each re-measure toggles between a 100%-box
          // (children overflow → scale down) and a max-content box (fits →
          // scale 1) and the panel flickers. The scaling-critical props below
          // stay overridable for those consumers.
          boxSizing: 'border-box',
          // The container is now a flexbox (for symmetric centering of the
          // scaled content) — keep the explicit width from shrinking back.
          flexShrink: 0,
          width: isScaled ? `${(100 / scale).toFixed(3)}%` : '100%',
          height: isScaled ? 'max-content' : '100%',
          transform: isScaled ? `scale(${scale})` : 'none',
          transformOrigin: 'top center',
          transition: transitionsOn ? 'transform 320ms cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          ...contentStyle
        }}
      >
        {children}
      </div>
    </div>
  );
}
