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

export function SkeletonCard({ height = '120px', className = '', ...props }) {
  return (
    <div
      className={`skeleton-card ${className}`}
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
      {...props}
    >
      <Skeleton width="40%" height="1.2rem" />
      <Skeleton width="85%" height="0.9rem" />
      <Skeleton width="60%" height="0.9rem" />
    </div>
  );
} 
