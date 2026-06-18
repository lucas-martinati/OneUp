const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const LANGUAGES   = ['en', 'fr', 'es', 'zh', 'ru', 'de', 'it', 'pt', 'ja', 'ko'];
const REFERENCE   = 'en';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrait un objet aplati à partir d'un JSON imbriqué.
 * Ex: { a: { b: "val" } } → { "a.b": "val" }
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value; // On conserve la valeur pour trouver les doublons
    }
  }
  return result;
}

function loadLocale(lang) {
  const filepath = path.join(LOCALES_DIR, `${lang}.json`);
  // Gestion d'erreur basique au cas où un fichier manque
  if (!fs.existsSync(filepath)) {
      console.warn(`\x1b[33m⚠️  Warning: File ${filepath} not found. Returning empty object.\x1b[0m`);
      return {};
  }
  const content  = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  return flattenObject(content);
}

// ─── Main ─────────────────────────────────────────────────────────────────────


// locales est maintenant un objet contenant des objets plats : { en: {"k": "v"}, fr: {"k": "v"} }
const locales = Object.fromEntries(LANGUAGES.map(lang => [lang, loadLocale(lang)]));
const reference = locales[REFERENCE];
const referenceKeys = Object.keys(reference);

// Récupérer toutes les clés uniques existantes à travers toutes les langues
const allUniqueKeys = new Set();
LANGUAGES.forEach(lang => Object.keys(locales[lang]).forEach(k => allUniqueKeys.add(k)));

// 1. Nombre de clés par langue
console.log('\x1b[1m\x1b[36mℹ 1. COMPTE DES CLÉS PAR LANGUE\x1b[0m\n');
for (const lang of LANGUAGES) {
  const size = Object.keys(locales[lang]).length;
  const refSize = referenceKeys.length;
  const delta = size - refSize;
  const deltaStr = delta === 0 ? '' : delta > 0 ? ` \x1b[33m(+${delta})\x1b[0m` : ` \x1b[31m(${delta})\x1b[0m`;
  const label = lang === REFERENCE ? `\x1b[1m\x1b[32m${lang} (ref)\x1b[0m` : `\x1b[37m${lang}\x1b[0m`;
  console.log(`  - ${label} : \x1b[1m${size}\x1b[0m clés${deltaStr}`);
}

// 2. Clés manquantes par rapport à en.json
console.log('\n\x1b[1m\x1b[36mℹ 2. CLÉS MANQUANTES (par rapport à en.json)\x1b[0m\n');
let allComplete = true;
for (const lang of LANGUAGES) {
  if (lang === REFERENCE) continue;
  const missing = referenceKeys.filter(k => !(k in locales[lang]));
  if (missing.length > 0) {
    allComplete = false;
    console.log(`  \x1b[31m- ${lang} (${missing.length} manquantes) :\x1b[0m`);
    missing.forEach(k => console.log(`    \x1b[90m- ${k}\x1b[0m`));
    console.log('');
  }
}
if (allComplete) console.log('  \x1b[32m✓ Toutes les langues sont complètes.\x1b[0m\n');

// 3. Clés en trop (présentes dans la langue mais pas dans en.json)
console.log('\x1b[1m\x1b[36mℹ 3. CLÉS EN TROP (non définies dans en.json)\x1b[0m\n');
let noExtras = true;
for (const lang of LANGUAGES) {
  if (lang === REFERENCE) continue;
  const extra = Object.keys(locales[lang]).filter(k => !(k in reference));
  if (extra.length > 0) {
    noExtras = false;
    console.log(`  \x1b[33m- ${lang} (${extra.length} en trop) :\x1b[0m`);
    extra.forEach(k => console.log(`    \x1b[90m+ ${k}\x1b[0m`));
    console.log('');
  }
}
if (noExtras) console.log('  \x1b[32m✓ Aucune clé en trop trouvée.\x1b[0m\n');

// 4. Doublons Inter-Langues
console.log('\x1b[1m\x1b[36mℹ 4. DOUBLONS INTER-LANGUES (Redondances identiques)\x1b[0m\n');
const interLangDuplicatesMap = new Map();

// On crée une signature pour chaque clé basée sur toutes ses traductions
for (const key of allUniqueKeys) {
  const translations = LANGUAGES.map(lang => locales[lang][key]);
  const signature = JSON.stringify(translations);
  
  if (!interLangDuplicatesMap.has(signature)) {
    interLangDuplicatesMap.set(signature, []);
  }
  interLangDuplicatesMap.get(signature).push(key);
}

// On filtre pour ne garder que les signatures qui correspondent à plusieurs clés
const interLangDuplicates = [...interLangDuplicatesMap.entries()].filter(([sig, keys]) => keys.length > 1);
const interLangDuplicateKeysToIgnore = new Set(); // Pour filtrer l'étape 5

if (interLangDuplicates.length > 0) {
  console.log(`  \x1b[33m⚠️ Found ${interLangDuplicates.length} group(s) of redundant keys:\n\x1b[0m`);
  for (const [signature, keys] of interLangDuplicates) {
    console.log(`    \x1b[1mClés :\x1b[0m \x1b[33m${keys.join(', ')}\x1b[0m`);
    
    // On ajoute ces clés à notre set pour ne pas les ré-afficher à l'étape 5
    keys.forEach(k => interLangDuplicateKeysToIgnore.add(k));

    const values = JSON.parse(signature);
    LANGUAGES.forEach((lang, idx) => {
       const val = values[idx];
       console.log(`      \x1b[90m- ${lang}: ${val !== undefined ? `"${val}"` : '(missing)'}\x1b[0m`);
    });
    console.log('');
  }
} else {
  console.log('  \x1b[32m✓ Aucun doublon inter-langue détecté.\x1b[0m\n');
}

let hasConsistencyErrors = false;
if (!allComplete) hasConsistencyErrors = true;
if (!noExtras) hasConsistencyErrors = true;
if (interLangDuplicates.length > 0) hasConsistencyErrors = true;

if (hasConsistencyErrors) {
  console.error('\n\x1b[1m\x1b[31m❌ Échec du contrôle de cohérence i18n. Veuillez corriger les anomalies ci-dessus.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[1m\x1b[32m✅ Contrôle de cohérence i18n réussi !\x1b[0m');
}