import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@utils/icons';
import { Button } from './Button';
import { DialogShell } from './DialogShell';

/**
 * Custom confirm dialog replacing window.confirm().
 * Renders on the shared DialogShell pattern so it follows the active theme.
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
        <DialogShell 
            open={open} 
            onClose={onCancel} 
            icon={Icon} 
            title={title} 
            variant={destructive ? 'danger' : 'default'} 
            size="sm" 
            showCloseButton={false} 
            footer={buttonsJSX} 
            footerLayout="row"
            closeOnEscape={!loading}
            closeOnBackdrop={!loading}
        >
            <p style={{
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--text-primary)',
                textAlign: 'center',
                lineHeight: '1.5',
            }}>
                {message}
            </p>

            {warning && (
                <div className="dialog-warning">
                    <AlertTriangle size={14} />
                    <span>{warning}</span>
                </div>
            )}
        </DialogShell>
    );
}
