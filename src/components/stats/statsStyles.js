/* Shared style helpers for the Stats panel and its sections. */

export const statCardStyle = (bg1, bg2) => ({
    padding: '14px 12px', borderRadius: 'var(--radius-lg)',
    background: `linear-gradient(135deg, ${bg1}, ${bg2})`, textAlign: 'center'
});

export const statLabelStyle = {
    fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
};

export const statLabelSmallStyle = {
    fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px'
};

export const sectionTitleStyle = {
    marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '1px',
    color: 'var(--text-secondary)'
};
