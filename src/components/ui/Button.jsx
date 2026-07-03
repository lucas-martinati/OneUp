import { forwardRef, useCallback } from 'react';
import { haptics } from '@utils/hapticsManager';

/**
 * Canonical button primitive for the whole app.
 *
 * Replaces the dozens of hand-rolled `<button style={{…}}>` blocks that each
 * re-declared padding / radius / gradients with slightly different (and often
 * hard-coded) values. All chrome lives in styles/button.css (`.btn*` classes),
 * driven by the design tokens, so buttons stay consistent across all themes
 * and are covered by the [data-perf="low"] / reduced-motion overrides.
 *
 * @param {'primary'|'secondary'|'success'|'danger'|'ghost'|'danger-ghost'} [variant='primary']
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {boolean} [fullWidth=false] – stretch to container width
 * @param {React.ComponentType} [icon] – leading icon component (lucide-style)
 * @param {React.ComponentType} [iconRight] – trailing icon component
 * @param {boolean} [loading=false] – show spinner + disable interaction
 * @param {string} [className] – extra classes, merged after the .btn ones
 * @param {object} [style] – escape hatch for one-off overrides
 */
const ICON_SIZE = { sm: 16, md: 18, lg: 20 };

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    children,
    className,
    style,
    type = 'button',
    onClick,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  // Light physical tap on every press (no-op on web / when haptics are off).
  const handleClick = useCallback(
    (e) => {
      haptics.light();
      onClick?.(e);
    },
    [onClick],
  );

  const classes = [
    'btn',
    `btn--${size}`,
    `btn--${variant}`,
    fullWidth && 'btn--full',
    className,
  ].filter(Boolean).join(' ');

  const iconPx = ICON_SIZE[size];

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      className={classes}
      style={style}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          style={{
            width: iconPx,
            height: iconPx,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      ) : (
        Icon && <Icon size={iconPx} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={iconPx} />}
    </button>
  );
});
