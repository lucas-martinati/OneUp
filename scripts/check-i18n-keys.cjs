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
 * Une clé valide doit :
 *  - contenir au moins un point (structure imbriquée)
 *  - ne pas être un chemin de fichier ou d'import
 *  - ne pas contenir d'espaces ou de virgules
 */
function isLikelyI18nKey(key) {
  if (!key || key.length < 3)                        return false;
  if (!key.includes('.'))                             return false; // doit être imbriquée
  if (key.startsWith('.') || key.startsWith('/'))    return false;
  if (key.startsWith('./') || key.startsWith('../')) return false;
  if (key.includes(' ') || key.includes(','))        return false;
  if (key.includes('@'))                              return false; // packages npm
  // Chemins de fichiers (ex: components/Foo/Bar)
  if (/\/(components|hooks|services|utils|pages|contexts)/.test(key)) return false;
  return true;
}

/**
 * Extrait les clés i18n utilisées dans le contenu d'un fichier source.
 *
 * Gère deux cas :
 *  1. Clé statique   : t('some.key')  → clé complète
 *  2. Clé dynamique  : t(`some.${var}.name`) → préfixe 'some' (la partie avant la première interpolation)
 */
function extractI18nUsage(content) {
  const staticKeys  = new Set();
  const prefixes    = new Set();

  // Capture t('...'), t("..."), t(`...`) — avec ou sans namespace (ex: t('ns:key'))
  const regex = /\bt\((?:'([^']+)'|"([^"]+)"|`([^`]+)`)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const raw = match[1] ?? match[2] ?? match[3];
    if (!raw) continue;

    const isTemplate = match[3] !== undefined;

    if (isTemplate && raw.includes('${')) {
      // Clé dynamique : extraire le préfixe stable (avant le premier ${...})
      const stablePart = raw.split('${')[0].replace(/\.$/, '');
      if (stablePart.includes('.')) {
        prefixes.add(stablePart);
      }
    } else {
      // Clé statique (ou template sans interpolation)
      // Supprimer le namespace éventuel (ex: 'common:key' → 'key')
      const key = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
      if (isLikelyI18nKey(key)) staticKeys.add(key);
    }
  }

  return { staticKeys, prefixes };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// 1. Charger toutes les clés définies dans en.json
const enJson  = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'));
const allKeys = flattenKeys(enJson);
const allKeysSet = new Set(allKeys);

console.log(`Total keys in en.json: ${allKeys.length}\n`);

// 2. Scanner le code source
const usedStaticKeys = new Set();
const usedPrefixes   = new Set();

walkDir(SRC_DIR, (filepath) => {
  const content = fs.readFileSync(filepath, 'utf-8');
  const { staticKeys, prefixes } = extractI18nUsage(content);
  staticKeys.forEach(k  => usedStaticKeys.add(k));
  prefixes.forEach(p    => usedPrefixes.add(p));
});

console.log(`Static keys found in code : ${usedStaticKeys.size}`);
console.log(`Dynamic prefixes found    : ${usedPrefixes.size}\n`);

// 3. Clés dynamiques
if (usedPrefixes.size > 0) {
  console.log('=== DYNAMIC KEYS (accessed via variable patterns) ===\n');
  for (const prefix of [...usedPrefixes].sort()) {
    const matching = allKeys.filter(k => k.startsWith(prefix + '.'));
    if (matching.length > 0) {
      console.log(`  ${prefix}.* → ${matching.length} key(s)`);
      matching.forEach(k => console.log(`    ✓ ${k}`));
    } else {
      console.log(`  ${prefix}.* → ⚠ no matching keys in en.json`);
    }
  }
  console.log('');
}

// 4. Clés inutilisées (ni statique ni couverte par un préfixe dynamique)
const unusedKeys = allKeys.filter(key => {
  if (usedStaticKeys.has(key)) return false;
  if ([...usedPrefixes].some(p => key.startsWith(p + '.'))) return false;
  return true;
});

console.log(`=== UNUSED KEYS (${unusedKeys.length}) ===\n`);
unusedKeys.forEach(k => console.log(`  - ${k}`));

// 5. Clés utilisées mais absentes de en.json
const missingKeys = [...usedStaticKeys].filter(k => !allKeysSet.has(k));

if (missingKeys.length > 0) {
  console.log(`\n=== MISSING KEYS — used in code but not in en.json (${missingKeys.length}) ===\n`);
  missingKeys.forEach(k => console.log(`  ! ${k}`));
} else {
  console.log('\n✓ All static keys are defined in en.json.');
}