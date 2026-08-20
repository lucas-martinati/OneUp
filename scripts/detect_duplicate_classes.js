import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// ────────────────────────────────────────────────────────────────────────────
// 1. Résolution des classes GLOBALES appliquées par chaque composant UI,
//    en fonction des props réellement passées (variant / size / flags).
//
//    - base             : classes toujours présentes
//    - variantProp      : classe préfixée par la prop (ex. `btn--${variant}`)
//    - sizeProp         : classe préfixée par la prop de taille
//    - variantMap       : mapping prop → classe exacte (Card, SectionTitle…)
//    - boolProps        : classe ajoutée si la prop est truthy (y compris booléen nu)
//    - trueDefaultProps : classe ajoutée si la prop est absente OU `true`
//    - truthyProps      : classe ajoutée si au moins une prop est fournie (non vide)
//    - falseProps       : classe ajoutée si la prop est absente / falsy
//    - owned            : classes internes posées sur des sous-éléments
//    (composants 100% inline-styles ou CSS Modules : Avatar, MetricBadge,
//    ThemeSwatch, ColorPicker, ToggleSwitch, SettingRow, … → non référencés)
const COMPONENT_RULES = {
  Button: {
    base: ['btn'],
    variantProp: { prop: 'variant', prefix: 'btn--', default: 'primary' },
    sizeProp: { prop: 'size', prefix: 'btn--', default: 'md' },
    trueDefaultProps: [{ prop: 'lift', cls: 'hover-lift', default: true }],
    boolProps: [
      { prop: 'fullWidth', cls: 'btn--full' },
      { prop: 'iconOnly', cls: 'btn--icon-only' },
    ],
  },
  Card: {
    variantMap: {
      prop: 'variant',
      default: 'glass',
      map: { glass: 'glass', premium: 'glass-premium' },
    },
    boolProps: [{ prop: 'interactive', cls: 'micro-scale-hover' }],
  },
  Badge: {
    base: ['badge'],
    variantProp: { prop: 'variant', prefix: 'badge--', default: 'default' },
    sizeProp: { prop: 'size', prefix: 'badge--', default: 'md' },
    truthyProps: [{ prop: 'icon', cls: 'badge-icon' }],
  },
  EmptyState: { base: ['empty-state-card'] },
  Input: {
    base: ['input-group'],
    trueDefaultProps: [{ prop: 'fullWidth', cls: 'input-group--full', default: true }],
    owned: [
      'input-label',
      'input-wrapper', 'input-wrapper--sm', 'input-wrapper--md', 'input-wrapper--lg', 'input-wrapper--error', 'input-wrapper--disabled',
      'input-icon', 'input-icon--left', 'input-icon--right',
      'input-field', 'input-field--select',
      'input-error', 'input-helper',
    ],
  },
  GoogleSignInButton: { base: ['btn-cloud-signin', 'google-icon'] },
  Skeleton: { base: ['skeleton-loader'] },
  SectionTitle: {
    variantMap: {
      prop: 'variant',
      default: 'default',
      map: { primary: 'text-gradient-primary', accent: 'text-gradient-accent' },
    },
  },
  Slider: { base: ['premium-slider'] },
  SegmentedControl: { base: ['bump'] },
  ModalContainer: {
    base: ['fade-in'],
    variantMap: {
      prop: 'position',
      default: 'fullscreen',
      map: { fullscreen: 'modal-overlay', center: 'dialog-backdrop' },
    },
    truthyProps: [{ prop: 'ambientGlow', cls: 'modal-ambient-glow' }],
    falseProps: [{ prop: 'unstyled', cls: 'modal-content' }],
  },
  ModalHeader: {
    base: ['modal-header', 'modal-header-title-group', 'modal-header-actions'],
    truthyProps: [
      { prop: 'icon', cls: 'modal-header-icon' },
      { prop: 'title', cls: 'modal-header-title' },
      { prop: 'title', cls: 'panel-title' },
      { props: ['title', 'subtitle'], cls: 'modal-header-text' },
      { prop: 'subtitle', cls: 'modal-header-subtitle' },
      { prop: 'multiline', cls: 'modal-header-title--multiline' },
    ],
  },
  FitToView: { base: ['fit-to-view-container', 'fit-to-view-content'] },
};

// 2. Classes CSS Modules (`styles.xxx`) appliquées en interne par les composants.
//    La clé est le nom de la propriété module (ex. `chip` dans `styles.chip`).
const CSS_MODULE_DEFAULTS = {
  CategoryChips: ['chips', 'chip', 'chipOn', 'chipLocked', 'chipDot'],
  Spinner: ['wrap', 'ring', 'label'],
  InlineNameEditor: ['container', 'inputRow', 'inputWrap', 'input', 'charCount', 'saveBtn', 'displayBtn', 'displayText', 'pencil', 'addBtn', 'addBtnIcon'],
  FilterDropdown: ['toggle', 'toggleOpen', 'count', 'chevron', 'panel'],
  NotificationManager: ['stack', 'toast', 'toastIn', 'avatarWrap', 'iconBadge', 'countBadge', 'body', 'name', 'message', 'close', 'progress'],
};

// ────────────────────────────────────────────────────────────────────────────
// Extraction des props d'une balise JSX (gère multi-lignes, booléens nus, `=>`…)
// ────────────────────────────────────────────────────────────────────────────
// Normalise la valeur d'une expression `{...}` :
//   - `{'primary'}` / `{"primary"}` / `` {`primary`} `` → chaîne `primary` (quotes retirées)
//   - `{true}` / `{false}` / `{undefined}` → vrais booléens / undefined
//   - toute autre expression (variable, concaténation…) → objet `{ dynamic: true }`
//     (non résolvable : on évitera de générer/prétendre une classe à partir d'elle)
function normalizeExprValue(raw) {
  let s = String(raw).trim();
  if (!s) return '';
  const q = s[0];
  if ((q === "'" || q === '"' || q === '`') && s.endsWith(q) && s.length > 1) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'undefined' || s === 'null') return undefined;
  return { dynamic: true };
}
function extractPropsFromLine(line) {
  const props = {};

  // props avec valeur : name="x" | name='x' | name={expr}
  const valRe = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\})/g;
  let m;
  while ((m = valRe.exec(line)) !== null) {
    props[m[1]] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : normalizeExprValue(m[4]);
  }

  // booléens nus : on retire les assignations puis on cherche les mots restants
  const stripped = line
    .replace(/\w+\s*=\s*(?:"[^"]*"|'[^']*'|\{[^{}]*\})/g, ' ')
    .replace(/\w+\s*=\s*[^\s/>]+/g, ' ');
  const bareRe = /\b([a-z][\w-]*)\b/g;
  let b;
  while ((b = bareRe.exec(stripped)) !== null) {
    const word = b[1];
    if (word === 'style') continue;
    if (props[word] === undefined) props[word] = true;
  }

  return props;
}

function readProps(lines, startIdx) {
  const props = {};
  let depth = 0; // profondeur des `{...}`
  let quote = null;
  let prev = '';
  let i = startIdx;

  while (i < lines.length && i - startIdx < 25) {
    const line = lines[i];
    let closed = false;

    for (let k = 0; k < line.length; k++) {
      const ch = line[k];
      if (quote) {
        if (ch === '\\') { k++; prev = line[k] || ''; continue; } // quote échappée
        if (ch === quote) quote = null;
        prev = ch;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; prev = ch; continue; }
      if (ch === '{') { depth++; prev = ch; continue; }
      if (ch === '}') { if (depth > 0) depth--; prev = ch; continue; }
      // `=>` n'est pas un `>` de fermeture de balise
      if (ch === '>' && depth === 0 && prev !== '=') { closed = true; break; }
      prev = ch;
    }

    Object.assign(props, extractPropsFromLine(line));
    if (closed) break;
    i++;
  }

  return { props, endIdx: i };
}

// Balise ouvrante la plus proche dont la liste d'attributs est encore ouverte
// à la ligne `lineIdx` (donc propriétaire du `className` scanné).
// Balise ouvrante d'un composant en attribut TOP-LEVEL (depth `{...}` = 0).
// Ignore les composants imbriqués dans une prop (`icon={<CloseIcon />}`) et
// les balises à l'intérieur d'une string.
function findDepthZeroTag(line) {
  let depth = 0;
  let quote = null;
  for (let k = 0; k < line.length; k++) {
    const ch = line[k];
    if (quote) {
      if (ch === '\\') { k++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') { if (depth > 0) depth--; continue; }
    if (ch === '<' && depth === 0) {
      const m = /^([A-Z][A-Za-z0-9_]*)\b/.exec(line.slice(k + 1));
      if (m) return { tagName: m[1], idx: k };
    }
  }
  return null;
}

// Balise ouvrante la plus proche dont la liste d'attributs est encore ouverte
// à la ligne `lineIdx` (donc propriétaire du `className` scanné).
function findComponent(lines, lineIdx) {
  for (let j = lineIdx; j >= Math.max(0, lineIdx - 30); j--) {
    const tag = findDepthZeroTag(lines[j]);
    if (tag) {
      const { props, endIdx } = readProps(lines, j);
      // Déjà fermé avant la ligne inspectée (ex. composant JSX imbriqué dans une
      // prop : `<CloseIcon />` puis `className` plus bas) → on continue à remonter
      // pour trouver le vrai composant parent.
      if (endIdx >= lineIdx) {
        return { tagName: tag.tagName, props, closedIdx: endIdx };
      }
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Résolution des classes appliquées pour une instance donnée
// ────────────────────────────────────────────────────────────────────────────
function isDynamic(v) {
  return v && typeof v === 'object' && v.dynamic === true;
}

function resolveGlobalDefaults(tagName, props) {
  const rule = COMPONENT_RULES[tagName];
  if (!rule) return null;

  const classes = new Set();
  (rule.base || []).forEach(c => classes.add(c));

  const applyPrefixed = ({ prop, prefix, default: dflt }) => {
    const v = props[prop] !== undefined ? props[prop] : dflt;
    if (isDynamic(v)) return; // valeur dynamique → classe inconnue, on ne signale rien
    if (typeof v === 'string' && v) classes.add(`${prefix}${v}`);
    else if (v === true && dflt) classes.add(`${prefix}${dflt}`);
  };
  if (rule.variantProp) applyPrefixed(rule.variantProp);
  if (rule.sizeProp) applyPrefixed(rule.sizeProp);

  if (rule.variantMap) {
    const v = props[rule.variantMap.prop] !== undefined ? props[rule.variantMap.prop] : rule.variantMap.default;
    const cls = isDynamic(v) ? undefined : rule.variantMap.map[v];
    if (cls) classes.add(cls);
  }

  (rule.trueDefaultProps || []).forEach(({ prop, cls }) => {
    const v = props[prop];
    if (v === undefined || v === true) classes.add(cls);
  });
  (rule.boolProps || []).forEach(({ prop, cls }) => {
    if (props[prop] && !isDynamic(props[prop])) classes.add(cls);
  });
  (rule.truthyProps || []).forEach(({ prop, props: anyProps, cls }) => {
    const names = anyProps || [prop];
    if (names.some(n => props[n] !== undefined && props[n] !== false && !isDynamic(props[n]))) classes.add(cls);
  });
  (rule.falseProps || []).forEach(({ prop, cls }) => {
    if (!props[prop]) classes.add(cls);
  });
  (rule.owned || []).forEach(c => classes.add(c));

  return classes;
}

// ────────────────────────────────────────────────────────────────────────────
// Tokenisation d'une valeur className : tokens littéraux + tokens `styles.x`
// ────────────────────────────────────────────────────────────────────────────
function getModuleVarNames(content) {
  const names = [];
  const re1 = /import\s+(\w+)\s+from\s+["'][^"']*\.module\.(?:css|scss|sass)["']/g;
  const re2 = /import\s*\*\s*as\s+(\w+)\s+from\s+["'][^"']*\.module\.(?:css|scss|sass)["']/g;
  let m;
  while ((m = re1.exec(content)) !== null) names.push(m[1]);
  while ((m = re2.exec(content)) !== null) names.push(m[1]);
  return names.length ? names : ['styles'];
}

function extractTokens(classString, moduleNames, isPlainString) {
  const moduleTokens = [];
  const key = moduleNames.join('|');
  const interpRe = new RegExp('\\$\\{(?:' + key + ')\\.\\w+\\}', 'g');
  const bareRe = new RegExp('\\b(?:' + key + ')\\.\\w+', 'g');

  let s = String(classString);

  // Cas `className="..."` : tout le contenu est une liste de classes statiques.
  if (isPlainString) {
    return {
      literalTokens: s.split(/\s+/).filter(Boolean),
      moduleTokens: [],
    };
  }

  // Expression `{...}` : on ne garde QUE les segments quotés et les modules.
  // Les identifiants non quotés (clsx, conditions, opérateurs) sont du code JS.
  s = s.replace(interpRe, (m) => {
    moduleTokens.push(m.slice(2, -1).trim());
    return ' ';
  });
  s = s.replace(bareRe, (m) => {
    moduleTokens.push(m);
    return ' ';
  });

  // Scanner quote-aware : les délimiteurs ouvrant/fermant sont IDENTIQUES
  // (jamais `'...` ou `'...") et les template literals avec `${...}` imbriqués
  // (ternaires, strings internes) sont traités séparément.
  const literalTokens = [];
  const addClassText = (text) => {
    text.split(/\s+/).forEach(t => {
      if (t && /^[a-zA-Z_-][\w-]*$/.test(t)) literalTokens.push(t);
    });
  };
  const readString = (start, quote) => {
    let j = start;
    let content = '';
    while (j < s.length && s[j] !== quote) {
      if (s[j] === '\\') { content += s[j + 1] || ''; j += 2; continue; }
      content += s[j]; j++;
    }
    return { content, end: j + 1 };
  };
  const parseInterpolation = (start) => {
    // `start` pointe juste après `${` : extrait les strings (classes) et saute
    // les identifiants JS, en gérant l'imbrication d'accolades.
    let depth = 1;
    let i = start;
    while (i < s.length) {
      const ch = s[i];
      if (ch === "'" || ch === '"') {
        const { content, end } = readString(i + 1, ch);
        addClassText(content);
        i = end;
        continue;
      }
      if (ch === '{') { depth++; i++; continue; }
      if (ch === '}') { depth--; if (depth === 0) return i + 1; i++; continue; }
      i++;
    }
    return i;
  };
  const parseTemplate = (start) => {
    // `start` pointe juste après le backtick ouvrant.
    let i = start;
    let buf = '';
    while (i < s.length) {
      const ch = s[i];
      if (ch === '\\') { buf += s[i + 1] || ''; i += 2; continue; }
      if (ch === '`') { addClassText(buf); return i + 1; }
      if (ch === '$' && s[i + 1] === '{') {
        addClassText(buf);
        buf = '';
        i = parseInterpolation(i + 2);
        continue;
      }
      buf += ch;
      i++;
    }
    addClassText(buf);
    return i;
  };

  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "'" || ch === '"') {
      const { content, end } = readString(i + 1, ch);
      addClassText(content);
      i = end;
    } else if (ch === '`') {
      i = parseTemplate(i + 1);
    } else {
      i++;
    }
  }
  return { literalTokens, moduleTokens };
}

function findPureDuplicates(arr) {
  const seen = new Set();
  const dups = new Set();
  for (const t of arr) {
    if (seen.has(t)) dups.add(t);
    else seen.add(t);
  }
  return [...dups];
}

// Découpe une expression ternaire `cond ? 'a' : 'b'` en ses branches, pour ne
// pas signaler un doublon qui n'existerait qu'à travers deux branches distinctes.
function splitBranches(expr) {
  const str = String(expr).trim();
  if (!str.includes('?')) return [str];

  const toks = [];
  let quote = null;
  let depth = 0;
  let segStart = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; continue; }
    if (depth === 0 && (ch === '?' || ch === ':')) {
      toks.push(str.slice(segStart, i).trim());
      toks.push(ch);
      segStart = i + 1;
    }
  }
  toks.push(str.slice(segStart).trim());

  const qIdx = toks.indexOf('?');
  if (qIdx <= 0) return [str];
  const colonIdx = toks.indexOf(':', qIdx);
  if (colonIdx <= qIdx) return [str];

  const thenBranch = toks.slice(qIdx + 1, colonIdx).join(' ').trim();
  const elseBranch = toks.slice(colonIdx + 1).join(' ').trim();
  return [...splitBranches(thenBranch), ...splitBranches(elseBranch)];
}

// ────────────────────────────────────────────────────────────────────────────
// Extraction robuste des valeurs `className`, sur tout le fichier (pas ligne à
// ligne) : gère les espaces internes (`{ 'btn' }`), les quotes, les template
// literals avec `${...}`, les ternaires, et surtout les `className` multi-lignes
// dont l'accolade fermante `}` est sur une ligne ultérieure.
// ────────────────────────────────────────────────────────────────────────────
function scanBraces(str, openIdx) {
  let depth = 0;
  let quote = null;
  for (let i = openIdx; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0) return str.slice(openIdx + 1, i);
    }
  }
  return null;
}

function scanString(str, startIdx) {
  const q = str[startIdx];
  let out = '';
  for (let i = startIdx + 1; i < str.length; i++) {
    if (str[i] === '\\') { out += str[i] + (str[i + 1] || ''); i++; continue; }
    if (str[i] === q) return out;
    out += str[i];
  }
  return null;
}

function lineIndexOf(content, charIdx) {
  let n = 0;
  for (let k = 0; k < charIdx; k++) if (content[k] === '\n') n++;
  return n;
}

function extractClassNames(content) {
  const values = [];
  const re = /className\s*=/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const start = m.index + m[0].length;
    const rest = content.slice(start);
    const idx = rest.search(/\S/);
    if (idx === -1) continue;
    const ch = rest[idx];
    let value = null;
    let plain = false;
    if (ch === '"' || ch === "'" || ch === '`') {
      value = scanString(content, start + idx);
      plain = true;
    } else if (ch === '{') {
      value = scanBraces(content, start + idx);
    }
    if (value !== null) {
      values.push({ value, lineIdx: lineIndexOf(content, m.index), plain });
    }
  }
  return values;
}

// ────────────────────────────────────────────────────────────────────────────
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

console.log('Scanning for duplicate CSS classes (globales + CSS Modules, résolues par props)...\n');

try {
  const files = walk(srcDir);
  let totalAnomalies = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const moduleNames = getModuleVarNames(content);

    extractClassNames(content).forEach(({ value: classString, lineIdx: i, plain }) => {
      if (!classString) return;

      const component = findComponent(lines, i);
      let allPure = [];
      let allRedundantLit = [];
      let allRedundantMod = [];

      splitBranches(classString).forEach(branch => {
            const { literalTokens, moduleTokens } = extractTokens(branch, moduleNames, plain);
            allPure = allPure.concat(findPureDuplicates([...literalTokens, ...moduleTokens]));

            // "Déjà appliquées par <X>" uniquement si le className est un attribut
            // de la balise du composant lui-même (et non d'un élément descendant).
            if (component && component.closedIdx >= i) {
              const defaults = resolveGlobalDefaults(component.tagName, component.props);
              if (defaults) {
                allRedundantLit = allRedundantLit.concat(literalTokens.filter(t => defaults.has(t)));
              }
              const moduleDefaults = CSS_MODULE_DEFAULTS[component.tagName] || [];
              allRedundantMod = allRedundantMod.concat(moduleTokens.filter(t => {
                const key = t.slice(t.indexOf('.') + 1);
                return moduleDefaults.includes(key);
              }));
            }
          });

          allPure = [...new Set(allPure)];
          allRedundantLit = [...new Set(allRedundantLit)];
          allRedundantMod = [...new Set(allRedundantMod)];

          if (allPure.length > 0 || allRedundantLit.length > 0 || allRedundantMod.length > 0) {
            totalAnomalies++;
            const relativePath = path.relative(process.cwd(), file);
            const context = component ? `(<${component.tagName}>)` : '';
            console.log(`\x1b[33m[Anomalie]\x1b[0m ${relativePath}:${i + 1} ${context}`);

            if (allPure.length > 0) {
              console.log(`  Classes répétées dans la string : \x1b[31m${allPure.join(', ')}\x1b[0m`);
              console.log(`  \x1b[32mCorrection :\x1b[0m supprimer ${allPure.map(c => `'${c}'`).join(', ')} (appliquée une seule fois suffit)`);
            }
            if (allRedundantLit.length > 0) {
              console.log(`  Classes déjà appliquées par <${component.tagName}> : \x1b[35m${allRedundantLit.join(', ')}\x1b[0m`);
              console.log(`  \x1b[32mCorrection :\x1b[0m supprimer ${allRedundantLit.map(c => `'${c}'`).join(', ')} du className (déjà appliquée par <${component.tagName}>)`);
            }
            if (allRedundantMod.length > 0) {
              console.log(`  Classes CSS Module déjà appliquées par <${component.tagName}> : \x1b[36m${allRedundantMod.join(', ')}\x1b[0m`);
              console.log(`  \x1b[32mCorrection :\x1b[0m supprimer ${allRedundantMod.join(', ')} (déjà appliquée en interne par <${component.tagName}>)`);
            }
            console.log(`  Ligne : ${lines[i].trim()}\n`);
          }
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
