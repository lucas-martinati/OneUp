import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

/**
 * Unified Empty State component for lists, charts, routines, and custom exercises.
 */
export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`empty-state-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        textAlign: 'center',
        padding: 'var(--space-8) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
        border: '1px dashed rgba(255, 255, 255, 0.12)',
        gap: 'var(--space-3)',
        margin: 'var(--space-4) 0',
        ...style,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-glow)',
          marginBottom: 'var(--space-1)',
        }}
      >
        <Icon size={28} />
      </div>

      {title && (
        <h3
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h3>
      )}

      {description && (
        <p
          style={{
            margin: 0,
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            maxWidth: '320px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
