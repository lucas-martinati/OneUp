import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@utils/icons';
import { Button } from './Button';
import { ModalContainer } from './ModalContainer';

/**
 * Custom confirm dialog replacing window.confirm().
 * Renders on the shared ModalContainer pattern so it follows the active theme.
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

    const accentTint = destructive ? 'var(--error)' : 'var(--accent-glow)';

    return (
        <ModalContainer open={open} onClose={onCancel} closeOnEscape={!loading} closeOnBackdrop={!loading}>
            <div
                className={`dialog-card${destructive ? ' dialog-card--danger' : ''}`}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `color-mix(in srgb, ${accentTint} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${accentTint} 30%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={22} color={accentTint} />
                </div>

                {title && (
                    <h3 style={{
                        margin: '-8px 0 0',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                    }}>
                        {title}
                    </h3>
                )}

                {/* Message */}
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

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    width: '100%',
                }}>
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
                </div>
            </div>
        </ModalContainer>
    );
}
