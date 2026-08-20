import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Liste exhaustive des classes par défaut appliquées par tes composants UI.
// Seuls les composants qui acceptent une prop `className` fusionnée sur un
// élément portant déjà des classes globales littérales sont référencés
// (les composants 100% inline-styles ou CSS Modules sont exclus : Avatar,
// MetricBadge, ThemeSwatch, Spinner, CategoryChips, ColorPicker, …).
const COMPONENT_DEFAULTS = {
  Button: [
    'btn',
    'hover-lift',
    'btn--primary', 'btn--secondary', 'btn--success', 'btn--danger', 'btn--ghost', 'btn--danger-ghost', 'btn--premium', 'btn--glass', 'btn--link', 'btn--surface',
    'btn--sm', 'btn--md', 'btn--lg',
    'btn--full', 'btn--icon-only',
  ],
  Card: ['glass', 'glass-premium', 'micro-scale-hover'],
  Badge: [
    'badge',
    'badge--sm', 'badge--md',
    'badge--default', 'badge--primary', 'badge--success', 'badge--warning', 'badge--error', 'badge--info', 'badge--gold', 'badge--pro',
    'badge-icon',
  ],
  EmptyState: ['empty-state-card'],
  Input: [
    'input-group', 'input-group--full',
    'input-label',
    'input-wrapper', 'input-wrapper--sm', 'input-wrapper--md', 'input-wrapper--lg', 'input-wrapper--error', 'input-wrapper--disabled',
    'input-icon', 'input-icon--left', 'input-icon--right',
    'input-field', 'input-field--select',
    'input-error', 'input-helper',
  ],
  GoogleSignInButton: ['btn-cloud-signin', 'google-icon'],
  Skeleton: ['skeleton-loader'],
  SectionTitle: ['text-gradient-primary', 'text-gradient-accent'],
  Slider: ['premium-slider'],
  SegmentedControl: ['bump'],
  ModalContainer: ['fade-in', 'modal-overlay', 'dialog-backdrop', 'modal-ambient-glow', 'modal-content'],
  ModalHeader: [
    'modal-header',
    'modal-header-title-group', 'modal-header-icon', 'modal-header-text',
    'modal-header-title', 'modal-header-title--multiline', 'panel-title',
    'modal-header-subtitle', 'modal-header-actions',
  ],
  FitToView: ['fit-to-view-container', 'fit-to-view-content'],
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

console.log('Scanning for duplicate CSS classes (using manual dictionary)...\n');

try {
  const files = walk(srcDir);
  let totalAnomalies = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
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
            
            // 1. Répétitions pures dans la même string
            const duplicates = classes.filter((item, index) => classes.indexOf(item) !== index);
            let uniqueDuplicates = [...new Set(duplicates)];
            let defaultDuplicates = [];
            
            // 2. Vérification par rapport au dictionnaire manuel
            let componentName = null;
            for (let j = i; j >= Math.max(0, i - 10); j--) {
              const tagMatch = /<([A-Z][A-Za-z0-9_]+)/.exec(lines[j]);
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
                console.log(`  Classes redondantes avec <${componentName}> : \x1b[35m${defaultDuplicates.join(', ')}\x1b[0m`);
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
