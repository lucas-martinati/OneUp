import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
    // Variation selectors & combining diacritics: zero width
    if ((cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0x0300 && cp <= 0x036F)) continue;
    // Zero-width joiners (used in emoji sequences)
    if (cp === 0x200D) continue;
    if (
      // Supplementary planes (all emojis >= U+1F000)
      cp >= 0x1F000 ||
      // Misc Symbols (⚡⚙☀♻ etc.)
      (cp >= 0x2600 && cp <= 0x26FF) ||
      // Dingbats (✅❌✨ etc.) — exclude text-style marks ✓✗ (U+2713-U+2717)
      (cp >= 0x2702 && cp <= 0x2712) ||
      (cp >= 0x2718 && cp <= 0x27BF) ||
      // Common wide emoji in BMP
      [0x2705, 0x274C, 0x2728, 0x2753, 0x2757, 0x2B50, 0x2B55,
       0x2714, 0x2716, 0x2744, 0x2764, 0x2934, 0x2935, 0x3030, 0x303D].includes(cp) ||
      // Hourglass, watch, etc.
      (cp >= 0x231A && cp <= 0x231B) ||
      (cp >= 0x23E9 && cp <= 0x23F3) ||
      (cp >= 0x23F8 && cp <= 0x23FA) ||
      // CJK & Hangul
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

// Load environment variables
dotenv.config({ path: path.join(ROOT, '.env') });

const REPLACEMENTS = {
  __GOOGLE_CLIENT_ID__: process.env.VITE_GOOGLE_CLIENT_ID,
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
    replacements: ['__GOOGLE_CLIENT_ID__'],
  },
];

// ─── Core logic ─────────────────────────────────────────────────────────────

function validateEnvVars() {
  const missing = [];
  for (const [placeholder, value] of Object.entries(REPLACEMENTS)) {
    if (!value) {
      // Map placeholder to env var name
      const envVar = placeholder.replace(/^__/, 'VITE_').replace(/__$/, '');
      missing.push({ placeholder, envVar });
    }
  }
  return missing;
}

function processTemplate(task) {
  const startTime = Date.now();
  const errors = [];

  // Check template exists
  if (!fs.existsSync(task.template)) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: `Fichier template introuvable : ${relativePath(task.template)}`,
      hint: 'Vérifiez que le fichier template existe dans le dépôt.',
    };
  }

  try {
    // Read template
    const templateContent = fs.readFileSync(task.template, 'utf8');
    let outputContent = templateContent;

    // Apply replacements
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

    // Ensure output directory exists
    const outputDir = path.dirname(task.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output
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
  console.log(`  ${c.cyan}${c.bold}${step}${c.reset} ${task.icon}  ${c.white}${c.bold}${task.name}${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(BOX_WIDTH - 4)}${c.reset}`);

  if (result.error) {
    console.log(`  ${c.red}✗  Erreur : ${result.error}${c.reset}`);
    if (result.hint) {
      console.log(`  ${c.yellow}💡 ${result.hint}${c.reset}`);
    }
    return;
  }

  // Template → Output
  console.log(`  ${c.gray}   Template  →${c.reset}  ${c.dim}${result.templatePath}${c.reset}`);
  console.log(`  ${c.gray}   Sortie    →${c.reset}  ${c.white}${result.outputPath}${c.reset}`);

  // Stats
  const sizeStr = formatBytes(result.outputSize);
  const replStr = `${result.replacementCount} substitution${result.replacementCount > 1 ? 's' : ''}`;
  const timeStr = formatTime(result.duration);
  console.log(`  ${status}  ${c.green}${sizeStr}${c.reset}  ${c.gray}│${c.reset}  ${c.magenta}${replStr}${c.reset}  ${c.gray}│${c.reset}  ${c.blue}${timeStr}${c.reset}`);

  // Warnings
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
    const label = `${icon}  ${task.icon} ${task.name}`;
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

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
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
    const result = processTemplate(task);
    printTaskResult(i + 1, TASKS.length, task, result);
    results.push({ task, result });
  }

  // Summary
  const totalDuration = Date.now() - globalStart;
  const allSuccess = printSummary(results, totalDuration);

  if (!allSuccess) {
    process.exit(1);
  }
}

main();
