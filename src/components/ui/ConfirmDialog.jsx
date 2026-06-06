import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '../../utils/icons';

/**
 * Custom confirm dialog replacing window.confirm().
 * Renders as a full-screen overlay with glassmorphism styling.
 *
 * @param {boolean}  open         – Whether the dialog is visible
 * @param {string}   message      – The confirmation message to display
 * @param {function} onConfirm    – Called when the user confirms
 * @param {function} onCancel     – Called when the user cancels
 * @param {boolean}  [destructive=false] – If true, confirm button uses red/danger styling
 * @param {string}   [confirmLabel] – Override the confirm button text
 * @param {string}   [cancelLabel]  – Override the cancel button text
 */
export function ConfirmDialog({
    open,
    message,
    onConfirm,
    onCancel,
    destructive = false,
    confirmLabel,
    cancelLabel,
}) {
    const { t } = useTranslation();
    const overlayRef = useRef(null);
    const panelRef = useRef(null);

    // Close on Escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onCancel();
    }, [onCancel]);

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
        if (e.target === overlayRef.current) onCancel();
    };

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: 'confirmOverlayIn 0.2s ease-out',
            }}
        >
            <div
                ref={panelRef}
                style={{
                    width: '100%',
                    maxWidth: '340px',
                    borderRadius: '20px',
                    background: 'linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.98))',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.08)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    animation: 'confirmPanelIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: destructive
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(129, 140, 248, 0.15))',
                    border: `1px solid ${destructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <AlertTriangle
                        size={22}
                        color={destructive ? '#f87171' : '#a78bfa'}
                    />
                </div>

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

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    width: '100%',
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '14px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {cancelLabel || t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '14px',
                            background: destructive
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: destructive
                                ? '0 4px 16px rgba(239, 68, 68, 0.3)'
                                : '0 4px 16px rgba(139, 92, 246, 0.3)',
                        }}
                    >
                        {confirmLabel || t('common.confirm')}
                    </button>
                </div>
            </div>

            {/* Keyframe animations injected inline */}
            <style>{`
                @keyframes confirmOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes confirmPanelIn {
                    from { opacity: 0; transform: scale(0.85) translateY(12px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}
