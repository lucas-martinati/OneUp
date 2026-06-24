import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Cloud, CloudOff, AlertCircle, Trash2, AlertTriangle, Check, Smartphone, RefreshCw } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
import { GoogleSignInButton } from '@components/ui/GoogleSignInButton';

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
            <button
              className="btn-cloud-signout"
              onClick={onSignOut}
              disabled={authState.loading}
            >
              {t('cloud.signOut')}
            </button>

            <button
              className="btn-cloud-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={authState.loading}
            >
              <Trash2 size={16} />
              {t('cloud.deleteAccount')}
            </button>
          </div>

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
              <button
                className="btn-cloud-delete"
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                <Trash2 size={16} />
                {t('cloud.deleteAllData')}
              </button>
            </div>
          )}

          {/* Delete all data confirmation modal */}
          {showDeleteAllConfirm && createPortal(
            <div className="delete-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
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
                  <h3>{t('cloud.deleteAllData')}</h3>
                  <p>{t('cloud.deleteAllWarning')}</p>
                  <div className="delete-warning">
                    <AlertTriangle size={14} />
                    <span>{t('cloud.deleteCannotUndo')}</span>
                  </div>
                  <div className="delete-actions">
                    <button
                      className="btn-delete-cancel"
                      onClick={() => setShowDeleteAllConfirm(false)}
                      disabled={deletingAll}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="btn-delete-confirm"
                      onClick={async () => {
                        setDeletingAll(true);
                        try {
                          await onDeleteAllData();
                        } finally {
                          setDeletingAll(false);
                          setShowDeleteAllConfirm(false);
                        }
                      }}
                      disabled={deletingAll}
                    >
                      {deletingAll ? (
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
      )}

    </div>
  );
}
