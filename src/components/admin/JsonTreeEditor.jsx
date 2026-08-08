import React, { useState } from 'react';
import { Edit2, Check, X, Trash2, ChevronRight, Plus } from '@utils/icons';
import { Button } from '@components/ui';

/** Children beyond this count start collapsed to keep big nodes (e.g. progress
 *  completions) readable and fast to render. */
const AUTO_COLLAPSE_THRESHOLD = 15;

/** Bouton "supprimer" (icône poubelle, opacité au survol) réutilisé dans l'arbre. */
function DeleteButton({ onClick, title }) {
  return (
    <Button variant="danger-ghost" size="sm"
      onClick={onClick}
      title={title}
      style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', opacity: 0.7 }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
    >
      <Trash2 size={12} />
    </Button>
  );
}

/** Parse a raw text value as JSON, falling back to a plain string. */
function parseLooseValue(raw) {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
}

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

function JsonTreeNode({ 
  name, 
  value, 
  path = '', 
  onValueChange, 
  onDelete, 
  depth = 0 
}) {
  // Big nodes (and everything below the root) start collapsed so a user with
  // hundreds of completion days doesn't render the whole tree at once.
  const [isExpanded, setIsExpanded] = useState(() => {
    if (path === '') return true; // section root stays open
    if (value !== null && typeof value === 'object') {
      const count = Array.isArray(value) ? value.length : Object.keys(value).length;
      return count <= AUTO_COLLAPSE_THRESHOLD;
    }
    return true;
  });
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rawError, setRawError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [addError, setAddError] = useState(null);

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

  const startAdd = (e) => {
    e.stopPropagation();
    setNewKey('');
    setNewVal('');
    setAddError(null);
    setIsAdding(true);
    setIsExpanded(true);
  };

  const handleAddConfirm = () => {
    const parsedVal = parseLooseValue(newVal);
    if (isObject) {
      const k = newKey.trim();
      if (!k) { setAddError('Nom de clé requis'); return; }
      if (Object.prototype.hasOwnProperty.call(value, k)) { setAddError('Cette clé existe déjà'); return; }
      onValueChange(path, { ...value, [k]: parsedVal });
    } else {
      onValueChange(path, [...value, parsedVal]);
    }
    setIsAdding(false);
    setNewKey('');
    setNewVal('');
    setAddError(null);
  };

  const indentStyle = { paddingLeft: `${depth * 16}px` };

  // 1. Raw Text Editor mode for a subtree
  if (isEditingRaw) {
    return (
      <div style={{ ...indentStyle, marginTop: '8px', marginBottom: '8px', padding: '12px', background: '#07070a', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-violet)', fontWeight: 'bold' }}>
            {name ? `"${name}": ` : ''} (JSON brut)
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button variant="success" size="sm"
              onClick={handleRawSave} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={12} /> OK
            </Button>
            <Button variant="secondary" size="sm"
              onClick={() => setIsEditingRaw(false)} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={12} /> Annuler
            </Button>
          </div>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          spellCheck="false"
          style={{
            width: '100%', height: '140px', background: '#020204', color: '#c084fc',
            fontFamily: 'Fira Code, Consolas, Monaco, monospace', fontSize: '0.8rem', padding: '8px',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
        {rawError && (
          <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px', fontFamily: 'monospace', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '4px' }}>
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
          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-violet)' }}
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
            color: 'var(--color-emerald)', fontFamily: 'monospace', width: '100%', maxWidth: '350px', outline: 'none', fontSize: '0.8rem',
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
            <DeleteButton onClick={() => onDelete(path)} title="Supprimer cette clé" />
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
          <Button variant="secondary" size="sm"
            onClick={startAdd}
            title={isObject ? 'Ajouter une clé' : 'Ajouter un élément'}
            style={{ color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 10px', height: '32px', minHeight: '32px' }}
          >
            <Plus size={10} />
            <span>Ajouter</span>
          </Button>

          <Button variant="secondary" size="sm"
            onClick={startRawEdit}
            title="Modifier en JSON"
            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 10px', height: '32px', minHeight: '32px' }}
          >
            <Edit2 size={10} />
            <span>Modifier</span>
          </Button>

          {onDelete && (
            <DeleteButton onClick={() => onDelete(path)} title="Supprimer" />
          )}
        </div>
      </div>

      {/* Inline "add key / add item" form */}
      {isExpanded && isAdding && (
        <div style={{
          marginLeft: `${depth * 16 + 22}px`, marginTop: '6px', marginBottom: '6px',
          padding: '10px', background: '#07070a', borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(52,211,153,0.2)', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {isObject && (
              <input
                autoFocus
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleAddConfirm(); } if (e.key === 'Escape') { setIsAdding(false); } }}
                placeholder="nom de la clé"
                style={{
                  background: '#020204', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                  color: '#c084fc', fontFamily: 'monospace', fontSize: '0.8rem', padding: '4px 8px',
                  outline: 'none', width: '140px', boxSizing: 'border-box'
                }}
              />
            )}
            <input
              autoFocus={isArray}
              type="text"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleAddConfirm(); } if (e.key === 'Escape') { setIsAdding(false); } }}
              placeholder='valeur (ex: "texte", 42, true, {})'
              style={{
                background: '#020204', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px',
                color: 'var(--color-emerald)', fontFamily: 'monospace', fontSize: '0.8rem', padding: '4px 8px',
                outline: 'none', flex: 1, minWidth: '160px', boxSizing: 'border-box'
              }}
            />
            <Button variant="success" size="sm"
              onClick={handleAddConfirm}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={12} /> Ajouter
            </Button>
            <Button variant="secondary" size="sm"
              onClick={() => setIsAdding(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={12} /> Annuler
            </Button>
          </div>
          {addError && (
            <div style={{ color: 'var(--error)', fontSize: '0.72rem', fontFamily: 'monospace' }}>⚠️ {addError}</div>
          )}
          <div style={{ color: '#6b7280', fontSize: '0.68rem', fontStyle: 'italic' }}>
            La valeur est interprétée en JSON (nombre, booléen, objet, tableau…), sinon traitée comme texte.
          </div>
        </div>
      )}

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

  return (
    <div style={{
      background: '#040406',
      border: '1px solid var(--border-default)',
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
      />
    </div>
  );
}
