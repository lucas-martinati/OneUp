import { TileLayer } from 'react-leaflet';
import { MAP_TILES } from '@config/mapTiles';
import styles from './MapTileLayer.module.css';

/** Shared basemap keeps provider, attribution and appearance identical. */
export function MapTileLayer() {
  return <TileLayer {...MAP_TILES} className={styles.tiles} />;
}
