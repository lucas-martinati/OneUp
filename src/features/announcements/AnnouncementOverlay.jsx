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
import { useBackHandler } from '@hooks/useBackHandler';

/**
 * Full-screen announcement overlay with smooth enter/exit animations.
 *
 * Fully theme-aware: every accent surface derives from the active theme
 * tokens (--accent, --accent-glow, --gradient-glow, --card-bg) so the panel
 * blends with whichever theme the user has selected instead of a hard-coded
 * purple. Designed to feel native and premium.
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
  const highlights = announcement.highlights || [];
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <div
      className="ann-backdrop"
      style={{
        animation: exiting ? 'ann-fade-out 0.4s ease forwards' : 'ann-fade-in 0.4s ease',
      }}
      onClick={handleDismiss}
    >
      <div
        className="ann-card no-scrollbar"
        style={{
          animation: exiting
            ? 'ann-card-out 0.4s ease forwards'
            : 'ann-card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient accent glow behind the card content */}
        <div className="ann-aura" aria-hidden="true" />

        {/* Hero icon inside a pulsing accent ring */}
        <div className="ann-hero">
          <span className="ann-ring ann-ring-1" aria-hidden="true" />
          <span className="ann-ring ann-ring-2" aria-hidden="true" />
          <div className="ann-emoji">{announcement.emoji}</div>
        </div>

        {/* Badge */}
        <div className="ann-badge">
          {t('announcement.badge', { defaultValue: 'Nouveau' })}
        </div>

        {/* Title */}
        <h2 className="panel-title ann-title">{title}</h2>

        {/* Body */}
        <p className="ann-body">{body}</p>

        {/* Highlights list */}
        {highlights.length > 0 && (
          <ul className="ann-highlights">
            {highlights.map((h, i) => (
              <li
                key={h.key || i}
                className="ann-highlight"
                style={{ animationDelay: `${0.55 + i * 0.08}s` }}
              >
                <span className="ann-highlight-icon">{h.emoji}</span>
                <span className="ann-highlight-text">
                  {t(h.key, { defaultValue: h.key })}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Optional images showcase */}
        {images.length > 0 && (
          <div className="ann-images">
            {images.map((src, i) => (
              <div key={i} className="ann-image-frame">
                <img
                  src={`${basePath}${src.replace(/^\//, '')}`}
                  alt=""
                  className="ann-image"
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <button
          className="ann-cta"
          onClick={handleDismiss}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span className="ann-cta-shine" aria-hidden="true" />
          <span className="ann-cta-label">{cta}</span>
        </button>
      </div>
    </div>
  );
}
