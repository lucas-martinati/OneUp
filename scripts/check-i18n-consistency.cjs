const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const LANGUAGES   = ['en', 'fr', 'es', 'zh', 'ru'];
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
      console.warn(`⚠️  Warning: File ${filepath} not found. Returning empty object.`);
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
console.log('=== 1. KEY COUNT PER LANGUAGE ===\n');
for (const lang of LANGUAGES) {
  const size = Object.keys(locales[lang]).length;
  const refSize = referenceKeys.length;
  const delta = size - refSize;
  const deltaStr = delta === 0 ? '' : delta > 0 ? ` (+${delta})` : ` (${delta})`;
  console.log(`  ${lang}: ${size} keys${deltaStr}`);
}

// 2. Clés manquantes par rapport à en.json
console.log('\n=== 2. MISSING KEYS (compared to en.json) ===\n');
let allComplete = true;
for (const lang of LANGUAGES) {
  if (lang === REFERENCE) continue;
  const missing = referenceKeys.filter(k => !(k in locales[lang]));
  if (missing.length > 0) {
    allComplete = false;
    console.log(`  ${lang} (${missing.length} missing):`);
    missing.forEach(k => console.log(`    - ${k}`));
    console.log('');
  }
}
if (allComplete) console.log('  ✓ All languages are complete.\n');

// 3. Clés en trop (présentes dans la langue mais pas dans en.json)
console.log('=== 3. EXTRA KEYS (not in en.json) ===\n');
let noExtras = true;
for (const lang of LANGUAGES) {
  if (lang === REFERENCE) continue;
  const extra = Object.keys(locales[lang]).filter(k => !(k in reference));
  if (extra.length > 0) {
    noExtras = false;
    console.log(`  ${lang} (${extra.length} extra):`);
    extra.forEach(k => console.log(`    + ${k}`));
    console.log('');
  }
}
if (noExtras) console.log('  ✓ No extra keys found.\n');

// 4. Doublons Inter-Langues (NOUVEAU)
console.log('=== 4. INTER-LANGUAGE DUPLICATES (Same duplicates across ALL languages) ===\n');
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
  console.log(`  ⚠️ Found ${interLangDuplicates.length} group(s) of redundant keys:\n`);
  for (const [signature, keys] of interLangDuplicates) {
    console.log(`    Keys : ${keys.join(', ')}`);
    
    // On ajoute ces clés à notre set pour ne pas les ré-afficher à l'étape 5
    keys.forEach(k => interLangDuplicateKeysToIgnore.add(k));

    const values = JSON.parse(signature);
    LANGUAGES.forEach((lang, idx) => {
       const val = values[idx];
       console.log(`      - ${lang}: ${val !== undefined ? `"${val}"` : '(missing)'}`);
    });
    console.log('');
  }
} else {
  console.log('  ✓ No inter-language duplicates found.\n');
}

// 5. Clés avec des valeurs identiques (Doublons locaux)
console.log('=== 5. LOCAL DUPLICATE VALUES (Per language, excluding inter-language duplicates) ===\n');
let noDuplicates = true;
for (const lang of LANGUAGES) {
  const flatObj = locales[lang];
  
  const valueMap = new Map();
  for (const [key, value] of Object.entries(flatObj)) {
    // OPTIMISATION : On ignore les clés déjà remontées dans l'étape 4
    if (interLangDuplicateKeysToIgnore.has(key)) continue;

    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value).push(key);
  }

  const duplicates = [...valueMap.entries()].filter(([val, keys]) => keys.length > 1);

  if (duplicates.length > 0) {
    noDuplicates = false;
    console.log(`  ${lang} (${duplicates.length} duplicated values):`);
    for (const [value, keys] of duplicates) {
      console.log(`    Value : "${value}"`);
      console.log(`    Keys  : ${keys.join(', ')}\n`);
    }
  }
}
if (noDuplicates) console.log('  ✓ No local duplicate values found.\n');