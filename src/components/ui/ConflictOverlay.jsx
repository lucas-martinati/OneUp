import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Cloud, AlertCircle, Upload, AlertTriangle } from '@utils/icons';

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
    </div>,
    document.body
  );
}
