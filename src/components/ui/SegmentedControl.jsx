import React, { useState, useEffect } from 'react';

/**
 * A premium segmented control (switch/tabs) used across the app.
 * Based on the Cardio dashboard design.
 */
export function SegmentedControl({ options, value, onChange, style = {} }) {
  const [isBumping, setIsBumping] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Sync state with prop change during render to avoid useEffect cascading renders
  if (value !== prevValue) {
    setPrevValue(value);
    setIsBumping(true);
  }

  useEffect(() => {
    if (isBumping) {
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isBumping]);

  const activeIndex = options.findIndex(o => o.id === value);
  const activeOption = options[activeIndex] || options[0];

  return (
    <div
      onClick={() => {
        if (options.length === 2) {
          const nextIndex = activeIndex === 0 ? 1 : 0;
          onChange(options[nextIndex].id);
        }
      }}
      className={isBumping ? 'bump' : ''}
      style={{
        display: 'flex',
        background: 'var(--surface-subtle)',
        borderRadius: 'var(--radius-full)',
        padding: '3px',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        width: 'fit-content',
        position: 'relative',
        minWidth: '160px', // Ensure a minimum width for the slide effect
        ...style
      }}
    >
      {/* Sliding Indicator */}
      <div 
        style={{
          position: 'absolute',
          top: '3px',
          bottom: '3px',
          left: `calc(${(activeIndex * 100) / options.length}% + ${3 - (activeIndex * 6 / options.length)}px)`,
          width: `calc(${100 / options.length}% - ${6 / options.length}px)`,
          background: activeOption.activeBg || 'var(--gradient-glow)',
          borderRadius: 'var(--radius-full)',
          transition: 'left 0.30s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.30s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.30s ease',
          zIndex: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      />

      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={(e) => {
              if (options.length === 2) return; // Let it bubble to container for toggle logic
              e.stopPropagation();
              onChange(option.id);
            }}
            className=""
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'clamp(0.7rem, 1.3vh, 0.85rem)',
              fontWeight: '800',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.35s ease',
              background: 'transparent', // Indicator handles the background
              color: isActive 
                ? (option.activeColor || '#fff') 
                : 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: 'unset',
              flex: 1,
              position: 'relative',
              zIndex: 1,
              whiteSpace: 'nowrap'
            }}
          >
            {option.icon && <span>{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
