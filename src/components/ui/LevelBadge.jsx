import { LevelEmblem } from './LevelEmblem';

export function LevelBadge({ level, style }) {
    if (!Number.isInteger(level) || level <= 0) return null;
    return <span style={{ display: 'inline-flex', marginLeft: '6px', ...style }}><LevelEmblem level={level} size={28} /></span>;
}
