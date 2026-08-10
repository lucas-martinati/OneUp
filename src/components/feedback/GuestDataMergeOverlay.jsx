import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, AlertCircle, Upload, AlertTriangle } from '@utils/icons';
import { Button, ModalShell } from '@components/ui';

/**
 * Full-screen overlay for anonymous (guest) data merge.
 * Only shown when the user was using the app without being signed in,
 * then signs in — prompting to merge guest data or restore from cloud.
 *
 * Regular reload conflicts (already signed in) are auto-merged silently.
 */
export function GuestDataMergeOverlay({ conflictData, onResolveConflict }) {
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

  return (
    <ModalShell
      open={true}
      title={t('cloud.anonymousMergeTitle')}
      icon={AlertCircle}
      showCloseButton={false}
      size="md"
      footerLayout="column"
      footer={
        <>
          <Button
            variant="ghost"
            className="btn-conflict btn-merge"
            onClick={() => handleResolve('upload')}
            disabled={resolving}
          >
            <Upload />
            <div>
              <strong>{t('cloud.merge')}</strong>
              <span>{t('cloud.mergeDesc')}</span>
            </div>
          </Button>
          <Button
            variant="ghost"
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
          >
            {confirmRestore ? <AlertTriangle /> : <Cloud />}
            <div>
              <strong>{confirmRestore ? t('cloud.areYouSure') : t('cloud.restore')}</strong>
              <span>{confirmRestore ? t('cloud.cannotBeUndone') : t('cloud.restoreDesc')}</span>
            </div>
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {t('cloud.anonymousMergeDesc')}
      </p>
    </ModalShell>
  );
}
