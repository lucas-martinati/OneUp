import React, { useState, useEffect } from 'react';

/**
 * A premium segmented control (switch/tabs) used across the app.
 * Based on the Cardio dashboard design.
 */
export function SegmentedControl({ options, value, onChange, style = {} }) {
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    setIsBumping(true);
    const timer = setTimeout(() => setIsBumping(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      onClick={() => {
        if (options.length === 2) {
          const nextIndex = options.findIndex(o => o.id === value) === 0 ? 1 : 0;
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
        ...style
      }}
    >
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
            className={isActive ? 'hover-lift' : ''}
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
              transition: 'all 0.25s ease',
              background: isActive 
                ? (option.activeBg || 'var(--gradient-glow)') 
                : 'transparent',
              color: isActive 
                ? (option.activeColor || '#fff') 
                : 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: 'unset',
              flex: 1
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
