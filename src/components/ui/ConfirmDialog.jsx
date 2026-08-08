import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@utils/icons';
import { Button } from './Button';
import { ModalShell } from './ModalShell';

/**
 * Custom confirm dialog replacing window.confirm().
 * Renders on the shared ModalShell pattern so it follows the active theme.
 */
export function ConfirmDialog({
    open,
    title,
    message,
    warning,
    icon: Icon = AlertTriangle,
    loading = false,
    onConfirm,
    onCancel,
    destructive = false,
    confirmLabel,
    cancelLabel,
}) {
    const { t } = useTranslation();

    if (!open) return null;

    const buttonsJSX = (
        <>
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading} style={{ flex: 1 }}>
                {cancelLabel || t('common.cancel')}
            </Button>
            <Button
                variant={destructive ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
                loading={loading}
                style={{ flex: 1 }}
            >
                {confirmLabel || t('common.confirm')}
            </Button>
        </>
    );

    return (
        <ModalShell 
            open={open} 
            onClose={onCancel} 
            variant={destructive ? 'danger' : 'default'} 
            size="sm" 
            showCloseButton={false} 
            footer={buttonsJSX} 
            footerLayout="row"
            closeOnEscape={!loading}
            closeOnBackdrop={!loading}
        >
            <div style={{
                textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px',
                alignItems: 'center', paddingTop: '8px'
            }}>
                {Icon && (
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', 
                        background: destructive ? 'color-mix(in srgb, var(--error) 15%, transparent)' : 'color-mix(in srgb, var(--accent) 15%, transparent)',
                        color: destructive ? 'var(--error)' : 'var(--accent)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={28} />
                    </div>
                )}
                
                {title && (
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800' }}>
                        {title}
                    </h3>
                )}
                
                <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: '1.5',
                }}>
                    {message}
                </p>

                {warning && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        marginTop: '4px', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: '700', 
                        padding: '10px 14px', background: 'color-mix(in srgb, var(--warning) 15%, transparent)',
                        borderRadius: '8px', width: '100%', textAlign: 'left'
                    }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>{warning}</span>
                    </div>
                )}
            </div>
        </ModalShell>
    );
}
