import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sharp from 'sharp';

// ─── ESM __dirname ──────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// ─── ANSI Colors ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m',
};

// ─── Box drawing helpers ────────────────────────────────────────────────────
const BOX_WIDTH = 64;
const INNER = BOX_WIDTH - 2;

function visualWidth(str) {
  // eslint-disable-next-line no-control-regex
  const clean = str.replace(/\u001b\[[0-9;]*m/g, '');
  let w = 0;
  for (const ch of clean) {
    const cp = ch.codePointAt(0);
    if ((cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0x0300 && cp <= 0x036F)) continue;
    if (cp === 0x200D) continue;
    if (
      cp >= 0x1F000 ||
      (cp >= 0x2600 && cp <= 0x26FF) ||
      (cp >= 0x2702 && cp <= 0x2712) ||
      (cp >= 0x2718 && cp <= 0x27BF) ||
      [0x2705, 0x274C, 0x2728, 0x2753, 0x2757, 0x2B50, 0x2B55,
        0x2714, 0x2716, 0x2744, 0x2764, 0x2934, 0x2935, 0x3030, 0x303D].includes(cp) ||
      (cp >= 0x231A && cp <= 0x231B) ||
      (cp >= 0x23E9 && cp <= 0x23F3) ||
      (cp >= 0x23F8 && cp <= 0x23FA) ||
      (cp >= 0x1100 && cp <= 0x115F) ||
      (cp >= 0x2E80 && cp <= 0x2FFF) ||
      (cp >= 0x3000 && cp <= 0xA4CF) ||
      (cp >= 0xAC00 && cp <= 0xD7A3) ||
      (cp >= 0xF900 && cp <= 0xFAFF) ||
      (cp >= 0xFF00 && cp <= 0xFF60)
    ) {
      w += 2;
      continue;
    }
    w += 1;
  }
  return w;
}

function padVisual(str, target) {
  return str + ' '.repeat(Math.max(0, target - visualWidth(str)));
}

function centerVisual(str, target) {
  const vw = visualWidth(str);
  const left = Math.floor((target - vw) / 2);
  const right = target - vw - left;
  return ' '.repeat(Math.max(0, left)) + str + ' '.repeat(Math.max(0, right));
}

function boxTop() {
  return `${c.cyan}╔${'═'.repeat(INNER)}╗${c.reset}`;
}
function boxBottom() {
  return `${c.cyan}╚${'═'.repeat(INNER)}╝${c.reset}`;
}
function boxDivider() {
  return `${c.cyan}╠${'═'.repeat(INNER)}╣${c.reset}`;
}
function boxLine(content) {
  return `${c.cyan}║${c.reset} ${padVisual(content, INNER - 2)} ${c.cyan}║${c.reset}`;
}
function boxLineCenter(content) {
  return `${c.cyan}║${c.reset}${centerVisual(content, INNER)}${c.cyan}║${c.reset}`;
}
function boxEmpty() {
  return `${c.cyan}║${' '.repeat(INNER)}║${c.reset}`;
}

// ─── Utility ────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function relativePath(absPath) {
  return path.relative(ROOT, absPath);
}

// ─── Configuration ──────────────────────────────────────────────────────────

dotenv.config({ path: path.join(ROOT, '.env') });

// Strip protocol + trailing slash to keep only the host (e.g.
// "https://oneupme.me/" → "oneupme.me"), used as the Strava OAuth deep-link host.
function urlToHost(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

const REPLACEMENTS = {
  __GOOGLE_CLIENT_ID__: process.env.VITE_GOOGLE_CLIENT_ID,
  __APP_URL__: urlToHost(process.env.VITE_APP_URL),
};

const TASKS = [
  {
    name: 'Capacitor Config',
    icon: '⚡',
    template: path.join(ROOT, 'capacitor.config.template.json'),
    output: path.join(ROOT, 'capacitor.config.json'),
    replacements: ['__GOOGLE_CLIENT_ID__'],
  },
  {
    name: 'Android strings.xml',
    icon: '🤖',
    template: path.join(ROOT, 'android', 'strings.template.xml'),
    output: path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
    replacements: ['__GOOGLE_CLIENT_ID__', '__APP_URL__'],
  },
  {
    name: 'Privacy Policy HTML',
    icon: '📄',
    type: 'legal',
    source: path.join(ROOT, 'PRIVACY_POLICY.md'),
    output: path.join(ROOT, 'public', 'privacy.html'),
    title: 'Privacy Policy',
    subtitle: 'Règles de Confidentialité',
    lastUpdated: 'Dernière mise à jour : 13 mars 2026',
    legalType: 'privacy',
  },
  {
    name: 'Terms of Service HTML',
    icon: '📄',
    type: 'legal',
    source: path.join(ROOT, 'TERMS.md'),
    output: path.join(ROOT, 'public', 'terms.html'),
    title: 'Terms of Service',
    subtitle: "Conditions d'Utilisation",
    lastUpdated: 'Last updated: June 24, 2026',
    legalType: 'terms',
  },
];

// ─── Icon Generation ────────────────────────────────────────────────────────

const SOURCE_ICON = path.join(ROOT, 'assets', 'icon.png');

const ICONS = [
  { name: 'PWA 192x192 PNG',   emoji: '🌐', output: 'public/pwa-192x192.png',   size: 192, format: 'png' },
  { name: 'PWA 512x512 PNG',   emoji: '🌐', output: 'public/pwa-512x512.png',   size: 512, format: 'png' },
  { name: 'PWA 192x192 WebP',  emoji: '🌐', output: 'public/pwa-192x192.webp',  size: 192, format: 'webp' },
  { name: 'PWA 512x512 WebP',  emoji: '🌐', output: 'public/pwa-512x512.webp',  size: 512, format: 'webp' },
  { name: 'Logo 64x64 WebP',   emoji: '🌐', output: 'public/logo-64x64.webp',  size: 64,  format: 'webp' },

  { name: 'Android ldpi',      emoji: '📱', output: 'android/app/src/main/res/mipmap-ldpi/ic_launcher.png',         size: 48,  format: 'png' },
  { name: 'Android mdpi',      emoji: '📱', output: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',         size: 48,  format: 'png' },
  { name: 'Android hdpi',      emoji: '📱', output: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png',         size: 72,  format: 'png' },
  { name: 'Android xhdpi',     emoji: '📱', output: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',        size: 96,  format: 'png' },
  { name: 'Android xxhdpi',    emoji: '📱', output: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',       size: 144, format: 'png' },
  { name: 'Android xxxhdpi',   emoji: '📱', output: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',      size: 192, format: 'png' },
];

// Android adaptive icon foregrounds: resize source to FULL viewport size.
// The XML applies android:inset="16.7%" which handles padding automatically.
// No manual padding needed — that would double the inset.
const ANDROID_FOREGROUND = [
  { name: 'Android ldpi fg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-ldpi/ic_launcher_foreground.png',   size: 81  },
  { name: 'Android mdpi fg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png',   size: 108 },
  { name: 'Android hdpi fg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png',   size: 162 },
  { name: 'Android xhdpi fg',  emoji: '🎨', output: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png',  size: 216 },
  { name: 'Android xxhdpi fg', emoji: '🎨', output: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', size: 324 },
  { name: 'Android xxxhdpi fg',emoji: '🎨', output: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png',size: 432 },
];

// Regenerate background PNGs from source (tinted dark) for a clean adaptive icon look
const ANDROID_BACKGROUND = [
  { name: 'Android ldpi bg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-ldpi/ic_launcher_background.png',   size: 81  },
  { name: 'Android mdpi bg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_background.png',   size: 108 },
  { name: 'Android hdpi bg',   emoji: '🎨', output: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_background.png',   size: 162 },
  { name: 'Android xhdpi bg',  emoji: '🎨', output: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_background.png',  size: 216 },
  { name: 'Android xxhdpi bg', emoji: '🎨', output: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_background.png', size: 324 },
  { name: 'Android xxxhdpi bg',emoji: '🎨', output: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.png',size: 432 },
];

const FAVICON = { name: 'Favicon 96x96 rounded', emoji: '🔖', output: 'public/favicon.png', size: 96, radius: 20 };

// Single density-independent splash logo. The splash itself is a vector
// layer-list (drawable/splash.xml = solid background color + this logo centered),
// so one PNG replaces the 26 per-density/orientation splash.png variants.
// The layer-list scales it to a fixed dp size, so a generous source is enough.
const SPLASH = { name: 'Android splash logo', emoji: '🚀', output: 'android/app/src/main/res/drawable-nodpi/splash_logo.png', size: 512, format: 'png' };

const ALL_ICON_DEFS = [...ICONS, ...ANDROID_FOREGROUND, ...ANDROID_BACKGROUND, FAVICON, SPLASH];

// ─── Core logic ─────────────────────────────────────────────────────────────

function validateEnvVars() {
  const missing = [];
  for (const [placeholder, value] of Object.entries(REPLACEMENTS)) {
    if (!value) {
      const envVar = placeholder.replace(/^__/, 'VITE_').replace(/__$/, '');
      missing.push({ placeholder, envVar });
    }
  }
  return missing;
}

function processTemplate(task) {
  const startTime = Date.now();
  const errors = [];

  if (!fs.existsSync(task.template)) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: `Fichier template introuvable : ${relativePath(task.template)}`,
      hint: 'Vérifiez que le fichier template existe dans le dépôt.',
    };
  }

  try {
    const templateContent = fs.readFileSync(task.template, 'utf8');
    let outputContent = templateContent;

    let replacementCount = 0;
    for (const placeholder of task.replacements) {
      const value = REPLACEMENTS[placeholder];
      if (!value) {
        errors.push(`Variable manquante pour ${placeholder}`);
        continue;
      }
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = outputContent.match(regex);
      if (matches) {
        replacementCount += matches.length;
        outputContent = outputContent.replace(regex, value);
      }
    }

    const outputDir = path.dirname(task.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(task.output, outputContent);
    const outputSize = fs.statSync(task.output).size;

    return {
      success: errors.length === 0,
      duration: Date.now() - startTime,
      replacementCount,
      outputSize,
      outputPath: relativePath(task.output),
      templatePath: relativePath(task.template),
      warnings: errors,
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
      hint: 'Vérifiez les permissions et le contenu du template.',
    };
  }
}

// ─── Icon processing ────────────────────────────────────────────────────────

async function generateIconAsync(iconDef) {
  const startTime = Date.now();
  const outputPath = path.join(ROOT, iconDef.output);

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    let pipeline = sharp(SOURCE_ICON).resize(iconDef.size, iconDef.size, { fit: 'cover' });

    if (iconDef.format === 'webp') {
      pipeline = pipeline.webp({ quality: 90 });
    } else {
      pipeline = pipeline.png();
    }

    await pipeline.toFile(outputPath);
    const outputSize = fs.statSync(outputPath).size;

    return {
      success: true,
      duration: Date.now() - startTime,
      outputSize,
      outputPath: relativePath(outputPath),
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function generateForegroundAsync(fgDef) {
  const startTime = Date.now();
  const outputPath = path.join(ROOT, fgDef.output);

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Resize source to fill the full viewport size.
    // The 16.7% inset in the adaptive-icon XML handles the safe-zone clipping.
    await sharp(SOURCE_ICON)
      .resize(fgDef.size, fgDef.size, { fit: 'cover' })
      .png()
      .toFile(outputPath);

    const outputSize = fs.statSync(outputPath).size;

    return {
      success: true,
      duration: Date.now() - startTime,
      outputSize,
      outputPath: relativePath(outputPath),
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function generateBackgroundAsync(bgDef) {
  const startTime = Date.now();
  const outputPath = path.join(ROOT, bgDef.output);

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Dark tinted background that matches the icon's dominant colors
    await sharp(SOURCE_ICON)
      .resize(bgDef.size, bgDef.size, { fit: 'cover' })
      .blur(30)
      .modulate({ brightness: 0.3, saturation: 0.5 })
      .png()
      .toFile(outputPath);

    const outputSize = fs.statSync(outputPath).size;

    return {
      success: true,
      duration: Date.now() - startTime,
      outputSize,
      outputPath: relativePath(outputPath),
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function generateFaviconAsync(favDef) {
  const startTime = Date.now();
  const outputPath = path.join(ROOT, favDef.output);
  const size = favDef.size;
  const radius = favDef.radius;

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Create a rounded rectangle mask
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>`
    );

    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover' })
      .png()
      .composite([{ input: mask, blend: 'dest-in' }])
      .toFile(outputPath);

    const outputSize = fs.statSync(outputPath).size;

    return {
      success: true,
      duration: Date.now() - startTime,
      outputSize,
      outputPath: relativePath(outputPath),
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

// ─── Output ─────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(boxTop());
  console.log(boxEmpty());
  console.log(boxLineCenter(`${c.bold}${c.white}ONEUP ${c.cyan}:: ${c.white}GENERATION DE CONFIG${c.reset}`));
  console.log(boxLineCenter(`${c.dim}${c.gray}Injection des variables d'environnement${c.reset}`));
  console.log(boxEmpty());
  console.log(boxBottom());
}

function printEnvStatus() {
  console.log('');
  console.log(`  ${c.cyan}${c.bold}▸ Variables d'environnement${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(BOX_WIDTH - 4)}${c.reset}`);
  for (const [placeholder, value] of Object.entries(REPLACEMENTS)) {
    const envVar = placeholder.replace(/^__/, 'VITE_').replace(/__$/, '');
    if (value) {
      const masked = value.slice(0, 4) + '•'.repeat(Math.min(16, value.length - 8));
      console.log(`  ${c.green}✓${c.reset}  ${c.white}${envVar}${c.reset}  ${c.gray}${masked}${c.reset}`);
    } else {
      console.log(`  ${c.red}✗${c.reset}  ${c.white}${envVar}${c.reset}  ${c.red}non définie${c.reset}`);
    }
  }
}

function printTaskResult(index, total, task, result) {
  const step = `[${index}/${total}]`;
  const status = result.success ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;

  console.log('');
  console.log(`  ${c.cyan}${c.bold}${step}${c.reset} ${task.icon || ''}  ${c.white}${c.bold}${task.name}${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(BOX_WIDTH - 4)}${c.reset}`);

  if (result.error) {
    console.log(`  ${c.red}✗  Erreur : ${result.error}${c.reset}`);
    if (result.hint) {
      console.log(`  ${c.yellow}💡 ${result.hint}${c.reset}`);
    }
    return;
  }

  if (result.templatePath) {
    console.log(`  ${c.gray}   Template  →${c.reset}  ${c.dim}${result.templatePath}${c.reset}`);
  }
  console.log(`  ${c.gray}   Sortie    →${c.reset}  ${c.white}${result.outputPath}${c.reset}`);

  const sizeStr = formatBytes(result.outputSize);
  const replStr = result.replacementCount !== undefined
    ? `${result.replacementCount} substitution${result.replacementCount > 1 ? 's' : ''}`
    : `${result.outputSize > 0 ? 'généré' : ''}`;
  const timeStr = formatTime(result.duration);
  console.log(`  ${status}  ${c.green}${sizeStr}${c.reset}  ${c.gray}│${c.reset}  ${c.magenta}${replStr}${c.reset}  ${c.gray}│${c.reset}  ${c.blue}${timeStr}${c.reset}`);

  if (result.warnings && result.warnings.length > 0) {
    for (const warn of result.warnings) {
      console.log(`  ${c.yellow}⚠  ${warn}${c.reset}`);
    }
  }
}

function printSummary(results, totalDuration) {
  const successCount = results.filter(r => r.result.success).length;
  const failCount = results.length - successCount;
  const allSuccess = failCount === 0;

  console.log('');
  console.log(boxTop());
  console.log(boxLineCenter(`${c.bold}${c.white}RÉSUMÉ${c.reset}`));
  console.log(boxDivider());

  for (let i = 0; i < results.length; i++) {
    const { task, result } = results[i];
    const icon = result.success ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const statusText = result.success
      ? `${c.green}OK${c.reset}`
      : `${c.red}ÉCHEC${c.reset}`;
    const timeStr = `${c.gray}${formatTime(result.duration)}${c.reset}`;
    const label = `${icon}  ${task.icon || ''} ${task.name}`;
    const right = `${statusText}  ${timeStr}`;

    const spacerWidth = INNER - 2 - visualWidth(label) - visualWidth(right);
    const spacer = ' '.repeat(Math.max(1, spacerWidth));
    const lineContent = `${label}${spacer}${right}`;
    console.log(boxLine(lineContent));
  }

  console.log(boxDivider());

  if (allSuccess) {
    const msg = `${c.bold}${c.green}✅ ${results.length} fichier${results.length > 1 ? 's' : ''} généré${results.length > 1 ? 's' : ''} avec succès${c.reset}`;
    console.log(boxLineCenter(msg));
  } else {
    const msg = `${c.bold}${c.red}❌ ${failCount} échec${failCount > 1 ? 's' : ''} sur ${results.length} tâche${results.length > 1 ? 's' : ''}${c.reset}`;
    console.log(boxLineCenter(msg));
  }

  const durationMsg = `${c.dim}${c.gray}Durée totale : ${formatTime(totalDuration)}${c.reset}`;
  console.log(boxLineCenter(durationMsg));

  console.log(boxBottom());
  console.log('');

  return allSuccess;
}

// Helper to escape HTML characters
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Slugify headings for scroll anchors
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Parse inline markdown formatting (**bold** and [link](url))
function parseInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// Strip title and last-updated headers from the markdown contents to avoid duplicates
function stripMetadata(md) {
  const lines = md.split('\n');
  const result = [];
  let strippedTitle = false;
  let strippedDate = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!strippedTitle && trimmed.startsWith('# ')) {
      strippedTitle = true;
      continue;
    }
    if (!strippedDate && (trimmed.toLowerCase().includes('last updated') || trimmed.toLowerCase().includes('mise à jour'))) {
      strippedDate = true;
      continue;
    }
    // Skip empty lines or dividers at the very beginning of content
    if (result.length === 0 && (trimmed === '' || trimmed === '---')) {
      continue;
    }
    result.push(line);
  }
  return result.join('\n').trim();
}

// Custom Markdown to HTML parser
function mdToHtml(md) {
  const lines = md.split('\n');
  const result = [];
  let inList = false;
  let inSection = false;

  for (let line of lines) {
    line = line.trim();
    
    if (!line) {
      if (inList) {
        result.push('        </ul>');
        inList = false;
      }
      continue;
    }

    // Horizontal Rule
    if (line === '---') {
      if (inList) { result.push('        </ul>'); inList = false; }
      if (inSection) { result.push('      </section>'); inSection = false; }
      result.push('      <hr style="border: 0; border-top: 1px solid var(--border-default); margin: 8px 0;" />');
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (inList) { result.push('        </ul>'); inList = false; }
      if (inSection) { result.push('      </section>'); inSection = false; }
      const content = line.slice(2);
      result.push(`      <h1 id="${slugify(content)}">${parseInline(content)}</h1>`);
      continue;
    }
    
    if (line.startsWith('## ')) {
      if (inList) { result.push('        </ul>'); inList = false; }
      if (inSection) { result.push('      </section>'); inSection = false; }
      const content = line.slice(3);
      result.push(`      <section>\n        <h2 id="${slugify(content)}">${parseInline(content)}</h2>`);
      inSection = true;
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { result.push('        </ul>'); inList = false; }
      const content = line.slice(4);
      result.push(`        <h3>${parseInline(content)}</h3>`);
      continue;
    }

    // Preformatted blocks (like license placeholder)
    if (line.startsWith('[LICENSE_TEXT]')) {
      if (inList) { result.push('        </ul>'); inList = false; }
      result.push('        [LICENSE_TEXT]');
      continue;
    }

    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('        <ul>');
        inList = true;
      }
      const content = line.slice(2);
      result.push(`          <li>${parseInline(content)}</li>`);
      continue;
    }

    // Paragraphs
    if (inList) {
      result.push('        </ul>');
      inList = false;
    }
    result.push(`        <p>${parseInline(line)}</p>`);
  }

  if (inList) {
    result.push('        </ul>');
  }
  if (inSection) {
    result.push('      </section>');
  }

  return result.join('\n');
}

// Main template wrapper
function getHtmlTemplate(title, subtitle, lastUpdated, mainContent) {
  return `<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>OneUp | ${title}</title>
  <meta name="description" content="${subtitle} pour l'application OneUp." />
  <meta name="robots" content="index,follow" />
  <link rel="icon" type="image/png" href="./favicon.png" />
  
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-color: rgb(5, 5, 5);
      --card-bg: rgba(10, 10, 15, 0.6);
      --text-primary: rgb(255, 255, 255);
      --text-secondary: rgb(176, 176, 186);
      --accent: rgb(109, 40, 217);
      --accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --border-default: rgba(255, 255, 255, 0.08);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(109, 40, 217, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(245, 87, 108, 0.08) 0%, transparent 45%);
      color: var(--text-primary);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 800px;
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-default);
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    }

    header {
      margin-bottom: 40px;
      text-align: center;
      border-bottom: 1px solid var(--border-default);
      padding-bottom: 24px;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .last-updated {
      font-size: 0.85rem;
      color: var(--text-secondary);
      opacity: 0.7;
      margin-top: 8px;
    }

    main {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
      border-left: 3px solid #f5576c;
      padding-left: 12px;
      margin-bottom: 4px;
    }

    h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 8px;
    }

    p {
      color: var(--text-secondary);
      font-size: 1rem;
      font-weight: 400;
    }

    ul {
      color: var(--text-secondary);
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    pre {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-default);
      border-radius: 12px;
      padding: 20px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    a {
      color: #f093fb;
      text-decoration: none;
      border-bottom: 1px dashed rgba(240, 147, 251, 0.4);
      transition: all 0.2s ease;
    }

    a:hover {
      color: #f5576c;
      border-bottom-color: #f5576c;
    }

    .footer-note {
      text-align: center;
      margin-top: 48px;
      font-size: 0.9rem;
      color: var(--text-secondary);
      opacity: 0.7;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .back-btn:hover {
      background: var(--accent-gradient);
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 87, 108, 0.3);
    }

    @media (max-width: 768px) {
      body {
        padding: 20px 12px;
      }

      .container {
        padding: 24px;
        border-radius: 16px;
      }

      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.25rem;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <p class="last-updated">${lastUpdated}</p>
    </header>

    <main>
${mainContent}
    </main>

    <div class="footer-note">
      <a href="./" class="back-btn" id="btn-back">
        Retour à l'accueil
      </a>
      <p>© ${new Date().getFullYear()} OneUp. Tous droits réservés.</p>
    </div>
  </div>
</body>

</html>
`;
}

function processLegalTask(task) {
  const startTime = Date.now();

  if (!fs.existsSync(task.source)) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: `Fichier source introuvable : ${relativePath(task.source)}`,
    };
  }

  try {
    const rawContent = fs.readFileSync(task.source, 'utf8');
    const cleanContent = stripMetadata(rawContent);
    let mainContentHtml = mdToHtml(cleanContent);

    if (task.legalType === 'terms') {
      const licensePath = path.join(ROOT, 'LICENSE');
      if (!fs.existsSync(licensePath)) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: `Fichier LICENSE introuvable`,
        };
      }
      const licenseText = fs.readFileSync(licensePath, 'utf8');
      const escapedLicense = `<pre>${escapeHtml(licenseText)}</pre>`;
      mainContentHtml = mainContentHtml.replace('[LICENSE_TEXT]', escapedLicense);
    }

    const html = getHtmlTemplate(task.title, task.subtitle, task.lastUpdated, mainContentHtml);

    const outputDir = path.dirname(task.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(task.output, html, 'utf8');
    const outputSize = fs.statSync(task.output).size;

    return {
      success: true,
      duration: Date.now() - startTime,
      outputSize,
      outputPath: relativePath(task.output),
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const globalStart = Date.now();

  printBanner();

  // Validate env vars
  const missingVars = validateEnvVars();
  if (missingVars.length > 0) {
    console.log('');
    console.log(boxTop());
    console.log(boxLineCenter(`${c.bold}${c.red}ERREUR DE CONFIGURATION${c.reset}`));
    console.log(boxDivider());
    for (const { envVar } of missingVars) {
      console.log(boxLine(`${c.red}✗${c.reset}  ${c.white}${envVar}${c.reset} ${c.red}non trouvée dans .env${c.reset}`));
    }
    console.log(boxDivider());
    console.log(boxLine(`${c.yellow}💡 Ajoutez les variables manquantes dans votre fichier .env${c.reset}`));
    console.log(boxLine(`${c.gray}   Chemin : ${path.join(ROOT, '.env')}${c.reset}`));
    console.log(boxBottom());
    console.log('');
    process.exit(1);
  }

  printEnvStatus();

  // Process templates
  const results = [];
  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    const result = task.type === 'legal' ? processLegalTask(task) : processTemplate(task);
    printTaskResult(i + 1, TASKS.length, task, result);
    results.push({ task, result });
  }

  // Process icons
  if (fs.existsSync(SOURCE_ICON)) {
    const iconResults = [];
    console.log('');
    console.log(`  ${c.cyan}${c.bold}▸ Génération des icônes${c.reset}`);
    console.log(`  ${c.gray}  Source : ${relativePath(SOURCE_ICON)} (${formatBytes(fs.statSync(SOURCE_ICON).size)})${c.reset}`);
    console.log(`  ${c.gray}${'─'.repeat(BOX_WIDTH - 4)}${c.reset}`);

    const allDefs = [
      ...ICONS.map(d => ({ ...d, gen: generateIconAsync })),
      ...ANDROID_FOREGROUND.map(d => ({ ...d, gen: generateForegroundAsync })),
      ...ANDROID_BACKGROUND.map(d => ({ ...d, gen: generateBackgroundAsync })),
      { ...FAVICON, gen: generateFaviconAsync },
      { ...SPLASH, gen: generateIconAsync },
    ];

    for (const def of allDefs) {
      const result = await def.gen(def);
      iconResults.push(result);
      // Stay quiet on success; only surface failures so they don't get lost.
      if (!result.success) {
        console.log(`  ${c.red}✗  ${def.name} : ${result.error || 'échec'}${c.reset}`);
      }
    }

    const iconSuccessCount = iconResults.filter(r => r.success).length;
    const iconFailCount = iconResults.length - iconSuccessCount;
    const allIconsOk = iconFailCount === 0;

    console.log('');
    console.log(`  ${allIconsOk ? c.green : c.red}${allIconsOk ? '✅' : '❌'} ${iconSuccessCount}/${iconResults.length} icônes générées${allIconsOk ? '' : ` (${iconFailCount} échec${iconFailCount > 1 ? 's' : ''})`}${c.reset}`);
  } else {
    console.log('');
    console.log(`  ${c.yellow}⚠  Icône source introuvable : ${relativePath(SOURCE_ICON)}${c.reset}`);
    console.log(`  ${c.yellow}   Ajoutez un fichier assets/icon.png pour la génération automatique.${c.reset}`);
  }

  // Summary
  const totalDuration = Date.now() - globalStart;
  const allSuccess = printSummary(results, totalDuration);

  if (!allSuccess) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n  ${c.bgRed}${c.white} CRITICAL ERROR ${c.reset} ${c.red}${error.message}${c.reset}\n`);
  process.exit(1);
});
