/**
 * Deterministically derive an organic, irregular CSS border-radius from a seed
 * string. Each seed produces its own distinct droplet silhouette, so theme
 * swatches don't all share the same shape.
 *
 * @param {string} seed
 * @returns {string} a CSS border-radius value
 */
export function blobRadius(seed) {
  // Tiny seeded PRNG (mulberry32-ish) so the shape is stable per seed.
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const next = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  // Radii between 32% and 68% give clearly asymmetric, watery blobs.
  const r = () => Math.round(32 + next() * 36);
  return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
}
