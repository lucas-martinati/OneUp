import{u as W,j as e,i as A}from"./index-D_Xu2RXJ.js";import{a as g,Q as I,V as h,l as R,W as O,Y as q,_ as T,$ as V,t as _,E as K,X as Q,H as X,a0 as G,a1 as J,a2 as Z,a3 as ee,a4 as ie,a5 as re,a6 as te,U as ae,L as $,a7 as ne}from"./ui-vendor-DJa_l8Ol.js";import{b as D}from"./charts-vendor-CaEEYMlG.js";import{A as se}from"./Dashboard-sJMOXx4U.js";import{T as oe}from"./Trans-DYNhHTIF.js";import"./capacitor-vendor-D_VhNmQL.js";import"./firebase-vendor-yOrvc3fF.js";function le({authState:n,onSignIn:t,onSignOut:d,conflictData:s,onResolveConflict:o,onDeleteAccount:c}){const[m,v]=g.useState(!1),{t:a}=W(),[k,f]=g.useState(!1),[p,y]=g.useState(!1),[i,u]=g.useState(!1),x=async j=>{v(!0);try{await o(j)}finally{v(!1)}};return s?D.createPortal(e.jsxs("div",{className:"conflict-fullscreen-overlay",children:[e.jsxs("div",{className:"conflict-modal",children:[e.jsxs("div",{className:"conflict-header",children:[e.jsx(I,{className:"conflict-icon"}),e.jsx("h2",{children:a("cloud.cloudDataDetected")})]}),e.jsx("p",{className:"conflict-message",children:a("cloud.backupExists")}),e.jsxs("div",{className:"conflict-actions",children:[e.jsxs("button",{className:"btn-conflict btn-restore",onClick:()=>x("restore"),disabled:m,children:[e.jsx(h,{}),e.jsxs("div",{children:[e.jsx("strong",{children:a("cloud.restore")}),e.jsx("span",{children:a("cloud.restoreDesc")})]})]}),e.jsxs("button",{className:`btn-conflict btn-upload ${i?"confirming":""}`,onClick:()=>{i?x("upload"):(u(!0),setTimeout(()=>u(!1),3e3))},disabled:m,style:i?{background:"linear-gradient(135deg, #ef4444, #dc2626)"}:{},children:[i?e.jsx(R,{}):e.jsx(O,{}),e.jsxs("div",{children:[e.jsx("strong",{children:a(i?"cloud.areYouSure":"cloud.replaceCloud")}),e.jsx("span",{children:a(i?"cloud.cannotBeUndone":"cloud.replaceDesc")})]})]})]})]}),e.jsx("style",{children:`
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
        `})]}),document.body):e.jsxs("div",{className:"cloud-sync-panel",children:[e.jsxs("div",{className:"cloud-sync-header",children:[e.jsx("div",{className:"cloud-sync-icon",children:n.isSignedIn?e.jsx(h,{className:"icon-cloud connected"}):e.jsx(q,{className:"icon-cloud disconnected"})}),e.jsxs("div",{className:"cloud-sync-title",children:[e.jsx("h3",{children:a("cloud.cloudBackup")}),e.jsx("p",{className:"cloud-sync-subtitle",children:n.isSignedIn?a("cloud.connectedGooglePlay"):a("cloud.notConnected")})]})]}),n.loading?e.jsxs("div",{className:"cloud-sync-loading",children:[e.jsx(h,{className:"pulse-animation"}),e.jsx("span",{children:a("cloud.loading")})]}):n.isSignedIn?e.jsxs("div",{className:"cloud-sync-content",children:[e.jsxs("div",{className:"cloud-user-info",children:[e.jsx(se,{photoURL:n.user?.photoURL,name:n.user?.displayName||n.user?.email,size:48}),e.jsxs("div",{className:"user-details",children:[e.jsx("p",{className:"user-name",children:n.user?.displayName||a("cloud.user")}),e.jsx("p",{className:"user-email",children:n.user?.email||""})]})]}),s&&e.jsxs("div",{className:"conflict-dialog",children:[e.jsxs("div",{className:"conflict-header",children:[e.jsx(I,{className:"conflict-icon"}),e.jsx("h4",{children:a("cloud.dataConflict")})]}),e.jsx("p",{className:"conflict-message",children:a("cloud.resolving")})]}),e.jsxs("div",{className:"auto-sync-info",children:[e.jsx(h,{className:"info-icon"}),e.jsx("span",{children:a("cloud.autoSyncEnabled")})]}),e.jsx("button",{className:"btn-cloud-signout",onClick:d,disabled:n.loading,children:a("cloud.signOut")}),e.jsxs("button",{className:"btn-cloud-delete",onClick:()=>f(!0),disabled:n.loading,children:[e.jsx(T,{size:16}),a("cloud.deleteAccount")]}),k&&D.createPortal(e.jsxs("div",{className:"delete-overlay",onClick:()=>f(!1),children:[e.jsxs("div",{className:"delete-modal",onClick:j=>j.stopPropagation(),children:[e.jsxs("div",{className:"delete-bg-effects",children:[e.jsx("div",{className:"delete-glow delete-glow-1"}),e.jsx("div",{className:"delete-glow delete-glow-2"})]}),e.jsxs("div",{className:"delete-content",children:[e.jsxs("div",{className:"delete-icon-wrapper",children:[e.jsx("div",{className:"delete-icon-pulse"}),e.jsx("div",{className:"delete-icon",children:e.jsx(T,{})})]}),e.jsx("h3",{children:a("cloud.deleteTitle")}),e.jsx("p",{children:e.jsxs(oe,{i18nKey:"cloud.deleteWarning",children:["Cette action est ",e.jsx("strong",{children:"irréversible"}),". Toutes vos données seront supprimées définitivement, y compris votre progression et vos paramètres."]})}),e.jsxs("div",{className:"delete-warning",children:[e.jsx(R,{size:14}),e.jsx("span",{children:a("cloud.deleteCannotUndo")})]}),e.jsxs("div",{className:"delete-actions",children:[e.jsx("button",{className:"btn-delete-cancel",onClick:()=>f(!1),disabled:p,children:a("common.cancel")}),e.jsx("button",{className:"btn-delete-confirm",onClick:async()=>{y(!0);try{await c()}finally{y(!1),f(!1)}},disabled:p,children:p?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"delete-spinner"}),a("cloud.deleting")]}):e.jsxs(e.Fragment,{children:[e.jsx(T,{size:16}),a("cloud.deleteConfirm")]})})]})]})]}),e.jsx("style",{children:`
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
              `})]}),document.body)]}):e.jsxs("div",{className:"cloud-sync-content",children:[e.jsxs("div",{className:"cloud-promo",children:[e.jsx("p",{className:"cloud-promo-text",children:a("cloud.promoText")}),e.jsxs("ul",{className:"cloud-benefits",children:[e.jsxs("li",{children:[e.jsx(h,{className:"icon-check"}),e.jsx("span",{children:a("cloud.autoBackup")})]}),e.jsxs("li",{children:[e.jsx(h,{className:"icon-check"}),e.jsx("span",{children:a("cloud.multiDevice")})]}),e.jsxs("li",{children:[e.jsx(h,{className:"icon-check"}),e.jsx("span",{children:a("cloud.neverLose")})]})]})]}),e.jsxs("button",{className:"btn-cloud-signin",onClick:t,disabled:n.loading,children:[e.jsxs("svg",{className:"google-icon",viewBox:"0 0 24 24",children:[e.jsx("path",{fill:"#4285F4",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),e.jsx("path",{fill:"#34A853",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),e.jsx("path",{fill:"#FBBC05",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),e.jsx("path",{fill:"#EA4335",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),a("cloud.signInWithGoogle")]}),n.error&&e.jsxs("div",{className:"sync-message error",children:[e.jsx(I,{}),e.jsx("span",{children:n.error})]})]}),e.jsx("style",{children:`
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
      `})]})}function B({enabled:n,onClick:t,activeGradient:d}){const{t:s}=W();return e.jsx("button",{onClick:t,"aria-label":s(n?"settings.disable":"settings.enable"),style:{width:"50px",height:"28px",borderRadius:"14px",background:n?d:"var(--surface-hover)",border:"none",cursor:"pointer",position:"relative",transition:"all 0.3s ease",boxShadow:n?"0 4px 12px rgba(0,0,0,0.15)":"none",flexShrink:0,display:"flex",alignItems:"center",padding:"0 4px"},children:e.jsx("div",{style:{width:"22px",height:"22px",borderRadius:"50%",background:"white",position:"absolute",left:n?"calc(100% - 26px)":"4px",transition:"left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}})})}function N({icon:n,title:t,description:d,color:s,children:o,isLast:c}){return e.jsxs("div",{style:{padding:"12px 0",borderBottom:c?"none":"1px solid var(--border-subtle)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("div",{style:{background:`linear-gradient(135deg, ${s}20, ${s}08)`,padding:"10px",borderRadius:"12px",border:`1px solid ${s}30`},children:e.jsx(n,{size:20,color:s})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"700",fontSize:"1rem",color:"var(--text-primary)"},children:t}),d&&e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginTop:"2px"},children:d})]})]}),o]})}function Y({isActive:n,title:t,icon:d,colorMain:s,colorRGB:o,colorGradientStart:c,colorGradientEnd:m,activeTitle:v,activeDesc:a,idleDescription:k,idleExplanation:f,features:p,buyButtonText:y,onPurchase:i,cloudAuth:u,allowMultiplePurchases:x=!1}){const j={marginBottom:"var(--spacing-md)",fontSize:"0.85rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",color:"var(--text-secondary)"},b=async()=>{if(!u?.isSignedIn){u?.signIn?.();return}await i?.()};return e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:n?`linear-gradient(135deg, rgba(${o},0.08), rgba(${o},0.02))`:"var(--surface-section)",border:n?`1px solid rgba(${o},0.2)`:"1px solid var(--border-subtle)"},children:[e.jsx("h3",{style:j,children:t}),n&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",padding:"16px",borderRadius:"var(--radius-lg)",background:`rgba(${o},0.1)`,border:`1px solid rgba(${o},0.2)`,marginBottom:x?"16px":"0"},children:[e.jsx("div",{style:{width:"48px",height:"48px",borderRadius:"50%",background:`linear-gradient(135deg, ${c}, ${m})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px rgba(${o},0.3)`,flexShrink:0},children:e.jsx(d,{size:24,color:"white",fill:x?"white":"none"})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:"800",fontSize:"1rem",color:s},children:v}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginTop:"2px"},children:a})]})]}),(!n||x)&&e.jsxs("div",{children:[!n&&e.jsxs("div",{style:{padding:"20px",borderRadius:"var(--radius-lg)",background:`linear-gradient(135deg, rgba(${o},0.06), rgba(${o},0.02))`,border:`1px solid rgba(${o},0.12)`,textAlign:"center",marginBottom:"12px"},children:[e.jsx(d,{size:32,color:s,style:{marginBottom:"8px",opacity:.8}}),e.jsx("div",{style:{fontWeight:"700",fontSize:"1rem",color:"var(--text-primary)",marginBottom:"6px"},children:k}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",lineHeight:"1.5",...p&&p.length>0?{marginBottom:"12px"}:{}},children:f}),p&&p.length>0&&e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center"},children:p.map(z=>e.jsx("span",{style:{padding:"4px 10px",borderRadius:"20px",fontSize:"0.7rem",fontWeight:"600",background:`rgba(${o},0.12)`,color:s,border:`1px solid rgba(${o},0.2)`},children:z},z))})]}),e.jsxs("button",{onClick:b,className:"hover-lift",style:{width:"100%",padding:"16px",borderRadius:"var(--radius-lg)",background:`linear-gradient(135deg, ${c}, ${m})`,border:"none",color:"white",fontWeight:"800",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer",boxShadow:`0 4px 16px rgba(${o},0.3)`,marginBottom:"8px"},children:[e.jsx(d,{size:20,fill:x?"white":"none"}),y]})]})]})}function be({defaultShowStore:n=!1,settings:t,onClose:d,onSave:s,cloudAuth:o,cloudSync:c,conflictData:m,onResolveConflict:v,isSupporter:a,isPro:k,onPurchaseSupporter:f,onPurchasePro:p,onRestorePurchases:y}){const{t:i,i18n:u}=W(),[x,j]=g.useState(!1),[b,z]=g.useState(n),[S,E]=g.useState(!1),[M,L]=g.useState([]),C=M||[];g.useEffect(()=>{b&&A().then(r=>{L(r)})},[b]);const H=()=>{const r={...t,notificationsEnabled:!t.notificationsEnabled};s(r)},P=()=>{const r={...t,soundsEnabled:!t.soundsEnabled};s(r)},U=r=>{const l={...t,notificationTime:{...t.notificationTime,hour:parseInt(r)}};s(l)},F=r=>{const l={...t,notificationTime:{...t.notificationTime,minute:parseInt(r)}};s(l)},w={marginBottom:"var(--spacing-md)",fontSize:"0.85rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",color:"var(--text-secondary)"};return e.jsx("div",{className:"fade-in modal-overlay",style:{zIndex:110},children:e.jsxs("div",{className:"modal-content",style:{maxWidth:"600px",width:"100%",margin:"0 auto",padding:"var(--spacing-md)",paddingTop:"calc(var(--spacing-md) + env(safe-area-inset-top))",paddingBottom:"calc(var(--spacing-lg) + env(safe-area-inset-bottom))"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"var(--spacing-md)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[b&&e.jsx("button",{onClick:()=>z(!1),className:"hover-lift glass",style:{background:"var(--surface-hover)",border:"none",borderRadius:"50%",width:"var(--touch-min)",height:"var(--touch-min)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",cursor:"pointer"},children:e.jsx(V,{size:22})}),e.jsx("h2",{className:"rainbow-gradient",style:{margin:0,fontSize:"clamp(1.5rem, 4vw, 2rem)",fontWeight:"800"},children:b?"Boutique":i("settings.title")})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[x&&e.jsxs("div",{className:"scale-in",style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"20px",background:"var(--success)",color:"white",fontSize:"0.85rem",fontWeight:"600",boxShadow:"var(--glow-success)"},children:[e.jsx(_,{size:16}),i("common.saved")]}),e.jsxs("div",{style:{display:"flex",gap:"8px",alignItems:"center"},children:[!b&&e.jsxs("button",{onClick:()=>z(!0),className:"hover-lift",style:{background:"linear-gradient(135deg, #10b981, #059669)",border:"1px solid rgba(16, 185, 129, 0.4)",borderRadius:"24px",padding:"0 16px",height:"var(--touch-min)",display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",color:"white",cursor:"pointer",boxShadow:"0 4px 12px rgba(16, 185, 129, 0.3)",fontWeight:"800",fontSize:"0.85rem",letterSpacing:"0.5px"},children:[e.jsx(K,{size:18}),e.jsx("span",{children:"Boutique"})]}),e.jsx("button",{onClick:d,className:"hover-lift glass",style:{background:"var(--surface-hover)",border:"none",borderRadius:"50%",width:"var(--touch-min)",height:"var(--touch-min)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",cursor:"pointer"},children:e.jsx(Q,{size:22})})]})]})]}),b?e.jsxs("div",{className:"fade-in slide-up",style:{animationDuration:"0.4s"},children:[e.jsx(Y,{isActive:a,title:i("supporter.title"),icon:X,colorMain:"#ef4444",colorRGB:"239,68,68",colorGradientStart:"#ef4444",colorGradientEnd:"#dc2626",activeTitle:i("supporter.thankYou"),activeDesc:i("supporter.badgeActive"),idleDescription:i("supporter.description"),idleExplanation:i("supporter.explanation"),buyButtonText:a?"Faire un nouveau don":i("supporter.buyButton"),onPurchase:f,cloudAuth:o,allowMultiplePurchases:!0}),e.jsx(Y,{isActive:k,title:i("pro.title"),icon:G,colorMain:"#8b5cf6",colorRGB:"139,92,246",colorGradientStart:"#8b5cf6",colorGradientEnd:"#7c3aed",activeTitle:i("pro.activeTitle"),activeDesc:i("pro.activeDesc"),idleDescription:i("pro.description"),idleExplanation:i("pro.explanation"),features:["Exercices 100% Personnalisés","Dashboard Musculation (Poids)","Leaderboards Exclusifs"],buyButtonText:`${i("pro.buyButton")} — ${i("pro.price")}`,onPurchase:p,cloudAuth:o}),e.jsxs("button",{onClick:y,style:{width:"100%",padding:"10px",borderRadius:"var(--radius-md)",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-secondary)",fontSize:"0.8rem",fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",cursor:"pointer",marginBottom:"var(--spacing-md)"},children:[e.jsx(J,{size:14}),i("supporter.restore")]}),C&&C.length>0&&e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("div",{style:{fontSize:"0.85rem",fontWeight:"700",color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"},children:"Historique des achats"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:C.map((r,l)=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",padding:"12px",borderRadius:"var(--radius-md)",background:"var(--surface-muted)",border:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"},children:[e.jsx("div",{style:{fontWeight:"700",fontSize:"0.9rem",color:"var(--text-primary)"},children:r.title}),e.jsx("div",{style:{fontWeight:"800",fontSize:"0.9rem",color:r.isActive?"#10b981":"var(--text-secondary)"},children:r.price})]}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",marginBottom:"8px"},children:r.desc}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",borderTop:"1px dashed rgba(255,255,255,0.05)",paddingTop:"8px",opacity:.8},children:[e.jsxs("span",{style:{fontFamily:"monospace",letterSpacing:"0.5px"},children:["ID: ",r.id||"N/A"]}),e.jsx("span",{children:r.date?new Date(r.date).toLocaleDateString():""})]})]},l))})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:w,children:i("settings.preferences")}),e.jsx(N,{icon:Z,title:i("settings.notifications"),description:i("settings.reminder"),color:"#8b5cf6",isLast:!t.notificationsEnabled,children:e.jsx(B,{enabled:t.notificationsEnabled,onClick:H,activeGradient:"linear-gradient(135deg, #8b5cf6, #6d28d9)"})}),t?.notificationsEnabled&&t?.notificationTime&&e.jsxs("div",{className:"scale-in",style:{padding:"12px 0 16px 0",borderBottom:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",color:"var(--text-secondary)"},children:[e.jsx(ee,{size:14}),e.jsx("div",{style:{fontWeight:"600",fontSize:"0.8rem"},children:i("settings.reminderTime")})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx("select",{value:t.notificationTime.hour,onChange:r=>U(r.target.value),style:{padding:"10px 14px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1.1rem",fontWeight:"700",cursor:"pointer",outline:"none",textAlign:"center",flex:1},children:Array.from({length:24},(r,l)=>e.jsx("option",{value:l,style:{background:"var(--surface-muted)",color:"var(--text-primary)"},children:String(l).padStart(2,"0")},l))}),e.jsx("span",{style:{fontSize:"1.4rem",fontWeight:"800",color:"var(--text-secondary)"},children:":"}),e.jsx("select",{value:t.notificationTime.minute,onChange:r=>F(r.target.value),style:{padding:"10px 14px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1.1rem",fontWeight:"700",cursor:"pointer",outline:"none",textAlign:"center",flex:1},children:[0,15,30,45].map(r=>e.jsx("option",{value:r,style:{background:"var(--surface-muted)",color:"var(--text-primary)"},children:String(r).padStart(2,"0")},r))})]})]}),e.jsx(N,{icon:ie,title:i("settings.soundEffects"),description:i("settings.soundsDescription"),color:"#0ea5e9",isLast:!0,children:e.jsx(B,{enabled:t.soundsEnabled,onClick:P,activeGradient:"linear-gradient(135deg, #0ea5e9, #0284c7)"})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:w,children:i("settings.language")}),e.jsx(N,{icon:re,title:i("settings.language"),description:i("settings.languageDesc"),color:"#06b6d4",isLast:!0,children:e.jsxs("select",{value:u.language,onChange:r=>{u.changeLanguage(r.target.value),localStorage.setItem("oneup_language",r.target.value)},style:{padding:"8px 12px",borderRadius:"10px",border:"2px solid var(--border-subtle)",background:"#1a1a2e",color:"#ffffff",fontSize:"0.85rem",fontWeight:"600",cursor:"pointer",transition:"all 0.2s ease",minHeight:"var(--touch-min)",minWidth:"140px",outline:"none"},children:[e.jsx("option",{value:"fr",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.french")}),e.jsx("option",{value:"en",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.english")}),e.jsx("option",{value:"es",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.spanish")}),e.jsx("option",{value:"zh",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.chinese")}),e.jsx("option",{value:"ru",style:{background:"#1a1a2e",color:"#ffffff"},children:i("settings.russian")})]})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:w,children:i("settings.performance")}),e.jsx(N,{icon:te,title:i("settings.graphicsMode"),description:t.performanceMode==="low"?i("settings.reducedEffects"):i("settings.allEffects"),color:"#10b981",isLast:!0,children:e.jsx("div",{style:{display:"flex",gap:"4px",flexShrink:0},children:[{value:"low",label:i("settings.eco"),color:"#f59e0b"},{value:"high",label:i("settings.max"),color:"#8b5cf6"}].map(r=>e.jsx("button",{onClick:()=>{const l={...t,performanceMode:r.value};s(l)},style:{padding:"6px 16px",borderRadius:"10px",border:t.performanceMode===r.value?`2px solid ${r.color}`:"2px solid var(--border-subtle)",background:t.performanceMode===r.value?`${r.color}20`:"transparent",color:t.performanceMode===r.value?r.color:"var(--text-secondary)",fontSize:"0.85rem",fontWeight:"700",cursor:"pointer",transition:"all 0.2s ease",minHeight:"var(--touch-min)"},children:r.label},r.value))})})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:w,children:i("settings.community")}),e.jsx(N,{icon:ae,title:i("settings.leaderboard"),description:i("settings.leaderboardDesc"),color:"#fbbf24",isLast:!t.leaderboardEnabled,children:e.jsx(B,{enabled:t.leaderboardEnabled,onClick:()=>{const r={...t,leaderboardEnabled:!t.leaderboardEnabled};s(r)},activeGradient:"linear-gradient(135deg, #fbbf24, #d97706)"})}),t.leaderboardEnabled&&e.jsxs("div",{className:"scale-in",style:{padding:"12px 0 4px 0"},children:[e.jsx("label",{style:{fontSize:"0.8rem",color:"var(--text-secondary)",fontWeight:"600",marginBottom:"8px",display:"block",textTransform:"uppercase",letterSpacing:"0.5px"},children:i("settings.displayName")}),e.jsx("input",{type:"text",value:t.leaderboardPseudo||"",onChange:r=>{const l={...t,leaderboardPseudo:r.target.value.slice(0,20)};s(l)},onBlur:()=>showSavedIndicator(),placeholder:o?.user?.displayName||i("settings.yourPseudo"),maxLength:20,style:{width:"100%",padding:"12px 16px",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)",background:"var(--surface-muted)",color:"var(--text-primary)",fontSize:"1rem",fontWeight:"600",outline:"none",boxSizing:"border-box",transition:"all 0.2s ease"},onFocus:r=>{r.target.style.borderColor="#fbbf24",r.target.style.background="var(--surface-hover)"}}),e.jsx("div",{style:{fontSize:"0.75rem",color:"var(--text-secondary)",marginTop:"8px",opacity:.8},children:i("settings.maxChars")})]})]}),o&&c&&e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)"},children:[e.jsx("h3",{style:w,children:i("settings.dataCloud")}),e.jsx(le,{authState:o,onSignIn:()=>c.signIn(),onSignOut:()=>c.signOut(),onDeleteAccount:async()=>{await c.deleteAccount(),d()},conflictData:m,onResolveConflict:v})]}),e.jsxs("div",{className:"glass-premium",style:{padding:"var(--spacing-md)",borderRadius:"var(--radius-xl)",marginBottom:"var(--spacing-md)",background:"var(--surface-section)",border:S?"1px solid rgba(239, 68, 68, 0.3)":"1px solid var(--border-subtle)",transition:"all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",position:"relative",overflow:"hidden",flexShrink:0},children:[e.jsx("h3",{style:{...w,color:S?"#ef4444":"var(--text-secondary)"},children:i("settings.difficulty")}),e.jsx("div",{style:{marginBottom:"16px"},children:e.jsxs("div",{style:{background:S?"rgba(239, 68, 68, 0.15)":"rgba(239, 68, 68, 0.05)",border:`1px solid ${S?"rgba(239, 68, 68, 0.3)":"rgba(239, 68, 68, 0.1)"}`,padding:"14px",borderRadius:"var(--radius-md)",color:"#fca5a5",fontSize:"0.85rem",lineHeight:"1.6",display:"flex",flexDirection:"column",gap:"8px",transition:"all 0.3s ease"},children:[e.jsxs("p",{style:{margin:0,fontWeight:"800",display:"flex",alignItems:"center",gap:"6px",color:"#ef4444"},children:[e.jsx($,{size:14})," ",i("settings.sensitiveParam")]}),e.jsx("p",{style:{margin:0,opacity:.9},children:i("settings.sensitiveWarning")})]})}),S?e.jsxs("div",{className:"scale-in",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("span",{style:{fontWeight:"700",color:"white",fontSize:"0.9rem"},children:i("settings.multiplier")}),e.jsxs("button",{onClick:()=>E(!1),style:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"12px",padding:"4px 10px",color:"white",fontSize:"0.7rem",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},children:[i("settings.lock")," ",e.jsx(ne,{size:12})]})]}),e.jsxs("span",{style:{fontWeight:"800",color:"#fbbf24",fontSize:"1.4rem",textShadow:"0 0 10px rgba(251,191,36,0.3)"},children:[t.difficultyMultiplier||1,"x"]})]}),e.jsx("input",{type:"range",min:"0.1",max:"1.0",step:"0.1",value:t.difficultyMultiplier||1,onChange:r=>{const l=Math.min(1,Math.max(.1,parseFloat(r.target.value)));s({...t,difficultyMultiplier:l})},onMouseUp:()=>showSavedIndicator(),onTouchEnd:()=>showSavedIndicator(),style:{width:"100%",height:"6px",accentColor:"#fbbf24",cursor:"pointer",filter:"drop-shadow(0 0 5px rgba(251,191,36,0.2))"}})]}):e.jsxs("button",{onClick:()=>E(!0),className:"hover-lift",style:{width:"100%",padding:"16px",borderRadius:"var(--radius-lg)",background:"rgba(239, 68, 68, 0.1)",border:"2px solid rgba(239, 68, 68, 0.4)",color:"#ef4444",fontWeight:"800",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",cursor:"pointer",letterSpacing:"1px",boxShadow:"0 4px 12px rgba(239, 68, 68, 0.1)"},children:[i("settings.unlockSettings")," ",e.jsx($,{size:18})]})]})]})]})})}export{be as Settings};
