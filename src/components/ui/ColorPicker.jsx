import React from 'react';

export function ColorPicker({ colors, selectedColor, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
      {colors.map(c => (
        <button 
          key={c} 
          onClick={() => onChange(c)} 
          className="hover-lift" 
          style={{
            width: '38px', 
            height: '38px', 
            borderRadius: '50%',
            background: c, 
            border: selectedColor === c ? '3px solid white' : 'none',
            boxShadow: selectedColor === c ? `0 0 0 3px ${c}50` : 'none',
            cursor: 'pointer', 
            transition: 'all 0.2s', 
            padding: 0
          }} 
          aria-label={`Select color ${c}`}
        />
      ))}
    </div>
  );
}
