import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Cloud, CloudOff, User, AlertCircle, Trash2, AlertTriangle } from '../../utils/icons';
import { Avatar } from '../ui/Avatar';

export function CloudSyncPanel({
  authState,
  onSignIn,
  onSignOut,
  conflictData,
  onDeleteAccount
}) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);


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
          <p className="cloud-sync-subtitle">
            {authState.isSignedIn
              ? t('cloud.connectedGooglePlay')
              : t('cloud.notConnected')
            }
          </p>
        </div>
      </div>

      {authState.loading ? (
        <div className="cloud-sync-loading">
          <Cloud className="pulse-animation" />
          <span>{t('common.loading')}</span>
        </div>
      ) : authState.isSignedIn ? (
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

          {/* Sign out */}
          <button
            className="btn-cloud-signout"
            onClick={onSignOut}
            disabled={authState.loading}
          >
            {t('cloud.signOut')}
          </button>

          {/* Delete account */}
          <button
            className="btn-cloud-delete"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={authState.loading}
          >
            <Trash2 size={16} />
            {t('cloud.deleteAccount')}
          </button>

          {/* Delete confirmation modal */}
          {showDeleteConfirm && createPortal(
            <div className="delete-overlay" onClick={() => setShowDeleteConfirm(false)}>
              <div className="delete-modal" onClick={e => e.stopPropagation()}>
                <div className="delete-bg-effects">
                  <div className="delete-glow delete-glow-1"></div>
                  <div className="delete-glow delete-glow-2"></div>
                </div>
                <div className="delete-content">
                  <div className="delete-icon-wrapper">
                    <div className="delete-icon-pulse"></div>
                    <div className="delete-icon">
                      <Trash2 />
                    </div>
                  </div>
                  <h3>{t('cloud.deleteAccount')}</h3>
                  <p>
                    <Trans i18nKey="cloud.deleteWarning">
                      Cette action est <strong>irréversible</strong>. Toutes vos données seront
                      supprimées définitivement, y compris votre progression et vos paramètres.
                    </Trans>
                  </p>
                  <div className="delete-warning">
                    <AlertTriangle size={14} />
                    <span>{t('cloud.deleteCannotUndo')}</span>
                  </div>
                  <div className="delete-actions">
                    <button 
                      className="btn-delete-cancel"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      className="btn-delete-confirm"
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await onDeleteAccount();
                        } finally {
                          setDeleting(false);
                          setShowDeleteConfirm(false);
                        }
                      }}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <span className="delete-spinner"></span>
                          {t('cloud.deleting')}
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>
            </div>,
            document.body
          )}
        </div>
      ) : (
        <div className="cloud-sync-content">
          <div className="cloud-promo">
            <p className="cloud-promo-text">
              {t('cloud.promoText')}
            </p>
            <ul className="cloud-benefits">
              <li>
                <Cloud className="icon-check" />
                <span>{t('cloud.autoBackup')}</span>
              </li>
              <li>
                <Cloud className="icon-check" />
                <span>{t('cloud.multiDevice')}</span>
              </li>
              <li>
                <Cloud className="icon-check" />
                <span>{t('cloud.neverLose')}</span>
              </li>
            </ul>
          </div>

          <button
            className="btn-cloud-signin"
            onClick={onSignIn}
            disabled={authState.loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('cloud.signInWithGoogle')}
          </button>

          {authState.error && (
            <div className="sync-message error">
              <AlertCircle />
              <span>{authState.error}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
