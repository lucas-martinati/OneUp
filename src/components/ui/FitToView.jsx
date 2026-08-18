import React, { useRef, useState, useEffect } from 'react';

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

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateScale = () => {
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

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    observer.observe(content);

    // Re-measure whenever the content's DOM changes (lazy/Suspense children,
    // done-state flips, fonts…). ResizeObserver only fires on box-size changes,
    // and a height:100% wrapper won't report growth in its scrollHeight — which
    // is exactly when content overflows and the bottom (counter button) would
    // get clipped instead of scaled down.
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateScale();
      });
    };
    const mutObserver = new MutationObserver(schedule);
    mutObserver.observe(content, { childList: true, subtree: true, characterData: true });

    updateScale();

    return () => {
      observer.disconnect();
      mutObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
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
        ...style
      }}
    >
      <div
        ref={contentRef}
        className="fit-to-view-content"
        style={{
          width: isScaled ? `${(100 / scale).toFixed(3)}%` : '100%',
          height: isScaled ? 'max-content' : '100%',
          transform: isScaled ? `scale(${scale})` : 'none',
          transformOrigin: 'top center',
          boxSizing: 'border-box',
          ...contentStyle
        }}
      >
        {children}
      </div>
    </div>
  );
}
