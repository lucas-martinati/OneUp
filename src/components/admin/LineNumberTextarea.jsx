import React, { useRef } from 'react';

// Custom Line-Numbered Textarea resembling VSCode
export function LineNumberTextarea({ value, onChange, placeholder, height = '350px' }) {
  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  const textareaRef = useRef(null);
  const lineRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && lineRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange({ target: { value: newValue } });

      // Keep cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div style={{
      display: 'flex',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      background: '#0a0a0f',
      overflow: 'hidden',
      height: height,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
    }}>
      {/* Line Numbers column */}
      <div
        ref={lineRef}
        style={{
          width: '44px', padding: '16px 8px', background: '#07070a',
          color: '#555577', textAlign: 'right', fontFamily: 'Fira Code, Consolas, Monaco, monospace',
          fontSize: '0.85rem', lineHeight: '1.5', overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.05)', userSelect: 'none',
          whiteSpace: 'pre', boxSizing: 'border-box'
        }}
      >
        {lineNumbers}
      </div>
      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
        style={{
          flex: 1, padding: '16px', background: 'transparent',
          color: '#c084fc', fontFamily: 'Fira Code, Consolas, Monaco, monospace', fontSize: '0.85rem',
          lineHeight: '1.5', border: 'none', outline: 'none',
          resize: 'none', height: '100%', boxSizing: 'border-box',
          overflowY: 'auto', whiteSpace: 'pre', tabSize: 2
        }}
      />
    </div>
  );
}
