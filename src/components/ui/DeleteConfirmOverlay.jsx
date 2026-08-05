import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from '@utils/icons';
import { Z_INDEX } from '@utils/zIndex';
import { Button } from './Button';

export function DeleteConfirmOverlay({
  open,
  title,
  message,
  warningMessage,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: 'var(--overlay-bg-heavy)',
      zIndex: Z_INDEX.DELETE_MODAL, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)',
      overflow: 'hidden', touchAction: 'none', overscrollBehavior: 'none'
    }}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div style={{
        background: 'var(--sheet-bg)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '340px',
        textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', background: 'color-mix(in srgb, var(--error) 15%, transparent)',
          color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
        }}>
          <Trash2 size={32} />
        </div>
        
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '800' }}>
          {title}
        </h3>
        
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {message}
          {warningMessage && (
            <span style={{
              display: 'block', marginTop: '12px', color: 'var(--warning)',
              fontSize: '0.85rem', fontWeight: '700', padding: '8px',
              background: 'color-mix(in srgb, var(--warning) 15%, transparent)',
              borderRadius: '8px'
            }}>
              {warningMessage}
            </span>
          )}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading} style={{ flex: 1 }}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} style={{ flex: 1 }}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
