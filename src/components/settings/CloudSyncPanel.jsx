import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Cloud, CloudOff, AlertCircle, Trash2, Check, Smartphone, RefreshCw } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { GoogleSignInButton } from '@components/ui/GoogleSignInButton';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isDeleting, title, description, t }) {
  return (
    <ConfirmDialog
      open={isOpen}
      destructive
      icon={Trash2}
      title={title}
      message={description}
      warning={t('cloud.deleteCannotUndo')}
      loading={isDeleting}
      confirmLabel={t('common.delete')}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
}

export function CloudSyncPanel({
  authState,
  onSignIn,
  onSignOut,
  conflictData,
  onDeleteAccount,
  onDeleteAllData
}) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);


  return (
    <div className="cloud-sync-panel">
      <div className="cloud-sync-header">
        <div className="cloud-sync-icon">
          {authState.isSignedIn ? (
            <Cloud className="icon-cloud connected" />
          ) : (
            <CloudOff className="icon-cloud disconnected" />
          )}
        </div>
        <div className="cloud-sync-title">
          <h3>{t('cloud.cloudBackup')}</h3>
          <p className={`cloud-sync-subtitle${authState.isSignedIn ? ' connected' : ''}`}>
            {authState.isSignedIn
              ? t('cloud.connectedGooglePlay')
              : t('cloud.notConnected')
            }
          </p>
        </div>
      </div>

      {authState.loading && (
        <div className="cloud-sync-loading">
          <Cloud className="pulse-animation" />
          <span>{t('common.loading')}</span>
        </div>
      )}

      {!authState.loading && authState.isSignedIn && (
        <div className="cloud-sync-content">
          {/* User info */}
            <div className="cloud-user-info">
              <Avatar
                photoURL={authState.user?.photoURL}
                name={authState.user?.displayName || authState.user?.email}
                size={48}
              />
              <div className="user-details">
              <p className="user-name">{authState.user?.displayName || t('cloud.user')}</p>
              <p className="user-email">{authState.user?.email || ''}</p>
            </div>
          </div>

          {/* Conflict Resolution Dialog */}
          {conflictData && (
            <div className="conflict-dialog">
              <div className="conflict-header">
                <AlertCircle className="conflict-icon" />
                <h4>{t('cloud.dataConflict')}</h4>
              </div>
              <p className="conflict-message">
                {t('cloud.resolving')}
              </p>
            </div>
          )}

          {/* Auto-sync indicator */}
          <div className="auto-sync-info">
            <Cloud className="info-icon" />
            <span>{t('cloud.autoSyncEnabled')}</span>
          </div>

          {/* Account management */}
          <div className="cloud-account-actions">
            <Button
              variant="secondary"
              fullWidth
              onClick={onSignOut}
              disabled={authState.loading}
            >
              {t('cloud.signOut')}
            </Button>

            <Button
              variant="danger-ghost"
              size="sm"
              fullWidth
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={authState.loading}
            >
              {t('cloud.deleteAccount')}
            </Button>
          </div>

          {/* Delete confirmation modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              setDeleting(true);
              try {
                await onDeleteAccount();
              } finally {
                setDeleting(false);
                setShowDeleteConfirm(false);
              }
            }}
            isDeleting={deleting}
            title={t('cloud.deleteAccount')}
            description={
              <Trans i18nKey="cloud.deleteWarning">
                Cette action est <strong>irréversible</strong>. Toutes vos données seront
                supprimées définitivement, y compris votre progression et vos paramètres.
              </Trans>
            }
            t={t}
          />
        </div>
      )}

      {!authState.loading && !authState.isSignedIn && (
        <div className="cloud-sync-content">
          <div className="cloud-promo">
            <p className="cloud-promo-text">
              {t('cloud.promoText')}
            </p>
            <ul className="cloud-benefits">
              <li>
                <RefreshCw className="icon-check" />
                <span>{t('cloud.autoBackup')}</span>
              </li>
              <li>
                <Smartphone className="icon-check" />
                <span>{t('cloud.multiDevice')}</span>
              </li>
              <li>
                <Check className="icon-check" />
                <span>{t('cloud.neverLose')}</span>
              </li>
            </ul>
          </div>

          <GoogleSignInButton onClick={onSignIn} disabled={authState.loading} />

          {authState.error && (
            <div className="sync-message error">
              <AlertCircle />
              <span>{authState.error}</span>
            </div>
          )}

          {/* Delete all local data button (offline mode) */}
          {onDeleteAllData && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <Button
                variant="danger-ghost"
                size="sm"
                fullWidth
                icon={Trash2}
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                {t('cloud.deleteAllData')}
              </Button>
            </div>
          )}

          {/* Delete all data confirmation modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteAllConfirm}
            onClose={() => setShowDeleteAllConfirm(false)}
            onConfirm={async () => {
              setDeletingAll(true);
              try {
                await onDeleteAllData();
              } finally {
                setDeletingAll(false);
                setShowDeleteAllConfirm(false);
              }
            }}
            isDeleting={deletingAll}
            title={t('cloud.deleteAllData')}
            description={t('cloud.deleteAllWarning')}
            t={t}
          />
        </div>
      )}

    </div>
  );
}
