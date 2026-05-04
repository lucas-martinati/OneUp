const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const SRC_DIR     = path.join(__dirname, '../src');
const CODE_EXTS   = new Set(['.tsx', '.ts', '.jsx', '.js']);
const SKIP_DIRS   = new Set(['node_modules', '__tests__', 'i18n']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parcourt récursivement un répertoire et appelle callback sur chaque fichier
 * correspondant aux extensions autorisées.
 */
function walkDir(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkDir(fullPath, callback);
    } else if (CODE_EXTS.has(path.extname(entry.name))) {
      callback(fullPath);
    }
  }
}

/**
 * Extrait toutes les clés feuilles d'un objet JSON imbriqué.
 * Ex: { a: { b: 1 } } → ['a.b']
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Vérifie qu'une clé extraite du code ressemble à une vraie clé i18n.
 */
function isLikelyI18nKey(key) {
  if (!key || key.length < 3)                                           return false;
  if (!key.includes('.'))                                               return false;
  if (key.startsWith('.') || key.endsWith('.'))                        return false;
  if (key.startsWith('/') || key.startsWith('./') ||
      key.startsWith('../'))                                            return false;
  if (key.includes(' ') || key.includes(','))                          return false;
  if (key.includes('@'))                                                return false;

  // Chemins de fichiers
  if (/\/(components|hooks|services|utils|pages|contexts)/.test(key))  return false;

  // Extensions de fichiers
  if (/\.(png|jpg|svg|gif|webp|ico|json|cjs|ts|tsx|js|jsx)$/.test(key)) return false;

  // Valeurs CSS : commence par un chiffre ou signe négatif + chiffre
  if (/^-?\d/.test(key))                                               return false;

  // Unités CSS dans la valeur
  if (/\d+(rem|em|px|s|ms|%)/.test(key))                              return false;

  // Fonctions CSS
  if (/^(scale|translate|rotate|skew|matrix)\(/.test(key))            return false;

  // Caractères non autorisés (seuls a-z, A-Z, 0-9, point, underscore acceptés)
  if (/[^a-zA-Z0-9._]/.test(key))                                     return false;

  // Chaque segment doit commencer par une lettre et ne pas être vide
  if (key.split('.').some(seg => seg.length === 0 || /^\d/.test(seg))) return false;

  return true;
}

/**
 * Extrait les clés i18n utilisées dans le contenu d'un fichier source.
 *
 * Cas 1 — Clé statique dans t()       : t('some.key')
 * Cas 2 — Clé dynamique dans t()      : t(`some.${var}.end`) → préfixe 'some'
 * Cas 3 — String literal hors t()     : 'some.key' dans un objet/variable
 * Cas 4 — Template literal hors t()   : `some.${var}` → préfixe 'some'
 * Cas 5 — Concaténation hors t()      : 'exercises.' + ex.id → préfixe 'exercises'
 */
function extractI18nUsage(content) {
  const staticKeys = new Set();
  const prefixes   = new Set();
  let match;

  // ── Cas 1 & 2 : appels t('...') ──────────────────────────────────────────
  const tCallRegex = /\bt\((?:'([^']+)'|"([^"]+)"|`([^`]+)`)/g;
  while ((match = tCallRegex.exec(content)) !== null) {
    const raw = match[1] ?? match[2] ?? match[3];
    if (!raw) continue;

    const isTemplate = match[3] !== undefined;

    if (isTemplate && raw.includes('${')) {
      // Cas 2 : préfixe stable avant la première interpolation
      const stablePart = raw.split('${')[0].replace(/\.$/, '').trim();
      if (stablePart.length > 0 && isLikelyI18nKey(stablePart + '.x')) {
        prefixes.add(stablePart);
      }
    } else {
      // Cas 1 : clé statique (supprimer namespace éventuel ex: 'ns:key')
      const key = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
      if (isLikelyI18nKey(key)) staticKeys.add(key);
    }
  }

  // ── Cas 3 : string literals hors t() ─────────────────────────────────────
  const literalRegex = /(?:'([^'\n]+)'|"([^"\n]+)")/g;
  while ((match = literalRegex.exec(content)) !== null) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    const key = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
    if (isLikelyI18nKey(key)) staticKeys.add(key);
  }

  // ── Cas 4 : template literals sans appel t() ─────────────────────────────
  const templateRegex = /`([^`]*)\$\{[^}]+\}[^`]*`/g;
  while ((match = templateRegex.exec(content)) !== null) {
    const stablePart = match[1].replace(/\.$/, '').trim();
    if (stablePart.length > 0 && isLikelyI18nKey(stablePart + '.x')) {
      prefixes.add(stablePart);
    }
  }

  // ── Cas 5 : concaténation  'prefix.' + variable ───────────────────────────
  const concatRegex = /['"`]([a-zA-Z][a-zA-Z0-9._]*)\.['"`]\s*\+/g;
  while ((match = concatRegex.exec(content)) !== null) {
    const prefix = match[1];
    if (isLikelyI18nKey(prefix + '.x')) {
      prefixes.add(prefix);
    }
  }

  return { staticKeys, prefixes };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// 1. Charger toutes les clés définies dans en.json
const enJson     = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'));
const allKeys    = flattenKeys(enJson);
const allKeysSet = new Set(allKeys);

console.log(`Total keys in en.json: ${allKeys.length}\n`);

// 2. Scanner le code source
const usedStaticKeys = new Set();
const usedPrefixes   = new Set();

walkDir(SRC_DIR, (filepath) => {
  const content = fs.readFileSync(filepath, 'utf-8');
  const { staticKeys, prefixes } = extractI18nUsage(content);
  staticKeys.forEach(k => usedStaticKeys.add(k));
  prefixes.forEach(p   => usedPrefixes.add(p));
});

console.log(`Static keys found in code : ${usedStaticKeys.size}`);
console.log(`Dynamic prefixes found    : ${usedPrefixes.size}\n`);

// ─── 2.5 Manual Whitelists ────────────────────────────────────────────────────
usedPrefixes.add('sessionNames');
usedPrefixes.add('shareTexts');

// ─── 3. Special Case: Badge Definitions ──────────────────────────────────────
const badgeDefPath = path.join(SRC_DIR, 'config/badgeDefinitions.js');
if (fs.existsSync(badgeDefPath)) {
  const content = fs.readFileSync(badgeDefPath, 'utf-8');
  // Simple regex to extract IDs: { id: 'some_id', ... }
  const idRegex = /id:\s*['"]([^'"]+)['"]/g;
  let match;
  let badgeCount = 0;
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    usedStaticKeys.add(`achievements.badges.${id}.title`);
    usedStaticKeys.add(`achievements.badges.${id}.desc`);
    badgeCount++;
  }
  console.log(`Added ${badgeCount * 2} keys from ${badgeCount} badge definitions.\n`);
}

// 4. Clés inutilisées
//
// Une clé est considérée utilisée si :
//   a) elle est dans usedStaticKeys (clé exacte)
//   b) elle est couverte par un préfixe dynamique
//   c) sa base sans suffixe pluriel (_one/_other/…) est dans usedStaticKeys
//      ex: 'workout.reps_one' est couverte si 'workout.reps' est utilisée
//
const PLURAL_SUFFIXES = ['_one', '_other', '_zero', '_two', '_few', '_many'];

// Base des clés statiques utilisées (pour couvrir les variantes plurielles)
const usedPluralBases = new Set(
  [...usedStaticKeys].map(k => {
    for (const s of PLURAL_SUFFIXES) {
      if (k.endsWith(s)) return k.slice(0, -s.length);
    }
    return k;
  })
);

function isKeyUsed(key) {
  // a) clé exacte
  if (usedStaticKeys.has(key)) return true;

  // b) couverte par un préfixe dynamique
  if ([...usedPrefixes].some(p => key.startsWith(p + '.'))) return true;

  // c) variante plurielle dont la base est utilisée
  for (const suffix of PLURAL_SUFFIXES) {
    if (key.endsWith(suffix)) {
      const base = key.slice(0, -suffix.length);
      if (usedPluralBases.has(base) || usedStaticKeys.has(base)) return true;
    }
  }

  return false;
}

const unusedKeys = allKeys.filter(key => !isKeyUsed(key));

console.log(`=== UNUSED KEYS (${unusedKeys.length}) ===\n`);
unusedKeys.forEach(k => console.log(`  - ${k}`));

// 5. Clés utilisées dans le code mais absentes de en.json
//    (ignorer les "bases" de clés plurielles qui existent sous forme _one/_other)
const missingKeys = [...usedStaticKeys].filter(k => {
  if (allKeysSet.has(k)) return false;

  // La clé est la base d'une paire plurielle existante → pas vraiment manquante
  const hasPluralVariant = PLURAL_SUFFIXES.some(s => allKeysSet.has(`${k}${s}`));
  if (hasPluralVariant) return false;

  return true;
});

let hasErrors = false;

if (missingKeys.length > 0) {
  hasErrors = true;
  console.log(`\n=== MISSING KEYS — used in code but not in en.json (${missingKeys.length}) ===\n`);
  missingKeys.forEach(k => console.log(`  ! ${k}`));
} else {
  console.log('\n✓ All static keys are defined in en.json.');
}

if (unusedKeys.length > 0) {
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ i18n checks failed. Please fix missing or unused keys.');
  process.exit(1);
} else {
  console.log('\n✅ i18n checks passed. No missing or unused keys.');
}