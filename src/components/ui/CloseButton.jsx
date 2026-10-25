import { useTranslation } from 'react-i18next';
import { X } from '@utils/icons';
import { Button } from './Button';

/** One close control for panels, dialogs, maps, banners and notifications. */
export function CloseButton({ className = '', style, ...props }) {
  const { t } = useTranslation();
  return (
    <Button
      {...props}
      iconOnly
      icon={X}
      size="sm"
      variant="glass"
      lift={false}
      aria-label={t('common.close')}
      className={`btn--close ${className}`.trim()}
      style={style}
    />
  );
}
