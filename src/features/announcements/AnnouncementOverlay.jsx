/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  ANNOUNCEMENT OVERLAY COMPONENT                                   ║
 * ║                                                                   ║
 * ║  ⚠️  CE FICHIER EST SUSCEPTIBLE DE CHANGER CONSTAMMENT.          ║
 * ║  Le contenu visuel (layout, images, textes) peut être réécrit     ║
 * ║  à chaque nouvelle annonce/mise à jour. Les traductions           ║
 * ║  associées (announcement.*) suivront le même cycle de vie.        ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBackHandler } from '../../hooks/useBackHandler';

/**
 * Full-screen announcement overlay with smooth enter/exit animations.
 * Designed to feel native and premium, matching the app's dark theme.
 *
 * @param {{ announcement: object, onDismiss: () => void }} props
 */
export function AnnouncementOverlay({ announcement, onDismiss }) {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 400);
  };

  // Handle back button to dismiss announcement
  useBackHandler(() => {
    handleDismiss();
    return true;
  }, true);

  const title = t(announcement.titleKey, { defaultValue: announcement.titleKey });
  const body = t(announcement.bodyKey, { defaultValue: announcement.bodyKey });
  const cta = t(announcement.ctaKey, { defaultValue: announcement.ctaKey });
  const images = announcement.images || [];
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: exiting ? 'ann-fade-out 0.4s ease forwards' : 'ann-fade-in 0.4s ease',
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          maxWidth: '380px',
          width: '100%',
          maxHeight: '90vh',
          borderRadius: '24px',
          padding: '28px 24px 24px',
          background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 45, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(109, 40, 217, 0.15)',
          textAlign: 'center',
          animation: exiting ? 'ann-card-out 0.4s ease forwards' : 'ann-card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          overflowY: 'auto',
        }}
        className="no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(109, 40, 217, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Emoji */}
        <div style={{
          fontSize: '48px',
          marginBottom: '12px',
          animation: 'ann-emoji-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
          position: 'relative',
        }}>
          {announcement.emoji}
        </div>

        {/* Badge "NOUVEAU" */}
        <div style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: '#fff',
          marginBottom: '10px',
          animation: 'ann-emoji-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s backwards',
          position: 'relative',
        }}>
          {t('announcement.badge', { defaultValue: 'Nouveau' })}
        </div>

        {/* Title */}
        <h2 className="panel-title" style={{
          animation: 'ann-text-in 0.5s ease 0.35s backwards',
          position: 'relative',
        }}>
          {title}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '16px',
          animation: 'ann-text-in 0.5s ease 0.45s backwards',
          position: 'relative',
        }}>
          {body}
        </p>

        {/* Images showcase */}
        {images.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px',
            animation: 'ann-text-in 0.6s ease 0.55s backwards',
            position: 'relative',
          }}>
            {images.map((src, i) => (
              <div
                key={i}
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={`${basePath}${src.replace(/^\//, '')}`}
                  alt=""
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '10px',
                    filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleDismiss}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            animation: 'ann-text-in 0.5s ease 0.65s backwards',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {cta}
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes ann-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ann-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes ann-card-in {
          from { opacity: 0; transform: scale(0.85) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ann-card-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.9) translateY(20px); }
        }
        @keyframes ann-emoji-bounce {
          from { opacity: 0; transform: scale(0) rotate(-15deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes ann-text-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
