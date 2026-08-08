import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Walk directory to find all jsx/js files
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('Scanning for redundant props (Auto-detecting default values)...');

try {
  const files = walk(srcDir);
  
  // Phase 1 : Extraction automatique des valeurs par défaut des props
  const COMPONENT_DEFAULTS = {}; // ex: { Button: { size: '"md"', lift: 'true' } }
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // On cherche les définitions de composants avec déstructuration de props
    // Ex: export const Button = function({ size = 'md', lift = true })
    // Regex pour attraper le nom du composant et le bloc de déstructuration
    const componentDefRegex = /(?:const|function|let)\s+([A-Z][A-Za-z0-9_]+)[^({]*\(\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = componentDefRegex.exec(content)) !== null) {
      const componentName = match[1];
      const propsBlock = match[2];
      
      const defaults = {};
      // Dans le bloc { size = 'md', lift = true }, on cherche les affectations
      // On autorise les strings ('md', "md"), les booléens (true, false) et les nombres
      const propAssignRegex = /([a-zA-Z0-9_]+)\s*=\s*(['"][^'"]+['"]|true|false|-?\d+(?:\.\d+)?)/g;
      let propMatch;
      while ((propMatch = propAssignRegex.exec(propsBlock)) !== null) {
        defaults[propMatch[1]] = propMatch[2];
      }
      
      if (Object.keys(defaults).length > 0) {
        COMPONENT_DEFAULTS[componentName] = defaults;
      }
    }
  });

  // Règles manuelles pour les erreurs logiques pures (optionnel)
  const MANUAL_INVALID_RULES = {
    Button: [
      {
        match: /lift\s*=\s*\{([^}]+)\}/,
        validator: (m) => m[1].trim() !== 'true' && m[1].trim() !== 'false',
        message: "La prop 'lift' attend un booléen (ex: lift={false})"
      }
    ]
  };

  let totalAnomalies = 0;

  // Phase 2 : Scan des balises pour trouver les props redondantes
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    const tagRegex = /<([A-Z][A-Za-z0-9_]+)([^>]+)>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      const componentName = match[1];
      const propsString = match[2];
      let anomaliesForTag = [];

      // 1. Détection automatique des redondances
      const defaults = COMPONENT_DEFAULTS[componentName];
      if (defaults) {
        Object.entries(defaults).forEach(([prop, defValue]) => {
          // On cherche si la prop est passée explicitement avec la valeur par défaut
          // ex: size="md" ou size={'md'} ou lift={true}
          
          // Regex pour matcher la prop dans la balise
          const propUsageRegex = new RegExp(`\\b${prop}\\s*=\\s*(?:(['"])([^'"]+)\\1|\\{([^}]+)\\})`, 'g');
          let usageMatch;
          while ((usageMatch = propUsageRegex.exec(propsString)) !== null) {
            // value peut être dans usageMatch[2] (string) ou usageMatch[3] (accolades)
            let passedValue = usageMatch[2] ? `"${usageMatch[2]}"` : usageMatch[3]; // normaliser en "string" pour comparer
            passedValue = passedValue.trim();
            
            // Si c'est une string avec single quotes dans le code source (ex: 'md'), 
            // et que la balise utilise "md", on doit harmoniser la comparaison.
            const normalizedDef = defValue.replace(/'/g, '"');
            const normalizedPassed = passedValue.replace(/'/g, '"');
            
            if (normalizedDef === normalizedPassed) {
              anomaliesForTag.push(`${prop}=${defValue} est déjà la valeur par défaut du composant <${componentName}> !`);
            }
          }
        });
      }

      // 2. Règles manuelles
      if (MANUAL_INVALID_RULES[componentName]) {
        MANUAL_INVALID_RULES[componentName].forEach(rule => {
          const invalidMatch = rule.match.exec(propsString);
          if (invalidMatch && rule.validator(invalidMatch)) {
            anomaliesForTag.push(rule.message);
          }
        });
      }

      if (anomaliesForTag.length > 0) {
        totalAnomalies++;
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const relativePath = path.relative(process.cwd(), file);
        
        console.log(`\x1b[33m[Anomalie]\x1b[0m ${relativePath}:${lineNumber} (<${componentName}>)`);
        anomaliesForTag.forEach(msg => {
          console.log(`  ✖ \x1b[31m${msg}\x1b[0m`);
        });
        console.log('');
      }
    }
  });

  if (totalAnomalies === 0) {
    console.log('\n\x1b[32m✔ Aucune prop redondante trouvée !\x1b[0m');
  } else {
    console.log(`\x1b[31mTotal: ${totalAnomalies} balise(s) avec des anomalies.\x1b[0m`);
    process.exit(1);
  }

} catch (err) {
  console.error('Erreur lors du scan:', err.message);
}
