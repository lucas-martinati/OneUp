import{u as F,j as e}from"./index-CTt7Jjpc.js";import{a as b,B as R,E as f,T as U,G as K,I as J,J as W,K as Q,i as X,p as Z,X as ee,N as T,O as E,Q as re,V as ie,W as ae,Y as te,_ as ne,$ as se,U as oe,L as A,a0 as le}from"./ui-vendor-CruRgsfH.js";import{b as P}from"./charts-vendor-D-kmMlJE.js";import{A as de}from"./Avatar-BR5EiQ1I.js";import{T as ce}from"./Trans-DXmqz0X8.js";import"./capacitor-vendor-D_VhNmQL.js";import"./firebase-vendor-yOrvc3fF.js";function pe({authState:s,onSignIn:t,onSignOut:v,conflictData:o,onResolveConflict:l,onDeleteAccount:u}){const[y,j]=b.useState(!1),{t:a}=F(),[M,c]=b.useState(!1),[x,w]=b.useState(!1),[g,k]=b.useState(!1),z=async i=>{j(!0);try{await l(i)}finally{j(!1)}};return o?P.createPortal(e.jsxs("div",{className:"conflict-fullscreen-overlay",children:[e.jsxs("div",{className:"conflict-modal",children:[e.jsxs("div",{className:"conflict-header",children:[e.jsx(R,{className:"conflict-icon"}),e.jsx("h2",{children:a("cloud.cloudDataDetected")})]}),e.jsx("p",{className:"conflict-message",children:a("cloud.backupExists")}),e.jsxs("div",{className:"conflict-actions",children:[e.jsxs("button",{className:"btn-conflict btn-restore",onClick:()=>z("restore"),disabled:y,children:[e.jsx(f,{}),e.jsxs("div",{children:[e.jsx("strong",{children:a("cloud.restore")}),e.jsx("span",{children:a("cloud.restoreDesc")})]})]}),e.jsxs("button",{className:`btn-conflict btn-upload ${g?"confirming":""}`,onClick:()=>{g?z("upload"):(k(!0),setTimeout(()=>k(!1),3e3))},disabled:y,style:g?{background:"linear-gradient(135deg, #ef4444, #dc2626)"}:{},children:[g?e.jsx(U,{}):e.jsx(K,{}),e.jsxs("div",{children:[e.jsx("strong",{children:a(g?"cloud.areYouSure":"cloud.replaceCloud")}),e.jsx("span",{children:a(g?"cloud.cannotBeUndone":"cloud.replaceDesc")})]})]})]})]}),e.jsx("style",{children:`
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
        `})]}),document.body):e.jsxs("div",{className:"cloud-sync-panel",children:[e.jsxs("div",{className:"cloud-sync-header",children:[e.jsx("div",{className:"cloud-sync-icon",children:s.isSignedIn?e.jsx(f,{className:"icon-cloud connected"}):e.jsx(J,{className:"icon-cloud disconnected"})}),e.jsxs("div",{className:"cloud-sync-title",children:[e.jsx("h3",{children:a("cloud.cloudBackup")}),e.jsx("p",{className:"cloud-sync-subtitle",children:s.isSignedIn?a("cloud.connectedGooglePlay"):a("cloud.notConnected")})]})]}),s.loading?e.jsxs("div",{className:"cloud-sync-loading",children:[e.jsx(f,{className:"pulse-animation"}),e.jsx("span",{children:a("cloud.loading")})]}):s.isSignedIn?e.jsxs("div",{className:"cloud-sync-content",children:[e.jsxs("div",{className:"cloud-user-info",children:[e.jsx(de,{photoURL:s.user?.photoURL,name:s.user?.displayName||s.user?.email,size:48}),e.jsxs("div",{className:"user-details",children:[e.jsx("p",{className:"user-name",children:s.user?.displayName||a("cloud.user")}),e.jsx("p",{className:"user-email",children:s.user?.email||""})]})]}),o&&e.jsxs("div",{className:"conflict-dialog",children:[e.jsxs("div",{className:"conflict-header",children:[e.jsx(R,{className:"conflict-icon"}),e.jsx("h4",{children:a("cloud.dataConflict")})]}),e.jsx("p",{className:"conflict-message",children:a("cloud.resolving")})]}),e.jsxs("div",{className:"auto-sync-info",children:[e.jsx(f,{className:"info-icon"}),e.jsx("span",{children:a("cloud.autoSyncEnabled")})]}),e.jsx("button",{className:"btn-cloud-signout",onClick:v,disabled:s.loading,children:a("cloud.signOut")}),e.jsxs("button",{className:"btn-cloud-delete",onClick:()=>c(!0),disabled:s.loading,children:[e.jsx(W,{size:16}),a("cloud.deleteAccount")]}),M&&P.createPortal(e.jsxs("div",{className:"delete-overlay",onClick:()=>c(!1),children:[e.jsxs("div",{className:"delete-modal",onClick:i=>i.stopPropagation(),children:[e.jsxs("div",{className:"delete-bg-effects",children:[e.jsx("div",{className:"delete-glow delete-glow-1"}),e.jsx("div",{className:"delete-glow delete-glow-2"})]}),e.jsxs("div",{className:"delete-content",children:[e.jsxs("div",{className:"delete-icon-wrapper",children:[e.jsx("div",{className:"delete-icon-pulse"}),e.jsx("div",{className:"delete-icon",children:e.jsx(W,{})})]}),e.jsx("h3",{children:a("cloud.deleteTitle")}),e.jsx("p",{children:e.jsxs(ce,{i18nKey:"cloud.deleteWarning",children:["Cette action est ",e.jsx("strong",{children:"irréversible"}),". Toutes vos données seront supprimées définitivement, y compris votre progression et vos paramètres."]})}),e.jsxs("div",{className:"delete-warning",children:[e.jsx(U,{size:14}),e.jsx("span",{children:a("cloud.deleteCannotUndo")})]}),e.jsxs("div",{className:"delete-actions",children:[e.jsx("button",{className:"btn-delete-cancel",onClick:()=>c(!1),disabled:x,children:a("common.cancel")}),e.jsx("button",{className:"btn-delete-confirm",onClick:async()=>{w(!0);try{await u()}finally{w(!1),c(!1)}},disabled:x,children:x?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"delete-spinner"}),a("cloud.deleting")]}):e.jsxs(e.Fragment,{children:[e.jsx(W,{size:16}),a("cloud.deleteConfirm")]})})]})]})]}),e.jsx("style",{children:`
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
              `})]}),document.body)]}):e.jsxs("div",{className:"cloud-sync-content",children:[e.jsxs("div",{className:"cloud-promo",children:[e.jsx("p",{className:"cloud-promo-text",children:a("cloud.promoText")}),e.jsxs("ul",{className:"cloud-benefits",children:[e.jsxs("li",{children:[e.jsx(f,{className:"icon-check"}),e.jsx("span",{children:a("cloud.autoBackup")})]}),e.jsxs("li",{children:[e.jsx(f,{className:"icon-check"}),e.jsx("span",{children:a("cloud.multiDevice")})]}),e.jsxs("li",{children:[e.jsx(f,{className:"icon-check"}),e.jsx("span",{children:a("cloud.neverLose")})]})]})]}),e.jsxs("button",{className:"btn-cloud-signin",onClick:t,disabled:s.loading,children:[e.jsxs("svg",{className:"google-icon",viewBox:"0 0 24 24",children:[e.jsx("path",{fill:"#4285F4",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),e.jsx("path",{fill:"#34A853",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),e.jsx("path",{fill:"#FBBC05",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),e.jsx("path",{fill:"#EA4335",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),a("cloud.signInWithGoogle")]}),s.error&&e.jsxs("div",{className:"sync-message error",children:[e.jsx(R,{}),e.jsx("span",{children:s.error})]})]}),e.jsx("style",{children:`
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
      `})]})}function ve({defaultShowStore:s=!1,settings:t,onClose:v,onSave:o,cloudAuth:l,cloudSync:u,conflictData:y,onResolveConflict:j,isSupporter:a,isClub:M,isPro:c,purchaseHistory:x,onPurchaseSupporter:w,onPurchaseClub:g,onPurchasePro:k,onRestorePurchases:z}){const{t:i,i18n:C}=F(),[H,Y]=b.useState(!1),[I,D]=b.useState(s),[m,L]=b.useState(!1),$=()=>{const r={...t,notificationsEnabled:!t.notificationsEnabled};o(r),d()},G=()=>{const r={...t,soundsEnabled:!t.soundsEnabled};o(r),d()},O=r=>{const n={...t,notificationTime:{...t.notificationTime,hour:parseInt(r)}};o(n),d()},q=r=>{const n={...t,notificationTime:{...t.notificationTime,minute:parseInt(r)}};o(n),d()},d=()=>{Y(!0),setTimeout(()=>Y(!1),1500)},B=({enabled:r,onClick:n,activeGradient:N})=>e.jsx("button",{onClick:n,"aria-label":i(r?"settings.disable":"settings.enable"),style:{width:"50px",height:"28px",borderRadius:"14px",background:r?N:"var(--surface-hover)",border:"none",cursor:"pointer",position:"relative",transition:"all 0.3s ease",boxShadow:r?"0 4px 12px rgba(0,0,0,0.15)":"none",flexShrink:0,display:"flex",alignItems:"center",padding:"0 4px"},children:e.jsx("div",{style:{width:"22px",height:"22px",borderRadius:"50%",background:"white",position:"absolute",left:r?"calc(100% - 26px)":"4px",transition:"left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}})}),h=({icon:r,title:n,description:N,color:S,children:V,isLast:_})=>e.jsxs("div",{style:{padding:"12px 0",borderBottom:_?"none":"1px solid var(--border-subtle)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("div",{style:{background:`linear-gradient(135deg, ${S}20, ${S}08)`,padding:"10px",borderRadius:"12px",border:`1px solid ${S}30`},children:e.jsx(r,{size:20,color:S})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"700",fontSize:"1rem",color:"var(--text-primary)"},children:n}),N&&e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginTop:"2px"},children:N})]})]}),V]}),p={marginBottom:"var(--spacing-md)",fontSize:"0.85rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",color:"var(--text-secondary)"};return e.jsx("div",{className:"fade-in modal-overlay",style:{zIndex:110},children:e.jsxs("div",{className:"modal-content",style:{maxWidth:"600px",width:"100%",margin:"0 auto",padding:"var(--spacing-md)",paddingTop:"calc(var(--spacing-md) + env(safe-area-inset-top))",paddingBottom:"calc(var(--spacing-lg) + env(safe-area-inset-bottom))"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"var(--spacing-md)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[I&&e.jsx("button",{onClick:()=>D(!1),className:"hover-lift glass",style:{background:"var(--surface-hover)",border:"none",borderRadius:"50%",width:"var(--touch-min)",height:"var(--touch-min)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",cursor:"pointer"},children:e.jsx(Q,{size:22})}),e.jsx("h2",{className:"rainbow-gradient",style:{margin:0,fontSize:"clamp(1.5rem, 4vw, 2rem)",fontWeight:"800"},children:I?"Boutique":i("settings.title")})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[H&&e.jsxs("div",{className:"scale-in",style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"20px",background:"var(--success)",color:"white",fontSize:"0.85rem",fontWeight:"600",boxShadow:"var(--glow-success)"},children:[e.jsx(X,{size:16}),i("common.saved")]}),e.jsxs("div",{style:{display:"flex",gap:"8px",alignItems:"center"},children:[e.jsxs("button",{onClick:()=>D(!0),className:"hover-lift",style:{background:"linear-gradient(135deg, #10b981, #059669)",border:"1px solid rgba(16, 185, 129, 0.4)",borderRadius:"24px",padding:"0 16px",height:"var(--touch-min)",display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",color:"white",cursor:"pointer",boxShadow:"0 4px 12px rgba(16, 185, 129, 0.3)",fontWeight:"800",fontSize:"0.85rem",letterSpacing:"0.5px"},children:[e.jsx(Z,{size:18}),e.jsx("span",{children:"Boutique"})]}),e.jsx("button",{onClick:v,className:"hover-lift glass",style:{background:"var(--surface-hover)",border:"none",borderRadius:"50%",width:"var(--touch-min)",height:"var(--touch-min)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",cursor:"pointer"},children:e.jsx(ee,{size:22})})]})]})]}),I?e.jsxs("div",{className:"fade-in slide-up",style:{animationDuration:"0.4s"},children:[e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:a?"linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))":"var(--surface-section)",border:a?"1px solid rgba(239,68,68,0.2)":"1px solid var(--border-subtle)"},children:[e.jsx("h3",{style:p,children:i("supporter.title")}),a&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"16px",borderRadius:"var(--radius-lg)",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",marginBottom:"16px"},children:[e.jsx("div",{style:{width:"48px",height:"48px",borderRadius:"50%",background:"linear-gradient(135deg, #ef4444, #dc2626)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(239,68,68,0.3)",flexShrink:0},children:e.jsx(T,{size:24,color:"white",fill:"white"})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"800",fontSize:"1rem",color:"#ef4444"},children:i("supporter.thankYou")}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginTop:"2px"},children:i("supporter.badgeActive")})]})]}),e.jsxs("div",{children:[!a&&e.jsxs("div",{style:{padding:"20px",borderRadius:"var(--radius-lg)",background:"linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.04))",border:"1px solid rgba(239,68,68,0.12)",textAlign:"center",marginBottom:"12px"},children:[e.jsx(T,{size:32,color:"#ef4444",style:{marginBottom:"8px",opacity:.8}}),e.jsx("div",{style:{fontWeight:"700",fontSize:"1rem",color:"var(--text-primary)",marginBottom:"6px"},children:i("supporter.description")}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",lineHeight:"1.5"},children:i("supporter.explanation")})]}),e.jsxs("button",{onClick:()=>{if(!l?.isSignedIn){l?.signIn?.();return}w()},className:"hover-lift",style:{width:"100%",padding:"16px",borderRadius:"var(--radius-lg)",background:"linear-gradient(135deg, #ef4444, #dc2626)",border:"none",color:"white",fontWeight:"800",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer",boxShadow:"0 4px 16px rgba(239,68,68,0.3)"},children:[e.jsx(T,{size:20,fill:"white"}),a?"Faire un nouveau don":i("supporter.buyButton")]})]})]}),!1,e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:c?"linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))":"var(--surface-section)",border:c?"1px solid rgba(139,92,246,0.2)":"1px solid var(--border-subtle)"},children:[e.jsx("h3",{style:p,children:i("pro.title")}),c?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"16px",borderRadius:"var(--radius-lg)",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)"},children:[e.jsx("div",{style:{width:"48px",height:"48px",borderRadius:"50%",background:"linear-gradient(135deg, #8b5cf6, #7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(139,92,246,0.3)",flexShrink:0},children:e.jsx(E,{size:24,color:"white"})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"800",fontSize:"1rem",color:"#8b5cf6"},children:i("pro.activeTitle")}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginTop:"2px"},children:i("pro.activeDesc")})]})]}):e.jsxs("div",{children:[e.jsxs("div",{style:{padding:"20px",borderRadius:"var(--radius-lg)",background:"linear-gradient(135deg, rgba(139,92,246,0.06), rgba(124,58,237,0.04))",border:"1px solid rgba(139,92,246,0.12)",textAlign:"center",marginBottom:"12px"},children:[e.jsx(E,{size:32,color:"#8b5cf6",style:{marginBottom:"8px",opacity:.8}}),e.jsx("div",{style:{fontWeight:"700",fontSize:"1rem",color:"var(--text-primary)",marginBottom:"6px"},children:i("pro.description")}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",lineHeight:"1.5",marginBottom:"12px"},children:i("pro.explanation")}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center"},children:["Exercices 100% Personnalisés","Dashboard Musculation (Poids)","Leaderboards Exclusifs"].map(r=>e.jsx("span",{style:{padding:"4px 10px",borderRadius:"20px",fontSize:"0.7rem",fontWeight:"600",background:"rgba(139,92,246,0.12)",color:"#8b5cf6",border:"1px solid rgba(139,92,246,0.2)"},children:r},r))})]}),e.jsxs("button",{onClick:()=>{if(!l?.isSignedIn){l?.signIn?.();return}k?.()},className:"hover-lift",style:{width:"100%",padding:"16px",borderRadius:"var(--radius-lg)",background:"linear-gradient(135deg, #8b5cf6, #7c3aed)",border:"none",color:"white",fontWeight:"800",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer",boxShadow:"0 4px 16px rgba(139,92,246,0.3)",marginBottom:"8px"},children:[e.jsx(E,{size:20}),i("pro.buyButton")," — ",i("pro.price")]})]})]}),e.jsxs("button",{onClick:z,style:{width:"100%",padding:"10px",borderRadius:"var(--radius-md)",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-secondary)",fontSize:"0.8rem",fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",cursor:"pointer",marginBottom:"var(--spacing-md)"},children:[e.jsx(re,{size:14}),i("supporter.restore")]}),x&&x.length>0&&e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("div",{style:{fontSize:"0.85rem",fontWeight:"700",color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"},children:"Historique des achats"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:x.map((r,n)=>e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",borderRadius:"var(--radius-md)",background:"var(--surface-muted)",border:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"600",fontSize:"0.9rem",color:"var(--text-primary)"},children:r.title||(r.type?`${r.type.charAt(0).toUpperCase()+r.type.slice(1)}`:"Achat")}),e.jsx("div",{style:{fontSize:"0.75rem",color:"var(--text-secondary)"},children:r.date?new Date(r.date).toLocaleDateString(C.language,{year:"numeric",month:"short",day:"numeric"}):""})]}),e.jsx("div",{style:{fontWeight:"800",color:"#10b981",fontSize:"0.9rem"},children:r.price||"€"})]},n))})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:p,children:i("settings.preferences")}),e.jsx(h,{icon:ie,title:i("settings.notifications"),description:i("settings.reminder"),color:"#8b5cf6",isLast:!t.notificationsEnabled,children:e.jsx(B,{enabled:t.notificationsEnabled,onClick:$,activeGradient:"linear-gradient(135deg, #8b5cf6, #6d28d9)"})}),t?.notificationsEnabled&&t?.notificationTime&&e.jsxs("div",{className:"scale-in",style:{padding:"12px 0 16px 0",borderBottom:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",color:"var(--text-secondary)"},children:[e.jsx(ae,{size:14}),e.jsx("div",{style:{fontWeight:"600",fontSize:"0.8rem"},children:i("settings.reminderTime")})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx("select",{value:t.notificationTime.hour,onChange:r=>O(r.target.value),style:{padding:"10px 14px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1.1rem",fontWeight:"700",cursor:"pointer",outline:"none",textAlign:"center",flex:1},children:Array.from({length:24},(r,n)=>e.jsx("option",{value:n,style:{background:"var(--surface-muted)",color:"var(--text-primary)"},children:String(n).padStart(2,"0")},n))}),e.jsx("span",{style:{fontSize:"1.4rem",fontWeight:"800",color:"var(--text-secondary)"},children:":"}),e.jsx("select",{value:t.notificationTime.minute,onChange:r=>q(r.target.value),style:{padding:"10px 14px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1.1rem",fontWeight:"700",cursor:"pointer",outline:"none",textAlign:"center",flex:1},children:[0,15,30,45].map(r=>e.jsx("option",{value:r,style:{background:"var(--surface-muted)",color:"var(--text-primary)"},children:String(r).padStart(2,"0")},r))})]})]}),e.jsx(h,{icon:te,title:i("settings.soundEffects"),description:i("settings.soundsDescription"),color:"#0ea5e9",isLast:!0,children:e.jsx(B,{enabled:t.soundsEnabled,onClick:G,activeGradient:"linear-gradient(135deg, #0ea5e9, #0284c7)"})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:p,children:i("settings.language")}),e.jsx(h,{icon:ne,title:i("settings.language"),description:i("settings.languageDesc"),color:"#06b6d4",isLast:!0,children:e.jsxs("select",{value:C.language,onChange:r=>{C.changeLanguage(r.target.value),localStorage.setItem("oneup_language",r.target.value)},style:{padding:"8px 12px",borderRadius:"10px",border:"2px solid var(--border-subtle)",background:"#1a1a2e",color:"#ffffff",fontSize:"0.85rem",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease",minHeight:"var(--touch-min)",minWidth:"140px",outline:"none"},children:[e.jsx("option",{value:"fr",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.french")}),e.jsx("option",{value:"en",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.english")}),e.jsx("option",{value:"es",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.spanish")}),e.jsx("option",{value:"zh",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.chinese")}),e.jsx("option",{value:"ru",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.russian")})]})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:p,children:i("settings.performance")}),e.jsx(h,{icon:se,title:i("settings.graphicsMode"),description:t.performanceMode==="low"?i("settings.reducedEffects"):i("settings.allEffects"),color:"#10b981",isLast:!0,children:e.jsx("div",{style:{display:"flex",gap:"4px",flexShrink:0},children:[{value:"low",label:i("settings.eco"),color:"#f59e0b"},{value:"high",label:i("settings.max"),color:"#8b5cf6"}].map(r=>e.jsx("button",{onClick:()=>{const n={...t,performanceMode:r.value};o(n),d()},style:{padding:"6px 16px",borderRadius:"10px",border:t.performanceMode===r.value?`2px solid ${r.color}`:"2px solid var(--border-subtle)",background:t.performanceMode===r.value?`${r.color}20`:"transparent",color:t.performanceMode===r.value?r.color:"var(--text-secondary)",fontSize:"0.85rem",fontWeight:"700",cursor:"pointer",transition:"all 0.2s ease",minHeight:"var(--touch-min)"},children:r.label},r.value))})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:p,children:i("settings.community")}),e.jsx(h,{icon:oe,title:i("settings.leaderboard"),description:i("settings.leaderboardDesc"),color:"#fbbf24",isLast:!t.leaderboardEnabled,children:e.jsx(B,{enabled:t.leaderboardEnabled,onClick:()=>{const r={...t,leaderboardEnabled:!t.leaderboardEnabled};o(r),d()},activeGradient:"linear-gradient(135deg, #fbbf24, #d97706)"})}),t.leaderboardEnabled&&e.jsxs("div",{className:"scale-in",style:{padding:"12px 0 4px 0"},children:[e.jsx("label",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",fontWeight:"600",marginBottom:"8px",display:"block",textTransform:"uppercase",letterSpacing:"0.5px"},children:i("settings.displayName")}),e.jsx("input",{type:"text",value:t.leaderboardPseudo||"",onChange:r=>{const n={...t,leaderboardPseudo:r.target.value.slice(0,20)};o(n)},onBlur:()=>d(),placeholder:l?.user?.displayName||i("settings.yourPseudo"),maxLength:20,style:{width:"100%",padding:"12px 16px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1rem",fontWeight:"600",outline:"none",boxSizing:"border-box",transition:"all 0.2s ease"},onFocus:r=>{r.target.style.borderColor="#fbbf24",r.target.style.background="var(--surface-hover)"}}),e.jsx("div",{style:{fontSize:"0.75rem",color:"var(--text-secondary)",marginTop:"8px",opacity:.8},children:i("settings.maxChars")})]})]}),l&&u&&e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:p,children:i("settings.dataCloud")}),e.jsx(pe,{authState:l,onSignIn:()=>u.signIn(),onSignOut:()=>u.signOut(),onDeleteAccount:async()=>{await u.deleteAccount(),v()},conflictData:y,onResolveConflict:j})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)",border:m?"1px solid rgba(239, 68, 68, 0.3)":"1px solid var(--border-subtle)",transition:"all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",position:"relative",overflow:"hidden",flexShrink:0},children:[e.jsx("h3",{style:{...p,color:m?"#ef4444":"var(--text-secondary)"},children:i("settings.difficulty")}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsxs("div",{style:{background:m?"rgba(239, 68, 68, 0.15)":"rgba(239, 68, 68, 0.05)",border:`1px solid ${m?"rgba(239, 68, 68, 0.3)":"rgba(239, 68, 68, 0.1)"}`,padding:"14px",borderRadius:"var(--radius-md)",color:"#fca5a5",fontSize:"0.85rem",lineHeight:"1.6",display:"flex",flexDirection:"column",gap:"8px",transition:"all 0.3s ease"},children:[e.jsxs("p",{style:{margin:0,fontWeight:"800",display:"flex",alignItems:"center",gap:"6px",color:"#ef4444"},children:[e.jsx(A,{size:14})," ",i("settings.sensitiveParam")]}),e.jsx("p",{style:{margin:0,opacity:.9},children:i("settings.sensitiveWarning")})]})}),m?e.jsxs("div",{className:"scale-in",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("span",{style:{fontWeight:"700",color:"white",fontSize:"0.9rem"},children:i("settings.multiplier")}),e.jsxs("button",{onClick:()=>L(!1),style:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"12px",padding:"4px 10px",color:"white",fontSize:"0.7rem",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},children:[i("settings.lock")," ",e.jsx(le,{size:12})]})]}),e.jsxs("span",{style:{fontWeight:"800",color:"#fbbf24",fontSize:"1.4rem",textShadow:"0 0 10px rgba(251,191,36,0.3)"},children:[t.difficultyMultiplier||1,"x"]})]}),e.jsx("input",{type:"range",min:"0.1",max:"1.0",step:"0.1",value:t.difficultyMultiplier||1,onChange:r=>{const n=Math.min(1,Math.max(.1,parseFloat(r.target.value)));o({...t,difficultyMultiplier:n})},onMouseUp:()=>d(),onTouchEnd:()=>d(),style:{width:"100%",height:"6px",accentColor:"#fbbf24",cursor:"pointer",filter:"drop-shadow(0 0 5px rgba(251,191,36,0.2))"}})]}):e.jsxs("button",{onClick:()=>L(!0),className:"hover-lift",style:{width:"100%",padding:"16px",borderRadius:"var(--radius-lg)",background:"rgba(239, 68, 68, 0.1)",border:"2px solid rgba(239, 68, 68, 0.4)",color:"#ef4444",fontWeight:"800",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",cursor:"pointer",letterSpacing:"1px",boxShadow:"0 4px 12px rgba(239, 68, 68, 0.1)"},children:[i("settings.unlockSettings")," ",e.jsx(A,{size:18})]})]})]})]})})}export{ve as Settings};
