import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
};

// ─── Box drawing (même style que generate-config.js / run-all-lints.cjs) ─────
const BOX_WIDTH = 64;
const INNER = BOX_WIDTH - 2;

function visualWidth(str) {
  // eslint-disable-next-line no-control-regex
  const clean = str.replace(/\x1b\[[0-9;]*m/g, '');
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

function boxTop()     { return `${c.cyan}╔${'═'.repeat(INNER)}╗${c.reset}`; }
function boxBottom()  { return `${c.cyan}╚${'═'.repeat(INNER)}╝${c.reset}`; }
function boxLine(content) {
  return `${c.cyan}║${c.reset} ${padVisual(content, INNER - 2)} ${c.cyan}║${c.reset}`;
}

// ─── .env parser ─────────────────────────────────────────────────────────────
function parseEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`${c.red}❌ Fichier .env introuvable à la racine du projet.${c.reset}`);
    process.exit(1);
  }

  const envVars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val   = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }

  return envVars;
}

// ─── set-secrets ─────────────────────────────────────────────────────────────
// Délègue entièrement au script bash standalone pour contourner les conflits
// de handles I/O quand Firebase CLI est lancé depuis le processus Node de NPM.
// Le script bash lit le .env lui-même et appelle firebase CLI directement.
function handleSetSecrets() {
  const scriptPath = path.join(__dirname, 'set-secrets.sh');

  if (!fs.existsSync(scriptPath)) {
    console.error(`${c.red}❌ Script introuvable : scripts/set-secrets.sh${c.reset}`);
    process.exit(1);
  }

  try {
    // execFileSync avec stdio:'inherit' → bash tourne dans son propre contexte,
    // complètement détaché de l'event loop Node. Aucun conflit de handles.
    execFileSync('bash', [scriptPath], {
      stdio: 'inherit',
      cwd: ROOT,
      env: {
        ...process.env,
        // Force l'utilisation du résolveur DNS system plutôt que celui de Node
        NODE_OPTIONS: '',
      },
    });
  } catch {
    // Le script bash gère ses propres messages d'erreur.
    // On propage juste le code de sortie.
    process.exitCode = 1;
  }
}

// ─── audit / prune ───────────────────────────────────────────────────────────
async function handleDatabaseTrigger(action) {
  const env = parseEnv();
  const { VITE_FIREBASE_PROJECT_ID: projectId, ADMIN_API_KEY: adminApiKey, VITE_FIREBASE_FUNCTIONS_URL } = env;

  if (!projectId) {
    console.error(`${c.red}❌ VITE_FIREBASE_PROJECT_ID manquant dans .env.${c.reset}`);
    process.exit(1);
  }
  if (!adminApiKey) {
    console.error(`${c.red}❌ ADMIN_API_KEY manquant dans .env.${c.reset}`);
    process.exit(1);
  }

  const base     = VITE_FIREBASE_FUNCTIONS_URL ?? `https://us-central1-${projectId}.cloudfunctions.net`;
  const endpoint = action === 'audit' ? 'auditStaleData' : 'pruneStaleData';
  const url      = `${base}/${endpoint}`;
  const icon     = action === 'audit' ? '🔍' : '🗑️';
  const label    = action === 'audit' ? 'AUDIT DE LA BASE DE DONNÉES' : 'NETTOYAGE DE LA BASE DE DONNÉES';

  // ─── Header ────────────────────────────────────────────────────────────────
  console.log('');
  console.log(boxTop());
  console.log(boxLine(`${c.bold}${c.white}${icon}  ${label}${c.reset}`));
  console.log(boxLine(`${c.gray}Projet : ${c.white}${projectId}${c.reset}`));
  console.log(boxBottom());
  console.log('');

  console.log(`  ${c.blue}▸${c.reset}  POST ${c.cyan}${url}${c.reset}`);

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  try {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${adminApiKey}`, 'Content-Type': 'application/json' },
      signal:  controller.signal,
    });
    const body = await res.text();

    console.log('');
    if (res.ok) {
      console.log(`  ${c.green}✓${c.reset}  ${body}`);
    } else {
      console.error(`  ${c.red}✗${c.reset}  HTTP ${res.status} : ${body}`);
      process.exit(1);
    }
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timeout (30 s)' : err.message;
    console.error(`\n  ${c.red}✗${c.reset}  ${msg}`);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────
const COMMANDS = {
  'set-secrets': () => handleSetSecrets(),
  'audit':       () => handleDatabaseTrigger('audit'),
  'prune':       () => handleDatabaseTrigger('prune'),
};

const command = process.argv[2];
const handler = COMMANDS[command];

if (!handler) {
  console.log(`\nUsage: node scripts/firebase-helper.js [${Object.keys(COMMANDS).join('|')}]\n`);
  process.exit(1);
}

// handleSetSecrets est synchrone, les autres retournent des promises.
const result = handler();
if (result && typeof result.catch === 'function') {
  result.catch(err => {
    console.error(`${c.red}${err.message}${c.reset}`);
    process.exit(1);
  });
}