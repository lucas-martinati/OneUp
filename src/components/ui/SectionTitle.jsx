import { forwardRef, useMemo } from 'react';

/**
 * Standardized section title for panel sub-headings.
 *
 * Replaces the duplicate `.chart-title` CSS class and the two
 * `sectionTitleStyle` JS objects (settingsStyles.js / statsStyles.js)
 * with a single component that controls spacing via props.
 *
 * @param {'h2'|'h3'|'h4'} [level='h3'] — semantic heading element
 * @param {'none'|'sm'|'md'} [spacing='none'] — margin-bottom
 */
const SPACING = {
  none: 0,
  sm: 'var(--space-2)',
  md: 'var(--space-4)',
};

export const SectionTitle = forwardRef(function SectionTitle(
  { level: Tag = 'h3', spacing = 'none', className = '', style, children, ...rest },
  ref,
) {
  const composed = useMemo(
    () => ({
      margin: 0,
      marginBottom: SPACING[spacing],
      fontSize: '0.85rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'var(--text-secondary)',
      ...style,
    }),
    [spacing, style],
  );

  return (
    <Tag ref={ref} className={className || undefined} style={composed} {...rest}>
      {children}
    </Tag>
  );
});
