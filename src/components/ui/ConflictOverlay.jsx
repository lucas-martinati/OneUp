import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Cloud, AlertCircle, Upload, AlertTriangle } from '../../utils/icons';

/**
 * Full-screen overlay for anonymous (guest) data merge.
 * Only shown when the user was using the app without being signed in,
 * then signs in — prompting to merge guest data or restore from cloud.
 *
 * Regular reload conflicts (already signed in) are auto-merged silently.
 */
export function ConflictOverlay({ conflictData, onResolveConflict }) {
  const [resolving, setResolving] = useState(false);
  const { t } = useTranslation();
  const [confirmRestore, setConfirmRestore] = useState(false);

  if (!conflictData) return null;

  const handleResolve = async (action) => {
    setResolving(true);
    try {
      await onResolveConflict(action);
    } finally {
      setResolving(false);
    }
  };

  return createPortal(
    <div className="conflict-fullscreen-overlay">
      <div className="conflict-modal">
        <div className="conflict-header">
          <AlertCircle className="conflict-icon" />
          <h2 className="panel-title">{t('cloud.anonymousMergeTitle')}</h2>
        </div>
        <p className="conflict-message">
          {t('cloud.anonymousMergeDesc')}
        </p>
        <div className="conflict-actions">
          <button
            className="btn-conflict btn-merge"
            onClick={() => handleResolve('upload')}
            disabled={resolving}
          >
            <Upload />
            <div>
              <strong>{t('cloud.merge')}</strong>
              <span>{t('cloud.mergeDesc')}</span>
            </div>
          </button>
          <button
            className={`btn-conflict btn-restore ${confirmRestore ? 'confirming' : ''}`}
            onClick={() => {
              if (!confirmRestore) {
                setConfirmRestore(true);
                setTimeout(() => setConfirmRestore(false), 3000);
              } else {
                handleResolve('restore');
              }
            }}
            disabled={resolving}
            style={confirmRestore ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
          >
            {confirmRestore ? <AlertTriangle /> : <Cloud />}
            <div>
              <strong>{confirmRestore ? t('cloud.areYouSure') : t('cloud.restore')}</strong>
              <span>{confirmRestore ? t('cloud.cannotBeUndone') : t('cloud.restoreDesc')}</span>
            </div>
          </button>
        </div>
      </div>
      <style>{`
        .conflict-fullscreen-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: conflictFadeIn 0.3s ease;
        }

        @keyframes conflictFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .conflict-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 24px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(245, 158, 11, 0.3);
          animation: conflictSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes conflictSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .conflict-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .conflict-icon {
          width: 32px;
          height: 32px;
          color: #f59e0b;
        }

        .conflict-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .conflict-message {
          margin: 0 0 32px 0;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .conflict-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-conflict {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border: none;
          border-radius: 16px;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .btn-conflict svg {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
        }

        .btn-conflict div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .btn-conflict strong {
          font-size: 18px;
          font-weight: 700;
        }

        .btn-conflict span {
          font-size: 14px;
          opacity: 0.8;
        }

        .btn-merge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .btn-merge:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .btn-restore {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .btn-restore.confirming {
           background: linear-gradient(135deg, #ef4444, #dc2626) !important;
        }

        .btn-restore:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
        }

        .btn-conflict:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-conflict:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>,
    document.body
  );
}
