import React from 'react';
import { Save, Lock, Code } from '../../utils/icons';
import { JsonTreeEditor } from './JsonTreeEditor';
import { LineNumberTextarea } from './LineNumberTextarea';

/** Accordion JSON editor: one collapsible section per database key plus a raw full-document section. */
export function AdminJsonSectionsEditor({
  selectedUserKeys,
  expandedKeys, onToggleKey,
  keyJsonContents, keyJsonErrors,
  keyEditorFormats, setKeyEditorFormats,
  onJsonChange, onFormatJson, onSaveJson,
  saveLoading, onBack
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {selectedUserKeys.map((key) => {
        const isExpanded = !!expandedKeys[key];
        const contentValue = keyJsonContents[key] || '';
        const hasError = keyJsonErrors[key];
        const isFullDoc = key === '__full__';

        return (
          <div
            key={key}
            style={{
              borderRadius: 'var(--radius-lg)',
              border: isExpanded ? '1px solid rgba(167,139,250,0.3)' : '1px solid var(--border-subtle)',
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
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  fontSize: '0.95rem'
                }}>
                  {isFullDoc ? '📄 Fiche complète (Raw)' : `"${key}"`}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                {isExpanded ? 'Clic pour plier' : `Clic pour déplier { ... }`}
              </span>
            </div>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="scale-in" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{
                    background: isFullDoc ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isFullDoc ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                    padding: '6px 12px', borderRadius: 'var(--radius-md)',
                    color: isFullDoc ? '#fca5a5' : 'var(--text-secondary)',
                    fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center'
                  }}>
                    <Lock size={12} />
                    <span>{isFullDoc ? 'Édition globale directe.' : `Modifie uniquement la clé "${key}".`}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

                    <button
                      disabled={saveLoading || !!hasError}
                      onClick={() => onSaveJson(key)}
                      className="hover-lift"
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: (saveLoading || !!hasError) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: (saveLoading || !!hasError) ? 0.6 : 1
                      }}
                    >
                      <Save size={12} />
                      Sauvegarder Section
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
