const fs = require('fs');
const path = require('path');

// Helper to recursively list files in a directory
function getFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, extensions));
    } else if (extensions.includes(path.extname(file))) {
      results.push(fullPath);
    }
  });
  return results;
}

// 1. Find all JS/JSX files in src/


const srcDir = path.join(__dirname, '../src');
const codeFiles = getFiles(srcDir, ['.js', '.jsx', '.html']);

// Read contents of all code files
const codeContents = codeFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');

// 2. Find all CSS files in src/
const cssFiles = getFiles(srcDir, ['.css']).filter(file => !file.includes('coverage') && !file.includes('dist'));

console.log(`\x1b[90m🔍 Scan de ${codeFiles.length} fichiers JS/JSX et ${cssFiles.length} fichiers CSS...\x1b[0m\n`);

const unusedClassesByFile = {};
let totalUnused = 0;

// Simple regex to extract CSS class names
// We filter out keyframes percentages like .5%, animations, pseudo-classes, etc.
cssFiles.forEach(cssFile => {
  const content = fs.readFileSync(cssFile, 'utf8');
  
  // Strip comments
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
    .replace(/@keyframes[\s\S]*?\}\s*\}/g, ''); // Remove keyframes declarations

  // Find selectors
  // Matches things like .className but not inside URLs or decimals
  const classMatches = cleanContent.match(/\.([a-zA-Z0-9_-]+)/g) || [];
  
  // Extract unique classnames
  const uniqueClasses = Array.from(new Set(
    classMatches
      .map(c => c.slice(1)) // Remove the leading dot
      .filter(c => {
        // Filter out purely numeric or invalid class names
        if (/^\d/.test(c)) return false;
        // Skip common global/dynamic classes or framework-specific prefixes if needed
        // (e.g. leaflet, active, open)
        const skipList = ['active', 'open', 'show', 'hide', 'expanded', 'drag-over', 'fade-in', 'glass', 'glass-premium'];
        if (skipList.includes(c)) return false;
        // Skip Leaflet map classes
        if (c.startsWith('leaflet-')) return false;
        // Skip Recharts classes
        if (c.startsWith('recharts-')) return false;
        return true;
      })
  ));

  const fileUnused = [];
  uniqueClasses.forEach(cls => {
    // Check if the class name is used in the codebase.
    // We match on word boundaries so that `.bubble` is NOT considered used
    // just because `bubbleContainer` exists somewhere in the code.
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isUsed = new RegExp(`\\b${escaped}\\b`).test(codeContents);
    if (!isUsed) {
      fileUnused.push(cls);
    }
  });

  if (fileUnused.length > 0) {
    unusedClassesByFile[path.relative(path.join(__dirname, '..'), cssFile)] = fileUnused;
    totalUnused += fileUnused.length;
  }
});

if (totalUnused === 0) {
  console.log('\x1b[32m✔ No unused CSS classes found!\x1b[0m');
} else {
  console.log(`\n\x1b[33m⚠ Found ${totalUnused} potentially unused CSS classes:\x1b[0m\n`);
  for (const [file, classes] of Object.entries(unusedClassesByFile)) {
    console.log(`\x1b[1m${file}\x1b[0m:`);
    classes.forEach(c => {
      console.log(`  - ${c}`);
    });
  }
  console.log('\nNote: Some of these might be used dynamically in templates (e.g. `cardio-tab-${tab}`) or injected by third-party libraries.');
}
