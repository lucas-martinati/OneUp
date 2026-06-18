const { spawn } = require('child_process');

// ANSI Color Escape Sequences
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const tasks = [
  {
    name: 'ESLint',
    cmd: 'npx',
    args: ['eslint', '.'],
    icon: '🔍'
  },
  {
    name: 'Knip (Code mort/Fichiers inutilisés)',
    cmd: 'npx',
    args: ['knip', '--no-config-hints'],
    icon: '✂️'
  },
  {
    name: 'check-i18n-keys',
    cmd: 'node',
    args: ['scripts/check-i18n-keys.cjs'],
    icon: '🌐'
  },
  {
    name: 'check-i18n-consistency',
    cmd: 'node',
    args: ['scripts/check-i18n-consistency.cjs'],
    icon: '⚖️'
  },
  {
    name: 'check-unused-css',
    cmd: 'node',
    args: ['scripts/check-unused-css.cjs'],
    icon: '🎨'
  },
  {
    name: 'Stylelint (lint:css)',
    cmd: 'npm',
    args: ['run', 'lint:css'],
    icon: '💅'
  },
  {
    name: 'Dépendances circulaires (lint:circular)',
    cmd: 'npm',
    args: ['run', 'lint:circular'],
    icon: '🔄'
  },
  {
    name: 'Duplication de code (lint:dup)',
    cmd: 'npm',
    args: ['run', 'lint:dup'],
    icon: '👥'
  }
];

function formatTime(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

// Largeur totale de la boîte et largeur intérieure (entre les bordures ║…║).
const BOX_WIDTH = 74;
const INNER = BOX_WIDTH - 2;

// Largeur d'affichage réelle d'une chaîne dans le terminal (en colonnes).
// Indispensable car .length ne correspond PAS toujours au nombre de colonnes :
//  - les vrais emojis (plan astral, ex. 🔍) occupent 2 colonnes pour .length === 2 ;
//  - un symbole texte suivi d'un sélecteur de variante (ex. ✂️ = U+2702 U+FE0F)
//    a .length === 2 mais ne s'affiche que sur 1 colonne ;
//  - les codes couleur ANSI n'occupent aucune colonne.
function visualWidth(str) {
  const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
  let w = 0;
  for (const ch of clean) {
    const cp = ch.codePointAt(0);
    // Sélecteurs de variante (FE00–FE0F) & diacritiques combinants : largeur nulle.
    if ((cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0x0300 && cp <= 0x036F)) continue;
    // Emojis du plan astral + emojis « présentation » courants du BMP + idéogrammes
    // CJK : 2 colonnes.
    if (
      cp >= 0x1F000 ||
      [0x2705, 0x274C, 0x2728, 0x2753, 0x2757, 0x2B50, 0x2B55].includes(cp) ||
      (cp >= 0x1100 && cp <= 0x115F) ||
      (cp >= 0x2E80 && cp <= 0xA4CF) ||
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

// Complète `str` (couleurs/emojis inclus) jusqu'à `target` colonnes visibles.
function padVisual(str, target) {
  return str + ' '.repeat(Math.max(0, target - visualWidth(str)));
}

function printHeader(index, total, name, icon) {
  const title = `[${index}/${total}] ${icon}  Exécution : ${name} `;
  console.log(`\n${colors.cyan}╔${'═'.repeat(INNER)}╗`);
  console.log(`║ ${colors.bold}${colors.white}${padVisual(title, INNER - 2)}${colors.cyan} ║`);
  console.log(`╚${'═'.repeat(INNER)}╝${colors.reset}\n`);
}

function runTask(task, index, total) {
  return new Promise((resolve) => {
    printHeader(index, total, task.name, task.icon);
    
    const startTime = Date.now();
    
    // shell: true is needed for cross-platform and executing scripts through npm/npx
    const child = spawn(task.cmd, task.args, { stdio: 'inherit', shell: true });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      const statusLine = success
        ? `${colors.green}✔ ${task.name} réussi en ${formatTime(duration)}${colors.reset}`
        : `${colors.red}✘ ${task.name} a échoué en ${formatTime(duration)} (code de sortie : ${code})${colors.reset}`;
      
      console.log(`\n${statusLine}`);
      
      resolve({
        name: task.name,
        icon: task.icon,
        success,
        duration,
        code
      });
    });
  });
}

function printSummary(results) {
  const divider = `╠${'═'.repeat(INNER)}╣`;

  console.log(`\n${colors.cyan}╔${'═'.repeat(INNER)}╗`);

  // Titre centré (sans emoji : .length === largeur visible).
  const titleText = 'RAPPORT GLOBAL DE VALIDATION';
  const leftPad = Math.floor((INNER - titleText.length) / 2);
  const titleLine = ' '.repeat(leftPad) + titleText + ' '.repeat(INNER - titleText.length - leftPad);
  console.log(`║${colors.bold}${colors.white}${titleLine}${colors.cyan}║`);
  console.log(divider);

  let allSuccess = true;
  results.forEach((res, index) => {
    const statusText = res.success ? '✓ SUCCÈS' : `✗ ÉCHEC (code ${res.code})`;
    const statusColor = res.success ? colors.green : colors.red;
    const time = formatTime(res.duration);

    const label = `${index + 1}. ${res.icon} ${res.name}`;
    const right = `${statusText} (${time}) `;

    // Intérieur = 2 espaces de marge + label + spacer + partie droite = INNER colonnes.
    // On mesure en largeur visuelle pour gérer correctement emojis et sélecteurs de variante.
    const spacerWidth = INNER - 2 - visualWidth(label) - visualWidth(right);
    const spacer = ' '.repeat(Math.max(1, spacerWidth));

    const coloredRight = `${statusColor}${statusText}${colors.reset} (${time}) `;
    console.log(`║  ${colors.white}${label}${colors.reset}${spacer}${coloredRight}${colors.cyan}║`);

    if (!res.success) {
      allSuccess = false;
    }
  });

  console.log(divider);

  const finalStatusText = allSuccess
    ? '✅ TOUS LES TESTS SONT AU VERT !'
    : '❌ CERTAINS TESTS ONT ÉCHOUÉ. VEUILLEZ CORRIGER LES ERREURS CI-DESSUS.';
  const finalStatusColor = allSuccess ? colors.green : colors.red;
  const finalStatus = `${colors.bold}${finalStatusColor}${finalStatusText}${colors.reset}`;

  // Intérieur = 2 espaces + texte + spacer + 1 espace = INNER colonnes.
  const bottomSpacer = ' '.repeat(Math.max(1, INNER - 3 - visualWidth(finalStatusText)));
  console.log(`║  ${finalStatus}${bottomSpacer} ${colors.cyan}║`);
  console.log(`╚${'═'.repeat(INNER)}╝${colors.reset}\n`);

  return allSuccess;
}

async function start() {
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < tasks.length; i++) {
    const result = await runTask(tasks[i], i + 1, tasks.length);
    results.push(result);
  }
  
  const allSuccess = printSummary(results);
  const totalDuration = Date.now() - startTime;
  
  console.log(`${colors.gray}Durée totale de validation : ${formatTime(totalDuration)}${colors.reset}\n`);
  
  process.exit(allSuccess ? 0 : 1);
}

start().catch((err) => {
  console.error(`${colors.red}Erreur fatale dans le script de validation :`, err, colors.reset);
  process.exit(1);
});
