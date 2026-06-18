/**
 * Shared, lazily-created portal host for all transient toasts (achievement
 * unlocks + pokes). Keeping them in one fixed flex column means they stack
 * vertically and reflow automatically when any of them leaves — so a poke no
 * longer floats in place after the achievement above it disappears.
 *
 * Children control their own vertical order via CSS `order` (achievements on
 * top, pokes below) and become interactive with `pointer-events: auto`.
 */
let root = null;

export function getToastRoot() {
  if (typeof document === 'undefined') return null;
  if (root && document.body.contains(root)) return root;

  root = document.getElementById('oneup-toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'oneup-toast-root';
    root.style.cssText = [
      'position:fixed',
      'top:calc(var(--spacing-md) + env(safe-area-inset-top))',
      'left:0',
      'right:0',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:10px',
      'padding:0 var(--spacing-md)',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(root);
  }
  return root;
}
