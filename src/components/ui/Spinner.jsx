import styles from '@styles/Spinner.module.css';

/**
 * Centralized loading indicator: a spinning ring with optional adaptable text.
 *
 * Replaces the per-feature loaders (leaderboard, admin panel, …) so every
 * loading state looks identical and actually rotates.
 *
 * @param {string}  [label]      Optional text shown under the ring.
 * @param {number}  [size=34]    Ring diameter in px.
 * @param {number}  [thickness]  Ring border width in px (defaults to size/11).
 * @param {string}  [color]      Override the moving arc colour (CSS colour).
 * @param {string}  [className]  Extra class on the wrapper.
 * @param {object}  [style]      Extra inline style on the wrapper.
 */
export function Spinner({ label, size = 34, thickness, color, className = '', style }) {
  const borderWidth = thickness ?? Math.max(2, Math.round(size / 11));

  return (
    <div className={`${styles.wrap} ${className}`} style={style}>
      <div
        className={styles.ring}
        style={{
          width: size,
          height: size,
          borderWidth,
          ...(color ? { borderTopColor: color } : null),
        }}
      />
      {label != null && label !== '' && <span className={styles.label}>{label}</span>}
    </div>
  );
}
