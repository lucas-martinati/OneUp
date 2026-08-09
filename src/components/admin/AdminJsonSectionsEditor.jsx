import React, { useState } from 'react';
import { Save, Lock, Code, Copy, Check, RotateCcw } from '@utils/icons';
import { JsonTreeEditor } from './JsonTreeEditor';
import { LineNumberTextarea } from './LineNumberTextarea';
import { Button, SegmentedControl } from '@components/ui';

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
function CopyButton({ text, style }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <Button variant="secondary" size="sm"
      onClick={handleCopy}
      title="Copier le JSON"
      color={copied ? '#34d399' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', ...style }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copié' : 'Copier'}
    </Button>
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
    <>
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

        let borderStyle = '1px solid var(--border-default)';
        if (isExpanded) {
          borderStyle = '1px solid rgba(167,139,250,0.3)';
        } else if (isDirty) {
          borderStyle = '1px solid rgba(245,158,11,0.4)';
        }

        let titleColor = 'var(--text-primary)';
        if (isFullDoc) {
          titleColor = '#ef4444';
        } else if (isExpanded) {
          titleColor = '#a78bfa';
        }

        return (
          <div
            key={key}
            style={{
              borderRadius: 'var(--radius-lg)',
              border: borderStyle,
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
                  color: titleColor,
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
                    <SegmentedControl
                      size="sm"
                      variant="glass"
                      options={[
                        { id: 'tree', label: 'Arborescence', activeBg: 'rgba(255,255,255,0.08)', activeBorder: 'none', activeColor: 'var(--text-primary)' },
                        { id: 'raw', label: 'Code brut', activeBg: 'rgba(255,255,255,0.08)', activeBorder: 'none', activeColor: 'var(--text-primary)' }
                      ]}
                      value={keyEditorFormats[key] || 'tree'}
                      onChange={(val) => setKeyEditorFormats(prev => ({ ...prev, [key]: val }))}
                      style={{ height: '32px' }}
                    />

                    {keyEditorFormats[key] === 'raw' && (
                      <Button variant="secondary" size="sm"
                        onClick={() => onFormatJson(key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px', minHeight: '32px' }}
                      >
                        <Code size={12} />
                        Formater
                      </Button>
                    )}

                    <CopyButton text={contentValue} style={{ height: '32px', minHeight: '32px' }} />

                    {isDirty && onRevertJson && (
                      <Button variant="danger-ghost" size="sm"
                        onClick={() => onRevertJson(key)}
                        title="Annuler les modifications non sauvegardées"
                        color="#f59e0b"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px', minHeight: '32px' }}
                      >
                        <RotateCcw size={12} />
                        Annuler
                      </Button>
                    )}

                    <Button variant="success" size="sm"
                      disabled={!canSave}
                      onClick={() => onSaveJson(key)}
                      title={isDirty ? 'Sauvegarder (Ctrl+S)' : 'Aucune modification à sauvegarder'}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px', minHeight: '32px' }}
                    >
                      <Save size={12} />
                      Sauvegarder
                    </Button>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
        <Button variant="secondary" onClick={onBack}>
          Retour aux utilisateurs
        </Button>
      </div>
    </>
  );
}
