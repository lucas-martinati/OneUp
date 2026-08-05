import { Button } from './Button';
import { X, ArrowLeft } from '@utils/icons';

/**
 * Standardized Modal Header component to enforce consistent modal titles,
 * subtitles, icons, and close button layout across the app.
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
}) {
  return (
    <div className={`modal-header ${className}`} style={style}>
      <div className="modal-header-title-group">
        {onBack && (
          <Button
            iconOnly
            icon={ArrowLeft}
            onClick={onBack}
            aria-label="Back"
            variant="glass"
            className="hover-lift"
          />
        )}
        {Icon && (
          <div className="modal-header-icon">
            <Icon size={20} />
          </div>
        )}
        <div>
          {title && <h2 className="modal-header-title panel-title">{title}</h2>}
          {subtitle && <p className="modal-header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="modal-header-actions">
        {actions}
        {onClose && (
          <Button
            iconOnly
            icon={X}
            onClick={onClose}
            aria-label="Close modal"
            variant="glass"
            className="hover-lift"
          />
        )}
      </div>
    </div>
  );
}

