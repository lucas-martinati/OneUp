import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CloudOff, User, AlertCircle, Upload } from 'lucide-react';

export function CloudSyncPanel({
  authState,
  onSignIn,
  onSignOut,
  conflictData,
  onResolveConflict
}) {
  const [resolving, setResolving] = useState(false);

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
            <h2>Données cloud détectées</h2>
          </div>
          <p className="conflict-message">
            Une sauvegarde existe déjà dans le cloud. Que souhaitez-vous faire ?
          </p>
          <div className="conflict-actions">
            <button
              className="btn-conflict btn-restore"
              onClick={() => handleResolve('restore')}
              disabled={resolving}
            >
              <Cloud />
              <div>
                <strong>Restaurer</strong>
                <span>Récupérer mes données du cloud</span>
              </div>
            </button>
            <button
              className="btn-conflict btn-upload"
              onClick={() => handleResolve('upload')}
              disabled={resolving}
            >
              <Upload />
              <div>
                <strong>Remplacer le cloud</strong>
                <span>Écraser le cloud avec mes données locales</span>
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
          <h3>Sauvegarde Cloud</h3>
          <p className="cloud-sync-subtitle">
            {authState.isSignedIn
              ? 'Connecté avec Google Play'
              : 'Non connecté'
            }
          </p>
        </div>
      </div>

      {authState.loading ? (
        <div className="cloud-sync-loading">
          <Cloud className="pulse-animation" />
          <span>Chargement...</span>
        </div>
      ) : authState.isSignedIn ? (
        <div className="cloud-sync-content">
          {/* User info */}
          <div className="cloud-user-info">
            <div className="user-avatar">
              {authState.user?.photoURL ? (
                <img src={authState.user.photoURL} alt="Avatar" />
              ) : (
                <User />
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{authState.user?.displayName || 'Utilisateur'}</p>
              <p className="user-email">{authState.user?.email || ''}</p>
            </div>
          </div>

          {/* Conflict Resolution Dialog */}
          {conflictData && (
            <div className="conflict-dialog">
              <div className="conflict-header">
                <AlertCircle className="conflict-icon" />
                <h4>Conflit de données</h4>
              </div>
              <p className="conflict-message">
                Résolution en cours...
              </p>
            </div>
          )}

          {/* Auto-sync indicator */}
          <div className="auto-sync-info">
            <Cloud className="info-icon" />
            <span>Synchronisation automatique activée</span>
          </div>

          {/* Sign out */}
          <button
            className="btn-cloud-signout"
            onClick={onSignOut}
            disabled={authState.loading}
          >
            Déconnexion
          </button>
        </div>
      ) : (
        <div className="cloud-sync-content">
          <div className="cloud-promo">
            <p className="cloud-promo-text">
              Connectez-vous avec votre compte Google pour sauvegarder votre progression dans le cloud et la synchroniser entre appareils.
            </p>
            <ul className="cloud-benefits">
              <li>
                <Cloud className="icon-check" />
                <span>Sauvegarde automatique</span>
              </li>
              <li>
                <Cloud className="icon-check" />
                <span>Synchronisation multi-appareils</span>
              </li>
              <li>
                <Cloud className="icon-check" />
                <span>Ne perdez jamais votre progression</span>
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
            Se connecter avec Google
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
      `}</style>
    </div>
  );
}
