/** A short divider whose border colour can be inherited from any enclosing badge. */
export function LevelSeparator({ color = 'var(--streak-separator, var(--border-strong))' }) {
    return <span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: 2, height: 12, margin: '0 3px', borderRadius: 1, background: color }} />;
}
