import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Cloud, CloudOff, User, AlertCircle, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Avatar } from './Avatar';

export function CloudSyncPanel({
  authState,
  onSignIn,
  onSignOut,
  conflictData,
  onResolveConflict,
  onDeleteAccount
}) {
  const [resolving, setResolving] = useState(false);
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmUpload, setConfirmUpload] = useState(false);

  const handleResolve = async (action) => {
    setResolving(true);
    try {
      await onResolveConflict(action);
    } finally {
      setResolving(false);
    }
  };

  // If conflict exists, show fullscreen modal (using portal to break out of Settings modal)
  if (conflictData) {
    return createPortal(
      <div className="conflict-fullscreen-overlay">
        <div className="conflict-modal">
          <div className="conflict-header">
            <AlertCircle className="conflict-icon" />
            <h2>{t('cloud.cloudDataDetected')}</h2>
          </div>
          <p className="conflict-message">
            {t('cloud.backupExists')}
          </p>
          <div className="conflict-actions">
            <button
              className="btn-conflict btn-restore"
              onClick={() => handleResolve('restore')}
              disabled={resolving}
            >
              <Cloud />
              <div>
                <strong>{t('cloud.restore')}</strong>
                <span>{t('cloud.restoreDesc')}</span>
              </div>
            </button>
            <button
              className={`btn-conflict btn-upload ${confirmUpload ? 'confirming' : ''}`}
              onClick={() => {
                if (!confirmUpload) {
                  setConfirmUpload(true);
                  setTimeout(() => setConfirmUpload(false), 3000);
                } else {
                  handleResolve('upload');
                }
              }}
              disabled={resolving}
              style={confirmUpload ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
            >
              {confirmUpload ? <AlertTriangle /> : <Upload />}
              <div>
                <strong>{confirmUpload ? t('cloud.areYouSure') : t('cloud.replaceCloud')}</strong>
                <span>{confirmUpload ? t('cloud.cannotBeUndone') : t('cloud.replaceDesc')}</span>
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
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
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
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes slideUp {
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

          .btn-restore {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .btn-restore:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
          }

          .btn-upload {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }

          .btn-upload:hover:not(:disabled) {
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
          <span>{t('cloud.loading')}</span>
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
                  <h3>{t('cloud.deleteTitle')}</h3>
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
                          {t('cloud.deleteConfirm')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <style>{`
                .delete-overlay {
                  position: fixed;
                  inset: 0;
                  background: rgba(0, 0, 0, 0.85);
                  backdrop-filter: blur(12px);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10000;
                  padding: 20px;
                  animation: fadeIn 0.25s ease;
                }

                .delete-modal {
                  position: relative;
                  background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #0d0d1a 100%);
                  border-radius: 24px;
                  padding: 40px;
                  max-width: 420px;
                  width: 100%;
                  border: 1px solid rgba(255, 87, 87, 0.15);
                  box-shadow: 
                    0 25px 80px rgba(0, 0, 0, 0.6),
                    0 0 60px rgba(255, 87, 87, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                  animation: deleteModalSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                  overflow: hidden;
                }

                @keyframes deleteModalSlide {
                  from {
                    opacity: 0;
                    transform: scale(0.9) translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }

                .delete-bg-effects {
                  position: absolute;
                  inset: 0;
                  pointer-events: none;
                  overflow: hidden;
                }

                .delete-glow {
                  position: absolute;
                  border-radius: 50%;
                  filter: blur(60px);
                  opacity: 0.4;
                }

                .delete-glow-1 {
                  width: 200px;
                  height: 200px;
                  background: radial-gradient(circle, rgba(255, 87, 87, 0.3) 0%, transparent 70%);
                  top: -80px;
                  right: -60px;
                  animation: deleteFloat 6s ease-in-out infinite;
                }

                .delete-glow-2 {
                  width: 150px;
                  height: 150px;
                  background: radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%);
                  bottom: -50px;
                  left: -40px;
                  animation: deleteFloat 8s ease-in-out infinite reverse;
                }

                @keyframes deleteFloat {
                  0%, 100% { transform: translate(0, 0); }
                  50% { transform: translate(15px, 10px); }
                }

                .delete-content {
                  position: relative;
                  z-index: 1;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }

                .delete-icon-wrapper {
                  position: relative;
                  margin-bottom: 24px;
                }

                .delete-icon-pulse {
                  position: absolute;
                  inset: -8px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(255, 87, 87, 0.3) 0%, transparent 70%);
                  animation: deletePulse 2s ease-in-out infinite;
                }

                @keyframes deletePulse {
                  0%, 100% { transform: scale(1); opacity: 0.6; }
                  50% { transform: scale(1.2); opacity: 0.3; }
                }

                .delete-icon {
                  width: 72px;
                  height: 72px;
                  border-radius: 20px;
                  background: linear-gradient(145deg, rgba(255, 87, 87, 0.2), rgba(239, 68, 68, 0.1));
                  border: 1px solid rgba(255, 87, 87, 0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 8px 32px rgba(255, 87, 87, 0.2);
                }

                .delete-icon svg {
                  width: 32px;
                  height: 32px;
                  color: #ef4444;
                }

                .delete-modal h3 {
                  margin: 0 0 12px 0;
                  font-size: 26px;
                  font-weight: 800;
                  background: linear-gradient(135deg, #fff 0%, #fecaca 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                  text-align: center;
                }

                .delete-modal p {
                  margin: 0 0 20px 0;
                  font-size: 14px;
                  color: rgba(255, 255, 255, 0.6);
                  line-height: 1.7;
                  text-align: center;
                }

                .delete-modal p strong {
                  color: #ef4444;
                  font-weight: 600;
                }

                .delete-warning {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 10px 16px;
                  background: rgba(239, 68, 68, 0.1);
                  border: 1px solid rgba(239, 68, 68, 0.2);
                  border-radius: 10px;
                  margin-bottom: 28px;
                  width: 100%;
                  box-sizing: border-box;
                }

                .delete-warning svg {
                  width: 14px;
                  height: 14px;
                  color: #ef4444;
                  flex-shrink: 0;
                }

                .delete-warning span {
                  font-size: 12px;
                  color: rgba(254, 202, 202, 0.9);
                  font-weight: 500;
                }

                .delete-actions {
                  display: flex;
                  gap: 14px;
                  width: 100%;
                }

                .btn-delete-cancel {
                  flex: 1;
                  padding: 16px 24px;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 14px;
                  background: rgba(255, 255, 255, 0.03);
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 15px;
                  font-weight: 600;
                  font-family: var(--font-primary);
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-delete-cancel:hover:not(:disabled) {
                  background: rgba(255, 255, 255, 0.08);
                  border-color: rgba(255, 255, 255, 0.2);
                  transform: translateY(-2px);
                }

                .btn-delete-cancel:active:not(:disabled) {
                  transform: translateY(0);
                }

                .btn-delete-confirm {
                  flex: 1.2;
                  padding: 16px 24px;
                  border: none;
                  border-radius: 14px;
                  background: linear-gradient(145deg, #ef4444, #dc2626);
                  color: white;
                  font-size: 15px;
                  font-weight: 700;
                  font-family: var(--font-primary);
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
                }

                .btn-delete-confirm:hover:not(:disabled) {
                  transform: translateY(-2px);
                  box-shadow: 0 8px 30px rgba(239, 68, 68, 0.4);
                }

                .btn-delete-confirm:active:not(:disabled) {
                  transform: translateY(0);
                }

                .btn-delete-confirm:disabled {
                  opacity: 0.7;
                  cursor: not-allowed;
                }

                .delete-spinner {
                  width: 16px;
                  height: 16px;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  border-top-color: white;
                  border-radius: 50%;
                  animation: deleteSpin 0.8s linear infinite;
                }

                @keyframes deleteSpin {
                  to { transform: rotate(360deg); }
                }

                .btn-delete-cancel:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
              `}</style>
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

      <style>{`
        .cloud-sync-panel {
          background: var(--surface-card);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cloud-sync-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .cloud-sync-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(220, 90%, 60%), hsl(260, 90%, 65%));
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
        }

        .icon-cloud {
          width: 28px;
          height: 28px;
          color: white;
        }

        .icon-cloud.disconnected {
          opacity: 0.6;
        }

        .cloud-sync-title h3 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px 0;
          background: linear-gradient(135deg, hsl(220, 90%, 60%), hsl(260, 90%, 65%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cloud-sync-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .cloud-sync-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .pulse-animation {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .cloud-sync-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cloud-user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(220, 90%, 60%), hsl(260, 90%, 65%));
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-avatar svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .user-details {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-email {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .conflict-dialog {
          padding: 20px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 146, 60, 0.1));
          border-radius: 16px;
          border: 2px solid rgba(245, 158, 11, 0.3);
          animation: slideIn 0.3s ease;
        }

        .conflict-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .conflict-icon {
          width: 24px;
          height: 24px;
          color: #f59e0b;
        }

        .conflict-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .conflict-message {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .conflict-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-conflict {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .btn-conflict svg {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .btn-conflict div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .btn-conflict strong {
          font-size: 15px;
          font-weight: 600;
        }

        .btn-conflict span {
          font-size: 13px;
          opacity: 0.8;
        }

        .btn-merge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-merge:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        }

        .btn-overwrite {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-overwrite:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .btn-conflict:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auto-sync-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .info-icon {
          width: 20px;
          height: 20px;
          color: #10b981;
        }

        .auto-sync-info span {
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 500;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-cloud-signout {
          width: 100%;
          padding: 14px 20px;
          border: 1px solid rgba(255, 87, 87, 0.3);
          border-radius: 12px;
          background: rgba(255, 87, 87, 0.1);
          color: hsl(0, 84%, 70%);
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-cloud-signout:hover:not(:disabled) {
          background: rgba(255, 87, 87, 0.2);
          border-color: rgba(255, 87, 87, 0.5);
          transform: translateY(-2px);
        }

        .btn-cloud-signout:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cloud-promo {
          text-align: center;
        }

        .cloud-promo-text {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .cloud-benefits {
          list-style: none;
          padding: 0;
          margin: 0 0 28px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cloud-benefits li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .icon-check {
          width: 20px;
          height: 20px;
          color: hsl(220, 90%, 60%);
          flex-shrink: 0;
        }

        .btn-cloud-signin {
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          background: white;
          color: #1f1f1f;
          font-size: 15px;
          font-weight: 600;
          font-family: var(--font-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .btn-cloud-signin:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .btn-cloud-signin:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-cloud-signin:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .sync-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .sync-message.error {
          background: hsl(0, 84%, 60%, 0.15);
          color: hsl(0, 84%, 70%);
          border: 1px solid hsl(0, 84%, 60%, 0.3);
        }

        .sync-message svg {
          width: 18px;
          height: 18px;
        }

        .btn-cloud-delete {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(255, 87, 87, 0.2);
          border-radius: 12px;
          background: transparent;
          color: hsl(0, 84%, 60%);
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-cloud-delete:hover:not(:disabled) {
          background: rgba(255, 87, 87, 0.1);
          border-color: rgba(255, 87, 87, 0.4);
        }

        .btn-cloud-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        .delete-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 87, 87, 0.2);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .delete-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 87, 87, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .delete-icon svg {
          width: 32px;
          height: 32px;
          color: hsl(0, 84%, 60%);
        }

        .delete-modal h3 {
          margin: 0 0 12px 0;
          font-size: 22px;
          font-weight: 700;
          color: white;
          text-align: center;
        }

        .delete-modal p {
          margin: 0 0 28px 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          text-align: center;
        }

        .delete-modal p strong {
          color: hsl(0, 84%, 60%);
        }

        .delete-actions {
          display: flex;
          gap: 12px;
        }

        .btn-delete-cancel {
          flex: 1;
          padding: 14px 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: transparent;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-delete-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-delete-confirm {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-delete-confirm:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        .btn-delete-cancel:disabled,
        .btn-delete-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
