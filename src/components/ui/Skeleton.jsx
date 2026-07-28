import React from 'react';

/**
 * Skeleton component for fluid zero-CLS loading placeholders.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {},
  ...props
}) {
  const combinedStyle = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s infinite linear',
    ...style,
  };

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={combinedStyle}
      aria-hidden="true"
      {...props}
    />
  );
}
