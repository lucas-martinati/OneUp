import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const names = [
  // Core & custom exercise icons
  'dumbbell', 'arrow-down-up', 'arrow-up', 'zap', 'chevrons-up', 'footprints',
  'flame', 'square', 'move-down', 'move-diagonal', 'activity', 'heart', 'star',
  'target', 'trophy', 'swords', 'crown', 'medal', 'award', 'shield', 'bike',
  'mountain', 'droplets', 'ghost', 'moon', 'sun', 'rocket', 'gem', 'sparkles',
  'navigation', 'map-pin', 'compass', 'anchor', 'coffee', 'music', 'hexagon',
  'circle', 'triangle', 'scissors', 'hammer', 'wrench', 'thermometer', 'wind',
  'umbrella', 'snowflake', 'smile', 'battery', 'battery-full',
  // Watch UI & navigation icons
  'arrow-left', 'flag', 'play', 'pause', 'check', 'check-check', 'plus', 'minus',
  'list-plus', 'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
  'refresh-cw', 'rotate-ccw', 'lock', 'folder-plus', 'circle-check', 'bookmark', 'watch', 'clock'
];
const pathData = (type, a) => {
  if (type === 'path') return a.d;
  if (type === 'line') return `M${a.x1},${a.y1} L${a.x2},${a.y2}`;
  if (type === 'polyline' || type === 'polygon') return `M${a.points.trim().split(/[ ,]+/).reduce((r, v, i) => r + (i % 2 ? ',' : i ? ' L' : '') + v, '')}${type === 'polygon' ? ' Z' : ''}`;
  if (type === 'circle') return `M${Number(a.cx) - Number(a.r)},${a.cy} a${a.r},${a.r} 0,1 0,${2 * Number(a.r)},0 a${a.r},${a.r} 0,1 0,${-2 * Number(a.r)},0`;
  if (type === 'rect') {
    const x = +a.x, y = +a.y, w = +a.width, h = +a.height, r = +(a.rx || 0);
    return `M${x+r},${y} H${x+w-r} Q${x+w},${y} ${x+w},${y+r} V${y+h-r} Q${x+w},${y+h} ${x+w-r},${y+h} H${x+r} Q${x},${y+h} ${x},${y+h-r} V${y+r} Q${x},${y} ${x+r},${y} Z`;
  }
  throw new Error(`Unsupported Lucide element: ${type}`);
};
for (const name of names) {
  const source = readFileSync(resolve(`node_modules/lucide-react/dist/esm/icons/${name}.js`), 'utf8');
  const match = source.match(/const __iconNode = ([\s\S]*?);\n/);
  // Installed, repository-pinned Lucide data; no external input is evaluated.
  const nodes = Function(`return (${match[1]})`)();
  const paths = nodes.map(([tag, attrs]) => `    <path android:fillColor="@android:color/transparent" android:strokeColor="#FFFFFF" android:strokeWidth="2" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="${pathData(tag, attrs)}" />`).join('\n');
  writeFileSync(resolve(`android/wear/src/main/res/drawable/ic_${name.replaceAll('-', '_')}.xml`), `<!-- Lucide ${name}, ISC license; see THIRD_PARTY_NOTICES.md. -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n${paths}\n</vector>\n`);
}

const cases = names.map(name => `            case "${name.replaceAll('-', '_')}": return R.drawable.ic_${name.replaceAll('-', '_')};`).join('\n');
writeFileSync(resolve('android/wear/src/main/java/com/lucasm548/oneup/wear/WatchIcons.java'), `package com.lucasm548.oneup.wear;

// Generated from the app's pinned Lucide icons by scripts/android/generate-wear-icons.mjs.
final class WatchIcons {
    private WatchIcons() {}
    static int resource(String name) {
        String key = name == null ? "" : name.replaceAll("([a-z])([A-Z])", "$1_$2").replace('-', '_').toLowerCase(java.util.Locale.ROOT);
        switch (key) {
${cases}
            default: return R.drawable.ic_dumbbell;
        }
    }
}
`);
