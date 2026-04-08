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
  const content  = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  return flattenObject(content);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// locales est maintenant un objet contenant des objets plats : { en: {"k": "v"}, fr: {"k": "v"} }
const locales = Object.fromEntries(LANGUAGES.map(lang => [lang, loadLocale(lang)]));
const reference = locales[REFERENCE];
const referenceKeys = Object.keys(reference);

// 1. Nombre de clés par langue
console.log('=== KEY COUNT PER LANGUAGE ===\n');
for (const lang of LANGUAGES) {
  const size = Object.keys(locales[lang]).length;
  const refSize = referenceKeys.length;
  const delta = size - refSize;
  const deltaStr = delta === 0 ? '' : delta > 0 ? ` (+${delta})` : ` (${delta})`;
  console.log(`  ${lang}: ${size} keys${deltaStr}`);
}

// 2. Clés manquantes par rapport à en.json
console.log('\n=== MISSING KEYS (compared to en.json) ===\n');
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
console.log('=== EXTRA KEYS (not in en.json) ===\n');
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

// 4. Clés avec des valeurs identiques (Doublons)
console.log('=== DUPLICATE VALUES (same translation for different keys) ===\n');
let noDuplicates = true;
for (const lang of LANGUAGES) {
  const flatObj = locales[lang];
  
  // Utilisation d'une Map pour regrouper les clés par valeur
  const valueMap = new Map();
  for (const [key, value] of Object.entries(flatObj)) {
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value).push(key);
  }

  // On ne garde que les valeurs qui ont plus d'une clé associée
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
if (noDuplicates) console.log('  ✓ No duplicate values found.\n');