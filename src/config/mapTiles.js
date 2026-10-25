/** Public OSM tiles: interactive viewing only, no prefetch or offline downloads.
 * Usage policy: https://operations.osmfoundation.org/policies/tiles/
 */
export const MAP_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};
