import React, { useState, useEffect } from 'react';

/**
 * A premium segmented control (switch/tabs) used across the app.
 * Based on the Cardio dashboard design.
 */
export function SegmentedControl({
  options,
  value,
  activeId,
  onChange,
  fullWidth,
  size = 'md',
  variant = 'default',
  className = '',
  style = {}
}) {
  const effectiveValue = value !== undefined ? value : activeId;
  const isFullWidth = fullWidth !== undefined ? fullWidth : style?.width === '100%';

  const [isBumping, setIsBumping] = useState(false);
  const [prevValue, setPrevValue] = useState(effectiveValue);

  // Sync state with prop change during render to avoid useEffect cascading renders
  if (effectiveValue !== prevValue) {
    setPrevValue(effectiveValue);
    setIsBumping(true);
  }

  useEffect(() => {
    if (isBumping) {
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isBumping]);

  const rawIndex = options.findIndex(o => o.id === effectiveValue);
  const activeIndex = rawIndex >= 0 ? rawIndex : 0;
  const activeOption = options[activeIndex] || options[0];

  const handleOptionClick = (clickedId) => {
    if (options.length === 2) {
      if (clickedId === effectiveValue) {
        const other = options.find(o => o.id !== clickedId) || options[0];
        onChange(other.id);
      } else {
        onChange(clickedId);
      }
    } else {
      onChange(clickedId);
    }
  };

  const PADS = { sm: 3, lg: 5, md: 4 };
  const PADDINGS = { sm: '4px 10px', lg: '8px 18px', md: '6px 14px' };
  const FONT_SIZES = { sm: '0.75rem', lg: '0.88rem', md: '0.82rem' };

  let pad = PADS[size] || 4;
  const count = options.length || 1;

  const fontSize = FONT_SIZES[size] || '0.82rem';

  const getVariantStyles = () => {
    switch (variant) {
      case 'tabs':
        return {
          container: {
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          },
          indicator: {
            background: activeOption.activeBg || 'var(--gradient-glow)',
            boxShadow: 'var(--shadow-sm)',
            border: 'none',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            top: `${pad}px`,
            bottom: `${pad}px`,
            height: 'auto',
          },
          textInactive: 'var(--text-secondary)',
          textActive: activeOption.activeColor || '#ffffff',
          buttonPadding: '10px 16px',
          buttonBorderRadius: 'calc(var(--radius-md) - 2px)',
        };
      case 'pills':
        return {
          container: {
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          },
          indicator: {
            background: activeOption.activeBg || 'var(--surface-elevated)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          },
          textInactive: 'var(--text-secondary)',
          textActive: activeOption.activeColor || 'var(--text-primary)',
          buttonPadding: '10px 14px',
          buttonBorderRadius: 'var(--radius-md)',
        };
      case 'default':
      default:
        return {
          container: {
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-full)',
          },
          indicator: {
            background: activeOption.activeBg || 'var(--gradient-glow)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
          },
          textInactive: 'var(--text-secondary)',
          textActive: activeOption.activeColor || '#ffffff',
        };
    }
  };

  const vStyles = getVariantStyles();
  const buttonPadding = vStyles.buttonPadding || PADDINGS[size] || '6px 14px';

  return (
    <div
      className={`${isBumping ? 'bump' : ''} ${className}`.trim() || undefined}
      style={{
        display: isFullWidth ? 'grid' : 'inline-grid',
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        padding: `${pad}px`,
        position: 'relative',
        width: isFullWidth ? '100%' : 'fit-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...vStyles.container,
        ...style
      }}
    >
      {/* Sliding Indicator */}
      <div 
        style={{
          position: 'absolute',
          top: `${pad}px`,
          bottom: `${pad}px`,
          left: `calc(${(activeIndex * 100) / count}% + ${pad}px)`,
          width: `calc(${100 / count}% - ${2 * pad}px)`,
          transition: 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s ease, bottom 0.28s ease',
          zIndex: 0,
          ...vStyles.indicator
        }}
      />

      {options.map((option) => {
        const isActive = option.id === effectiveValue;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleOptionClick(option.id)}
            style={{
              padding: buttonPadding,
              borderRadius: vStyles.buttonBorderRadius || vStyles.indicator.borderRadius || 'var(--radius-full)',
              fontSize: fontSize,
              fontWeight: '800',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.25s ease',
              background: 'transparent',
              color: isActive ? vStyles.textActive : vStyles.textInactive,
              cursor: 'pointer',
              minHeight: 'unset',
              position: 'relative',
              zIndex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
              boxSizing: 'border-box',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none'
            }}
          >
            {option.icon && <span>{option.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
