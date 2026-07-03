import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@utils/icons';
import { Button } from './Button';

/**
 * Custom confirm dialog replacing window.confirm().
 * Renders on the shared .dialog-backdrop / .dialog-card pattern so it follows
 * the active theme (the previous inline version was hard-coded purple).
 *
 * @param {boolean}  open         – Whether the dialog is visible
 * @param {string}   [title]      – Optional heading above the message
 * @param {ReactNode} message     – The confirmation message to display
 * @param {string}   [warning]    – Optional error-tinted notice strip (e.g. "cannot be undone")
 * @param {Component} [icon]      – Icon component in the header circle (default AlertTriangle)
 * @param {boolean}  [loading=false] – Confirm in progress: spinner + inputs locked
 * @param {function} onConfirm    – Called when the user confirms
 * @param {function} onCancel     – Called when the user cancels
 * @param {boolean}  [destructive=false] – If true, confirm button uses red/danger styling
 * @param {string}   [confirmLabel] – Override the confirm button text
 * @param {string}   [cancelLabel]  – Override the cancel button text
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
    const overlayRef = useRef(null);

    // Close on Escape key (unless a confirm is in flight)
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && !loading) onCancel();
    }, [onCancel, loading]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll while dialog is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, handleKeyDown]);

    // Close when clicking backdrop (not the panel)
    const handleBackdropClick = (e) => {
        if (e.target === overlayRef.current && !loading) onCancel();
    };

    if (!open) return null;

    const accentTint = destructive ? 'var(--error)' : 'var(--accent-glow)';

    return createPortal(
        <div ref={overlayRef} onClick={handleBackdropClick} className="dialog-backdrop">
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
        </div>,
        document.body
    );
}
