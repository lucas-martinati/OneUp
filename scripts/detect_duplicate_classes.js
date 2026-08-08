import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Classes appliquées par défaut par certains de tes composants
const COMPONENT_DEFAULTS = {
  Button: ['btn', 'hover-lift'],
  Card: ['card'],
  // Tu peux en ajouter d'autres ici !
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('Scanning for duplicate CSS classes and component default classes...\n');

try {
  const files = walk(srcDir);
  let totalAnomalies = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Simplification pour trouver le tag:
    // On va chercher "<NomComposant" sur la ligne courante ou les lignes précédentes
    // quand on trouve un className.
    
    lines.forEach((line, i) => {
      const regexes = [
        /className\s*=\s*"([^"]+)"/g,
        /className\s*=\s*\{'([^']+)'\}/g,
        /className\s*=\s*\{"([^"]+)"\}/g,
        /className\s*=\s*\{`([^`]+)`\}/g
      ];

      regexes.forEach(regex => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const classString = match[1];
          
          if (classString) {
            const cleanString = classString.replace(/\$\{[^}]+\}/g, ' ');
            const classes = cleanString.split(/\s+/).filter(c => c.trim().length > 0);
            
            // 1. Chercher les répétitions dans la même string
            const duplicates = classes.filter((item, index) => classes.indexOf(item) !== index);
            let uniqueDuplicates = [...new Set(duplicates)];
            let defaultDuplicates = [];
            
            // 2. Chercher les répétitions par rapport aux classes par défaut du composant
            // Remonter de quelques lignes pour trouver le tag le plus proche
            let componentName = null;
            for (let j = i; j >= Math.max(0, i - 10); j--) {
              // Regex pour trouver <MonComposant
              const tagMatch = /<([A-Za-z0-9_]+)/.exec(lines[j]);
              if (tagMatch) {
                componentName = tagMatch[1];
                break;
              }
            }

            if (componentName && COMPONENT_DEFAULTS[componentName]) {
              const defaults = COMPONENT_DEFAULTS[componentName];
              defaults.forEach(defClass => {
                if (classes.includes(defClass)) {
                  defaultDuplicates.push(defClass);
                }
              });
            }
            
            if (uniqueDuplicates.length > 0 || defaultDuplicates.length > 0) {
              totalAnomalies++;
              const relativePath = path.relative(process.cwd(), file);
              console.log(`\x1b[33m[Anomalie]\x1b[0m ${relativePath}:${i + 1} ${componentName ? '(<' + componentName + '>)' : ''}`);
              
              if (uniqueDuplicates.length > 0) {
                console.log(`  Classes répétées dans la string : \x1b[31m${uniqueDuplicates.join(', ')}\x1b[0m`);
              }
              if (defaultDuplicates.length > 0) {
                console.log(`  Classes redondantes avec les valeurs par défaut de <${componentName}> : \x1b[35m${defaultDuplicates.join(', ')}\x1b[0m`);
              }
              console.log(`  Ligne : ${line.trim()}\n`);
            }
          }
        }
      });
    });
  });

  if (totalAnomalies === 0) {
    console.log('\x1b[32m✔ Aucune anomalie CSS trouvée !\x1b[0m');
  } else {
    console.log(`\x1b[31m✖ Total: ${totalAnomalies} anomalies trouvées.\x1b[0m`);
    process.exit(1);
  }

} catch (err) {
  console.error('Erreur lors du scan:', err.message);
}
