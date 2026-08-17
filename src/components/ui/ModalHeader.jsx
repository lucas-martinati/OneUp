import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { X, ArrowLeft } from '@utils/icons';

/**
 * Standardized Modal Header component to enforce consistent modal titles,
 * subtitles, icons, and close button layout across the app.
 * Features fluid responsive typography, flexbox boundary isolation to prevent
 * action button overlap, and optional multiline support.
 */
export function ModalHeader({
  title,
  subtitle,
  icon: Icon,
  onClose,
  onBack,
  actions,
  className = '',
  style,
  // Nouveaux paramètres selon la demande :
  showClose = true,
  showBack = false,
  extraElements,
  multiline = false,
}) {
  const { t } = useTranslation();

  return (
    <div className={`modal-header ${className}`.trim()} style={style}>
      <div className="modal-header-title-group">
        {showBack && onBack && (
          <Button
            iconOnly
            icon={ArrowLeft}
            onClick={onBack}
            aria-label={t('onboarding.back')}
            variant="glass"
          />
        )}
        {Icon && (
          <div className="modal-header-icon" aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
        <div className="modal-header-text">
          {/* Style du titre centralisé via CSS (modal-header-title et panel-title) */}
          {title && (
            <h2
              className={`modal-header-title panel-title ${multiline ? 'modal-header-title--multiline' : ''}`.trim()}
              title={typeof title === 'string' ? title : undefined}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="modal-header-subtitle"
              title={typeof subtitle === 'string' ? subtitle : undefined}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="modal-header-actions">
        {/* Zone libre pour ajouter d'autres boutons ou éléments */}
        {extraElements}
        {actions}
        
        {/* Bouton de fermeture géré par le paramètre showClose */}
        {showClose && onClose && (
          <Button
            iconOnly
            icon={X}
            onClick={onClose}
            aria-label={t('common.close')}
            variant="glass"
          />
        )}
      </div>
    </div>
  );
}

