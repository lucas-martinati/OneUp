import React, { useState } from 'react';
import { Save, Lock, Code, Copy, Check, RotateCcw } from '../../utils/icons';
import { JsonTreeEditor } from './JsonTreeEditor';
import { LineNumberTextarea } from './LineNumberTextarea';

/** Short human summary of a JSON document, e.g. "12 clés" / "3 éléments". */
function describeContent(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return `${parsed.length} élément${parsed.length > 1 ? 's' : ''}`;
    if (parsed && typeof parsed === 'object') {
      const n = Object.keys(parsed).length;
      return `${n} clé${n > 1 ? 's' : ''}`;
    }
    return String(parsed);
  } catch {
    return 'JSON invalide';
  }
}

/** Small copy-to-clipboard button with a transient "copied" confirmation. */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <button
      onClick={handleCopy}
      title="Copier le JSON"
      style={{
        padding: '6px 10px',
        background: 'var(--surface-hover)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-md)',
        color: copied ? '#34d399' : 'var(--text-secondary)',
        fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '4px'
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copié' : 'Copier'}
    </button>
  );
}

/** Accordion JSON editor: one collapsible section per database key plus a raw full-document section. */
export function AdminJsonSectionsEditor({
  selectedUserKeys,
  expandedKeys, onToggleKey,
  keyJsonContents, keyJsonErrors,
  keyEditorFormats, setKeyEditorFormats,
  keyJsonDirty = {},
  onRevertJson,
  onJsonChange, onFormatJson, onSaveJson,
  saveLoading, onBack
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {selectedUserKeys.map((key) => {
        const isExpanded = !!expandedKeys[key];
        const contentValue = keyJsonContents[key] || '';
        const hasError = keyJsonErrors[key];
        const isDirty = !!keyJsonDirty[key];
        const isFullDoc = key === '__full__';
        const canSave = isDirty && !hasError && !saveLoading;

        // Ctrl/Cmd+S saves the section being edited (keydown bubbles up from
        // the inner inputs/textarea to this wrapper).
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (canSave) onSaveJson(key);
          }
        };

        return (
          <div
            key={key}
            style={{
              borderRadius: 'var(--radius-lg)',
              border: isExpanded
                ? '1px solid rgba(167,139,250,0.3)'
                : (isDirty ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-subtle)'),
              background: isExpanded ? 'rgba(10, 10, 15, 0.6)' : 'var(--surface-section)',
              transition: 'all 0.2s ease',
              overflow: 'hidden'
            }}
          >
            {/* Accordion Header */}
            <div
              onClick={() => onToggleKey(key)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                background: isExpanded ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
                userSelect: 'none',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{
                  color: isExpanded ? '#a78bfa' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  display: 'inline-block'
                }}>
                  ▶
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  color: isFullDoc ? '#ef4444' : (isExpanded ? '#a78bfa' : 'var(--text-primary)'),
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap'
                }}>
                  {isFullDoc ? '📄 Fiche complète (Raw)' : `"${key}"`}
                </span>
                {isDirty && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: '800', color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '999px', padding: '2px 8px',
                    display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                  }}>
                    ● Modifié
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.7, whiteSpace: 'nowrap' }}>
                {isExpanded ? 'Clic pour plier' : describeContent(contentValue)}
              </span>
            </div>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="scale-in" onKeyDown={handleKeyDown} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                  {isFullDoc ? (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      color: '#fca5a5',
                      fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center'
                    }}>
                      <Lock size={12} />
                      <span>Édition globale directe.</span>
                    </div>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Editor Format Toggle Switcher */}
                    <div style={{
                      display: 'flex',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <button
                        onClick={() => setKeyEditorFormats(prev => ({ ...prev, [key]: 'tree' }))}
                        style={{
                          padding: '4px 10px',
                          background: keyEditorFormats[key] !== 'raw' ? 'rgba(255,255,255,0.08)' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          color: keyEditorFormats[key] !== 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Arborescence
                      </button>
                      <button
                        onClick={() => setKeyEditorFormats(prev => ({ ...prev, [key]: 'raw' }))}
                        style={{
                          padding: '4px 10px',
                          background: keyEditorFormats[key] === 'raw' ? 'rgba(255,255,255,0.08)' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          color: keyEditorFormats[key] === 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Code brut
                      </button>
                    </div>

                    {keyEditorFormats[key] === 'raw' && (
                      <button
                        onClick={() => onFormatJson(key)}
                        className="hover-lift"
                        style={{
                          padding: '6px 10px',
                          background: 'var(--surface-hover)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Code size={12} />
                        Formater
                      </button>
                    )}

                    <CopyButton text={contentValue} />

                    {isDirty && onRevertJson && (
                      <button
                        onClick={() => onRevertJson(key)}
                        title="Annuler les modifications non sauvegardées"
                        style={{
                          padding: '6px 10px',
                          background: 'var(--surface-hover)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          color: '#f59e0b',
                          fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <RotateCcw size={12} />
                        Annuler
                      </button>
                    )}

                    <button
                      disabled={!canSave}
                      onClick={() => onSaveJson(key)}
                      className="hover-lift"
                      title={isDirty ? 'Sauvegarder (Ctrl+S)' : 'Aucune modification à sauvegarder'}
                      style={{
                        padding: '6px 12px',
                        background: canSave ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: canSave ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: canSave ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: canSave ? 1 : 0.6
                      }}
                    >
                      <Save size={12} />
                      Sauvegarder
                    </button>
                  </div>
                </div>

                {/* Section Editor content (Tree or LineNumberTextarea) */}
                <div style={{ marginTop: '12px' }}>
                  {keyEditorFormats[key] !== 'raw' ? (
                    <JsonTreeEditor
                      value={contentValue}
                      onChange={(newValue) => {
                        const textVal = JSON.stringify(newValue, null, 2);
                        onJsonChange(key, textVal);
                      }}
                    />
                  ) : (
                    <LineNumberTextarea
                      value={contentValue}
                      onChange={(e) => onJsonChange(key, e.target.value)}
                      placeholder={`Saisissez le contenu pour ${key}...`}
                      height={isFullDoc ? '380px' : '220px'}
                    />
                  )}
                </div>

                {/* Live syntax error check for this section */}
                {keyEditorFormats[key] === 'raw' && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: hasError ? '#ef4444' : '#10b981',
                    padding: '6px 10px',
                    background: hasError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
                  }}>
                    {hasError ? `❌ Erreur : ${hasError}` : `✅ JSON pour "${key}" valide`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel/Close Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-lg)',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          Retour aux utilisateurs
        </button>
      </div>
    </div>
  );
}
