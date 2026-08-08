import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Définis ici les règles pour détecter les props redondantes ou invalides
const COMPONENT_RULES = {
  Button: {
    // Props qui sont déjà là par défaut, donc inutiles à répéter
    redundant: [
      { match: /type\s*=\s*['"]button['"]/, message: 'type="button" est déjà la valeur par défaut' },
      { match: /variant\s*=\s*['"]primary['"]/, message: 'variant="primary" est déjà la valeur par défaut' },
      { match: /size\s*=\s*['"]md['"]/, message: 'size="md" est déjà la valeur par défaut' },
      { match: /lift\s*=\s*\{?true\}?/, message: 'lift={true} est déjà la valeur par défaut' },
    ],
    // Props qui ont des valeurs illogiques ou incorrectes
    invalid: [
      { 
        match: /lift\s*=\s*\{([^}]+)\}/, 
        // Si la valeur passée à lift n'est ni 'true' ni 'false', c'est probablement une erreur (ex: lift={resolve})
        validator: (regexMatch) => regexMatch[1].trim() !== 'true' && regexMatch[1].trim() !== 'false',
        message: "La prop 'lift' attend un booléen (ex: lift={false})"
      },
      {
        match: /loading\s*=\s*\{([^}]+)\}/,
        validator: (regexMatch) => regexMatch[1].trim() !== 'true' && regexMatch[1].trim() !== 'false' && !/^[A-Za-z0-9_]+$/.test(regexMatch[1].trim()),
        message: "La prop 'loading' devrait être un booléen ou une variable booléenne"
      }
    ]
  }
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
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('Scanning for redundant and invalid props...\n');

try {
  const files = walk(srcDir);
  let totalAnomalies = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // On extrait grossièrement chaque bloc de balise JSX (ex: <Button ... >)
    // Cette regex capte le nom du composant et tout ce qu'il y a à l'intérieur de la balise ouvrante.
    const tagRegex = /<([A-Z][A-Za-z0-9_]+)([^>]+)>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      const componentName = match[1];
      const propsString = match[2];
      
      const rules = COMPONENT_RULES[componentName];
      if (!rules) continue;
      
      let anomaliesForTag = [];

      // Vérifier les redondances
      if (rules.redundant) {
        rules.redundant.forEach(rule => {
          if (rule.match.test(propsString)) {
            anomaliesForTag.push(rule.message);
          }
        });
      }

      // Vérifier les valeurs invalides
      if (rules.invalid) {
        rules.invalid.forEach(rule => {
          const invalidMatch = rule.match.exec(propsString);
          if (invalidMatch && rule.validator(invalidMatch)) {
            anomaliesForTag.push(rule.message);
          }
        });
      }

      if (anomaliesForTag.length > 0) {
        totalAnomalies++;
        
        // Trouver le numéro de ligne en comptant les sauts de ligne avant le match
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
    console.log('\x1b[32m✔ Aucune prop invalide ou redondante trouvée !\x1b[0m');
  } else {
    console.log(`\x1b[31mTotal: ${totalAnomalies} balise(s) avec des anomalies.\x1b[0m`);
  }

} catch (err) {
  console.error('Erreur lors du scan:', err.message);
}
