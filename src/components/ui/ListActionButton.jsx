import { forwardRef, useCallback } from 'react';
import { haptics } from '@utils/hapticsManager';

/**
 * Tiny action buttons specifically for list reordering and deletion.
 */
export const ListActionButton = forwardRef(function ListActionButton(
  {
    icon: Icon,
    onClick,
    disabled = false,
    variant = 'default', // 'default' | 'ghost' | 'danger'
    shape = 'circle', // 'circle' | 'up' | 'down'
    className,
    style,
    type = 'button',
    ...rest
  },
  ref
) {
  const handleClick = useCallback(
    (e) => {
      haptics.light();
      onClick?.(e);
    },
    [onClick]
  );

  let shapeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    flexShrink: 0,
    padding: 0,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.2s ease, color 0.2s ease, opacity 0.2s ease'
  };

  if (shape === 'circle') {
    shapeStyle.borderRadius = '50%';
  } else if (shape === 'up') {
    shapeStyle.borderRadius = '6px 6px 2px 2px';
    shapeStyle.height = '18px';
  } else if (shape === 'down') {
    shapeStyle.borderRadius = '2px 2px 6px 6px';
    shapeStyle.height = '18px';
  }

  let colorStyle = {};
  if (variant === 'danger') {
    colorStyle = {
      background: 'color-mix(in srgb, var(--error) 10%, transparent)',
      color: 'color-mix(in srgb, var(--error) 70%, var(--text-primary))',
      opacity: disabled ? 0.35 : 1,
    };
  } else if (variant === 'ghost') {
    colorStyle = {
      background: 'transparent',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
      opacity: disabled ? 0.35 : 1,
    };
  } else {
    colorStyle = {
      background: 'var(--surface-dim)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
      opacity: disabled ? 0.35 : 1,
    };
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={className}
      style={{ ...shapeStyle, ...colorStyle, ...style }}
      {...rest}
    >
      {Icon && <Icon size={shape === 'circle' ? 14 : 12} />}
    </button>
  );
});
