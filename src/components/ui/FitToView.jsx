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
    if (disabled) {
      setScale(1);
      return;
    }

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateScale = () => {
      const availableHeight = container.clientHeight;
      const contentHeight = content.scrollHeight;

      if (contentHeight > availableHeight && availableHeight > 0) {
        const rawRatio = availableHeight / contentHeight;
        const newScale = Math.max(minScale, Math.min(maxScale, rawRatio));
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    observer.observe(content);
    updateScale();

    return () => observer.disconnect();
  }, [minScale, maxScale, disabled]);

  const isScaled = scale < 1 && !disabled;

  return (
    <div
      ref={containerRef}
      className={`fit-to-view-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
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
          transition: 'transform 0.15s ease-out, width 0.15s ease-out',
          boxSizing: 'border-box',
          ...contentStyle
        }}
      >
        {children}
      </div>
    </div>
  );
}
