import fs from 'fs';
import path from 'path';

function getJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getJsxFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getJsxFiles(path.join(process.cwd(), 'src'));
const classOccurrences = {};
const elementsCandidates = [];

// 1. Compter toutes les classes
for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  
  // Cherche className="xyz" ou className={styles.xyz}
  const classRegex = /className\s*=\s*(?:(["'])(.*?)\1|\{([^}]+)\})/g;
  let match;
  while ((match = classRegex.exec(code)) !== null) {
    if (match[2]) {
      // String literal : ex "container flex"
      const classes = match[2].split(' ').filter(c => c.trim() !== '');
      classes.forEach(c => {
        classOccurrences[c] = (classOccurrences[c] || 0) + 1;
      });
    } else if (match[3]) {
      // Expression : ex styles.container
      const expr = match[3].trim();
      // On évite les expressions trop complexes (ex: conditions avec '?')
      if (expr.startsWith('styles.') && !expr.includes('?')) {
        classOccurrences[expr] = (classOccurrences[expr] || 0) + 1;
      }
    }
  }
}

// 2. Trouver les éléments avec (className ET style={{)
for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  
  // Cherche un bloc de balise ouvrante < ... >
  const tagRegex = /<([A-Za-z0-9_.-]+)[^>]*>/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(code)) !== null) {
    const tagContent = tagMatch[0];
    const lineIndex = code.substring(0, tagMatch.index).split('\n').length;
    
    // Si la balise contient un style inline
    if (tagContent.includes('style={{') || tagContent.includes('style={ {') || tagContent.replace(/\s+/g, '').includes('style={')) {
      
      const classRegex = /className\s*=\s*(?:(["'])(.*?)\1|\{([^}]+)\})/;
      const cMatch = classRegex.exec(tagContent);
      
      if (cMatch) {
        let classes = [];
        if (cMatch[2]) {
           classes = cMatch[2].split(' ').filter(c => c.trim() !== '');
        } else if (cMatch[3]) {
           const expr = cMatch[3].trim();
           if (expr.startsWith('styles.') && !expr.includes('?')) {
             classes = [expr];
           }
        }
        
        if (classes.length > 0) {
          const styleRegex = /style=\{\{([\s\S]*?)\}\}/;
          const sMatch = styleRegex.exec(tagContent);
          let styleRaw = '';
          if (sMatch) {
            styleRaw = sMatch[1].replace(/[\s"']/g, ''); // strip spaces and quotes for easy comparison
          }

          elementsCandidates.push({
            file,
            line: lineIndex,
            classes,
            styleRaw
          });
        }
      }
    }
  }
}

console.log('\n🔍 RÉSULTAT DE L\'ANALYSE : Éléments fusionnables (Classe + Style en ligne)\n');

const classAnalysis = {};
for (const el of elementsCandidates) {
  for (const c of el.classes) {
    if (!classAnalysis[c]) classAnalysis[c] = [];
    classAnalysis[c].push(el);
  }
}

const actionsByFile = {};
let countUnique = 0;
let countMultiple = 0;

for (const c in classAnalysis) {
  const totalUses = classOccurrences[c];
  const usesWithStyle = classAnalysis[c];
  
  if (totalUses === 1) {
    countUnique++;
    const el = usesWithStyle[0];
    const relativePath = path.relative(process.cwd(), el.file);
    if (!actionsByFile[relativePath]) actionsByFile[relativePath] = [];
    actionsByFile[relativePath].push({ type: 'UNIQUE', class: c, lines: [el.line] });
  } else if (totalUses > 1 && usesWithStyle.length === totalUses) {
    const firstStyle = usesWithStyle[0].styleRaw;
    const allIdentical = firstStyle && usesWithStyle.every(el => el.styleRaw === firstStyle);
    
    if (allIdentical) {
      countMultiple++;
      const fileMap = {};
      for (const el of usesWithStyle) {
        const relativePath = path.relative(process.cwd(), el.file);
        if (!fileMap[relativePath]) fileMap[relativePath] = [];
        fileMap[relativePath].push(el.line);
      }
      for (const relativePath in fileMap) {
        if (!actionsByFile[relativePath]) actionsByFile[relativePath] = [];
        actionsByFile[relativePath].push({ type: 'MULTI', class: c, lines: fileMap[relativePath] });
      }
    }
  }
}

const sortedFiles = Object.keys(actionsByFile).sort();
for (const file of sortedFiles) {
  console.log(`\x1b[36m📁 ${file}\x1b[0m`);
  const actions = actionsByFile[file];
  actions.sort((a, b) => a.lines[0] - b.lines[0]);
  
  for (const act of actions) {
    const linesStr = act.lines.length === 1 ? `Ligne ${act.lines[0]}` : `Lignes ${act.lines.join(', ')}`;
    const paddedLines = linesStr.padEnd(16);
    
    if (act.type === 'UNIQUE') {
      console.log(`   \x1b[90m${paddedLines}\x1b[0m • ${act.class} \x1b[32m(Classe unique)\x1b[0m`);
    } else {
      console.log(`   \x1b[90m${paddedLines}\x1b[0m • ${act.class} \x1b[33m(Styles identiques partagés)\x1b[0m`);
    }
  }
  console.log(''); // Ligne vide pour aérer
}

const totalFound = countUnique + countMultiple;
console.log(`✅ Terminé. ${totalFound} classes candidates à la fusion trouvées (${countUnique} uniques, ${countMultiple} multiples).`);

// Si on trouve des erreurs et qu'on l'utilise comme linter, on peut échouer,
// mais pour ne pas bloquer un projet existant avec 64 erreurs, on avertit juste.
// Modifiez la ligne ci-dessous (process.exit(1)) si vous voulez forcer le CI à échouer.
if (totalFound > 0) {
  process.exit(1);
} else {
  process.exit(0);
}