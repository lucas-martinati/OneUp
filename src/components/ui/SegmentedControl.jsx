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

  const pad = PADS[size] || 4;
  const count = options.length || 1;

  const buttonPadding = PADDINGS[size] || '6px 14px';
  const fontSize = FONT_SIZES[size] || '0.82rem';

  return (
    <div
      className={`${isBumping ? 'bump' : ''} ${className}`.trim() || undefined}
      style={{
        display: isFullWidth ? 'grid' : 'inline-grid',
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        background: 'var(--surface-subtle)',
        borderRadius: 'var(--radius-full)',
        padding: `${pad}px`,
        border: '1px solid var(--border-default)',
        position: 'relative',
        width: isFullWidth ? '100%' : 'fit-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
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
          background: activeOption.activeBg || 'var(--gradient-glow)',
          borderRadius: 'var(--radius-full)',
          transition: 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s ease',
          zIndex: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
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
              borderRadius: 'var(--radius-full)',
              fontSize: fontSize,
              fontWeight: '800',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.25s ease',
              background: 'transparent',
              color: isActive 
                ? (option.activeColor || '#ffffff') 
                : 'var(--text-secondary)',
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
