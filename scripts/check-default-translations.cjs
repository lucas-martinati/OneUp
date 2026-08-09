const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
let hasError = false;

// Matches t('key', 'Default value') or i18n.t("key", "Default value")
// Group 1: key quote, Group 2: key, Group 3: value quote, Group 4: value
const regex = /\bt\s*\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1\s*,\s*(['"`])((?:(?!\3)[^\\]|\\.)*)\3/g;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(regex)];
  
  if (matches.length > 0) {
    matches.forEach(match => {
      hasError = true;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const fullMatchContext = match[0].replace(/\n/g, ' ').replace(/\s+/g, ' ');
      
      console.error(`\x1b[31mDefault translation found in ${path.relative(path.join(__dirname, '..'), file)}:${lineNumber}\x1b[0m`);
      console.error(`  Match: ${fullMatchContext}`);
    });
  }
});

if (hasError) {
  console.error('\x1b[31m\nError: Default translations are not allowed.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mNo default translations found.\x1b[0m');
  process.exit(0);
}
