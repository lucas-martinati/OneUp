import React, { useState } from 'react';
import { Edit2, Check, X, Trash2, ChevronRight, ChevronDown } from '../../utils/icons';

// Deep immutable updates
function setDeepValue(obj, path, value) {
  if (!path) return value;
  const parts = path.split('.');
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return newObj;
}

// Deep immutable deletes
function deleteDeepValue(obj, path) {
  if (!path) return {};
  const parts = path.split('.');
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  if (Array.isArray(current)) {
    current.splice(Number(parts[parts.length - 1]), 1);
  } else {
    delete current[parts[parts.length - 1]];
  }
  return newObj;
}

function JsonTreeNode({ 
  name, 
  value, 
  path = '', 
  onValueChange, 
  onDelete, 
  depth = 0 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rawError, setRawError] = useState(null);

  // Type checks
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handlePrimitiveChange = (newValue) => {
    onValueChange(path, newValue);
  };

  const handleRawSave = () => {
    try {
      const parsed = JSON.parse(rawText);
      onValueChange(path, parsed);
      setIsEditingRaw(false);
      setRawError(null);
    } catch (err) {
      setRawError(err.message);
    }
  };

  const startRawEdit = () => {
    setRawText(JSON.stringify(value, null, 2));
    setRawError(null);
    setIsEditingRaw(true);
  };

  const indentStyle = { paddingLeft: `${depth * 16}px` };

  // 1. Raw Text Editor mode for a subtree
  if (isEditingRaw) {
    return (
      <div style={{ ...indentStyle, marginTop: '8px', marginBottom: '8px', padding: '12px', background: '#07070a', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#a78bfa', fontWeight: 'bold' }}>
            {name ? `"${name}": ` : ''} (JSON brut)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={handleRawSave} 
              style={{
                padding: '4px 8px', fontSize: '0.72rem', background: '#10b981', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Check size={12} /> OK
            </button>
            <button 
              onClick={() => setIsEditingRaw(false)} 
              style={{
                padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <X size={12} /> Annuler
            </button>
          </div>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          spellCheck="false"
          style={{
            width: '100%', height: '140px', background: '#020204', color: '#c084fc',
            fontFamily: 'Fira Code, Consolas, Monaco, monospace', fontSize: '0.8rem', padding: '8px',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
        {rawError && (
          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontFamily: 'monospace', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '4px' }}>
            ⚠️ {rawError}
          </div>
        )}
      </div>
    );
  }

  // 2. Leaf/Primitive values mode
  if (isPrimitive) {
    let valueElement;
    if (typeof value === 'boolean') {
      valueElement = (
        <input 
          type="checkbox" 
          checked={value} 
          onChange={(e) => handlePrimitiveChange(e.target.checked)}
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#a78bfa' }}
        />
      );
    } else if (typeof value === 'number') {
      valueElement = (
        <input 
          type="number" 
          value={value} 
          onChange={(e) => handlePrimitiveChange(Number(e.target.value))}
          style={{
            background: '#07070a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px',
            color: '#60a5fa', fontFamily: 'monospace', width: '80px', outline: 'none', fontSize: '0.8rem',
            padding: '2px 6px', boxSizing: 'border-box'
          }}
        />
      );
    } else if (value === null) {
      valueElement = <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold' }}>null</span>;
    } else {
      // String
      valueElement = (
        <input 
          type="text" 
          value={value} 
          onChange={(e) => handlePrimitiveChange(e.target.value)}
          style={{
            background: '#07070a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px',
            color: '#34d399', fontFamily: 'monospace', width: '100%', maxWidth: '350px', outline: 'none', fontSize: '0.8rem',
            padding: '2px 6px', boxSizing: 'border-box'
          }}
        />
      );
    }

    return (
      <div 
        style={{
          display: 'flex', alignItems: 'center', minHeight: '30px', ...indentStyle,
          fontSize: '0.8rem', fontFamily: 'monospace', padding: '2px 8px', borderRadius: '4px',
          gap: '8px'
        }}
        className="json-tree-row"
      >
        <span style={{ color: '#c084fc', userSelect: 'none' }}>
          {name ? `"${name}":` : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {valueElement}
          {onDelete && (
            <button 
              onClick={() => onDelete(path)}
              title="Supprimer cette clé"
              style={{
                background: 'transparent', border: 'none', color: '#ef4444',
                cursor: 'pointer', padding: '2px 6px', opacity: 0.4, display: 'flex', alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Object / Array Collapsible node mode
  const childKeys = isObject ? Object.keys(value) : Array.from({ length: value.length }, (_, i) => i);
  const isEmpty = childKeys.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Node Header Row */}
      <div 
        style={{
          display: 'flex', alignItems: 'center', minHeight: '30px', ...indentStyle,
          fontSize: '0.8rem', fontFamily: 'monospace', cursor: 'pointer', padding: '2px 8px',
          borderRadius: '4px', gap: '6px', userSelect: 'none'
        }}
        onClick={toggleExpand}
        className="json-tree-row"
      >
        <span style={{ 
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s ease',
          transform: isExpanded ? 'rotate(90deg)' : 'none'
        }}>
          <ChevronRight size={14} />
        </span>
        
        <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>
          {name ? `"${name}": ` : ''}
        </span>
        
        <span style={{ color: '#e5e7eb' }}>
          {isObject ? '{' : '['}
        </span>

        {!isExpanded && (
          <span style={{ color: '#6b7280', fontSize: '0.75rem', fontStyle: 'italic', marginLeft: '4px' }}>
            {isObject ? ` ... } (${childKeys.length} clés)` : ` ... ] (${childKeys.length} éléments)`}
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={startRawEdit}
            title="Modifier en JSON"
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.65rem',
              padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
            }}
          >
            <Edit2 size={10} />
            <span>Modifier</span>
          </button>
          
          {onDelete && (
            <button 
              onClick={() => onDelete(path)}
              title="Supprimer"
              style={{
                background: 'transparent', border: 'none', color: '#ef4444',
                cursor: 'pointer', padding: '2px 6px', opacity: 0.4, display: 'flex', alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Indented recursive children */}
      {isExpanded && !isEmpty && (
        <div style={{ 
          display: 'flex', flexDirection: 'column', 
          borderLeft: '1px dashed rgba(255,255,255,0.06)', 
          marginLeft: `${depth * 16 + 18}px`,
          paddingLeft: '4px'
        }}>
          {childKeys.map((key) => {
            const childName = isObject ? key : null;
            const childPath = path ? `${path}.${key}` : key;
            return (
              <JsonTreeNode
                key={key}
                name={childName}
                value={value[key]}
                path={childPath}
                onValueChange={onValueChange}
                onDelete={onDelete}
                depth={0}
              />
            );
          })}
        </div>
      )}

      {/* Closing bracket */}
      {isExpanded && (
        <div style={{ ...indentStyle, paddingLeft: `${depth * 16 + 20}px`, fontSize: '0.8rem', fontFamily: 'monospace', color: '#e5e7eb', minHeight: '20px', display: 'flex', alignItems: 'center' }}>
          {isObject ? '}' : ']'}
        </div>
      )}
    </div>
  );
}

export function JsonTreeEditor({ value, onChange }) {
  // Safe parsing of incoming value (could be object or json string)
  let parsedValue = value;
  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = {};
    }
  }

  const handleValueChange = (path, newValue) => {
    const updated = setDeepValue(parsedValue, path, newValue);
    onChange(updated);
  };

  const handleDelete = (path) => {
    const updated = deleteDeepValue(parsedValue, path);
    onChange(updated);
  };

  return (
    <div style={{
      background: '#040406',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 12px',
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight: '400px',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
    }}>
      <JsonTreeNode
        name={null}
        value={parsedValue}
        path=""
        onValueChange={handleValueChange}
        onDelete={null} // Cannot delete root
        depth={0}
      />
    </div>
  );
}
