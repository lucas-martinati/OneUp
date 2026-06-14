import { forwardRef, useMemo } from 'react';

/**
 * Layout primitive: a flexbox container with token-based spacing.
 *
 * Replaces the most repeated inline pattern in the codebase —
 * `style={{ display: 'flex', flexDirection, alignItems, gap }}` — which appeared
 * hundreds of times with inconsistent gap values. Using the spacing token scale
 * keeps rhythm consistent across screens.
 *
 * @param {'col'|'row'} [direction='col']
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|number} [gap='sm'] – token name or raw px
 * @param {string} [align] – align-items
 * @param {string} [justify] – justify-content
 * @param {boolean} [wrap=false]
 * @param {React.ElementType} [as='div']
 */
const GAP_TOKENS = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
};

export const Stack = forwardRef(function Stack(
  { direction = 'col', gap = 'sm', align, justify, wrap = false, as: Tag = 'div', style, children, ...rest },
  ref,
) {
  const composed = useMemo(
    () => ({
      display: 'flex',
      flexDirection: direction === 'row' ? 'row' : 'column',
      gap: typeof gap === 'number' ? `${gap}px` : (GAP_TOKENS[gap] ?? gap),
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? 'wrap' : undefined,
      ...style,
    }),
    [direction, gap, align, justify, wrap, style],
  );

  return (
    <Tag ref={ref} style={composed} {...rest}>
      {children}
    </Tag>
  );
});
