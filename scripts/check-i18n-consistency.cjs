const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const LANGUAGES   = ['en', 'fr', 'es', 'zh', 'ru'];
const REFERENCE   = 'en';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function loadLocale(lang) {
  const filepath = path.join(LOCALES_DIR, `${lang}.json`);
  const content  = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  return new Set(flattenKeys(content));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const locales = Object.fromEntries(LANGUAGES.map(lang => [lang, loadLocale(lang)]));
const reference = locales[REFERENCE];

// 1. Nombre de clés par langue
console.log('=== KEY COUNT PER LANGUAGE ===\n');
for (const lang of LANGUAGES) {
  const delta = locales[lang].size - reference.size;
  const deltaStr = delta === 0 ? '' : delta > 0 ? ` (+${delta})` : ` (${delta})`;
  console.log(`  ${lang}: ${locales[lang].size} keys${deltaStr}`);
}

// 2. Clés manquantes par rapport à en.json
console.log('\n=== MISSING KEYS (compared to en.json) ===\n');
let allComplete = true;
for (const lang of LANGUAGES) {
  if (lang === REFERENCE) continue;
  const missing = [...reference].filter(k => !locales[lang].has(k));
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
  const extra = [...locales[lang]].filter(k => !reference.has(k));
  if (extra.length > 0) {
    noExtras = false;
    console.log(`  ${lang} (${extra.length} extra):`);
    extra.forEach(k => console.log(`    + ${k}`));
    console.log('');
  }
}
if (noExtras) console.log('  ✓ No extra keys found.\n');