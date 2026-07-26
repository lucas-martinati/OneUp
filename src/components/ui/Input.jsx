import { forwardRef, useId } from 'react';

/**
 * Standardized Form Input primitive for the entire app.
 * Replaces ad-hoc `<input>` and `<select>` tags across all modals and panels.
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    iconRight: IconRight,
    type = 'text',
    size = 'md',
    fullWidth = true,
    options = [],
    className = '',
    style,
    disabled = false,
    id: customId,
    children,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = customId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const isSelect = type === 'select';
  const IconComponent = Icon;
  const IconRightComponent = IconRight;

  let describedBy;
  if (error) {
    describedBy = errorId;
  } else if (helperText) {
    describedBy = helperId;
  }

  return (
    <div
      className={`input-group ${fullWidth ? 'input-group--full' : ''} ${className}`.trim()}
      style={style}
    >
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-wrapper input-wrapper--${size} ${error ? 'input-wrapper--error' : ''} ${disabled ? 'input-wrapper--disabled' : ''}`}>
        {IconComponent && <IconComponent className="input-icon input-icon--left" size={size === 'sm' ? 14 : 18} />}
        
        {isSelect ? (
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="input-field input-field--select"
            {...rest}
          >
            {options.map((opt) => (
              <option key={opt.value ?? opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
        ) : (
          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="input-field"
            {...rest}
          />
        )}

        {IconRightComponent && <IconRightComponent className="input-icon input-icon--right" size={size === 'sm' ? 14 : 18} />}
      </div>

      {error && (
        <span id={errorId} className="input-error" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
});
