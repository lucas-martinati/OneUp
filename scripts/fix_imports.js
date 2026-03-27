import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

// Define components to their new folders
const compFolders = {
  'Leaderboard': 'social',
  'ClanModal': 'social',
  'ChallengeModal': 'social',
  'NotificationManager': 'social',
  'WorkoutSession': 'exercises',
  'CustomExercisesModal': 'exercises',
  'CustomProgramPanel': 'exercises',
  'RoutineManager': 'exercises',
  'Counter': 'exercises',
  'Timer': 'exercises',
  'Stats': 'stats',
  'Calendar': 'stats',
  'Settings': 'settings',
  'CloudSyncPanel': 'settings',
  'Onboarding': 'settings',
  'Achievements': 'feedback',
  'AchievementToast': 'feedback',
  'CSSConfetti': 'feedback',
  'ErrorBoundary': 'core',
  'Avatar': 'ui'
};

// 1. Fix Dashboard, App, main
const coreFiles = [
  path.join(srcDir, 'components/Dashboard.jsx'),
  path.join(srcDir, 'App.jsx'),
  path.join(srcDir, 'main.jsx')
];

coreFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // For Dashboard: `./ComponentName` -> `./foldername/ComponentName`
    Object.keys(compFolders).forEach(comp => {
      const folder = compFolders[comp];
      // Regex replace: import { Comp } from './Comp' or import Comp from './Comp'
      const regex = new RegExp(`from\\s+['"]\\.\\/${comp}['"]`, 'g');
      content = content.replace(regex, `from './${folder}/${comp}'`);
    });

    // App.jsx: `./components/Onboarding` -> `./components/settings/Onboarding`
    content = content.replace(/from ['"]\.\/components\/Onboarding['"]/g, "from './components/settings/Onboarding'");
    
    // main.jsx: `./components/ErrorBoundary.jsx` -> `./components/core/ErrorBoundary.jsx`
    content = content.replace(/from ['"]\.\/components\/ErrorBoundary\.jsx['"]/g, "from './components/core/ErrorBoundary.jsx'");

    fs.writeFileSync(file, content);
  } else {
    console.error('File not found:', file);
  }
});

// 2. Fix exactly the files that were moved down one level
const movedFilesExt = [
  'social/Leaderboard.jsx',
  'social/ClanModal.jsx',
  'social/ChallengeModal.jsx',
  'social/NotificationManager.jsx',
  'exercises/WorkoutSession.jsx',
  'exercises/CustomExercisesModal.jsx',
  'exercises/CustomProgramPanel.jsx',
  'exercises/RoutineManager.jsx',
  'exercises/Counter.jsx',
  'exercises/Timer.jsx',
  'stats/Stats.jsx',
  'stats/Calendar.jsx',
  'settings/Settings.jsx',
  'settings/CloudSyncPanel.jsx',
  'settings/Onboarding.jsx',
  'feedback/Achievements.jsx',
  'feedback/AchievementToast.jsx',
  'feedback/CSSConfetti.jsx',
  'core/ErrorBoundary.jsx',
  'ui/Avatar.jsx'
];

movedFilesExt.forEach(relPath => {
  const file = path.join(srcDir, 'components', relPath);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // A. Fix core imports: '../config', '../hooks', '../utils', '../services', '../i18n', '../store' -> '../../folder'
    // NOTE: Avoid double checking by ensuring only ONE `..`
    const coreTargets = ['config', 'hooks', 'utils', 'services', 'i18n', 'store', 'components']; // Added components if any went back up
    coreTargets.forEach(target => {
      // Look strictly for '../config/...' not '../../config'
      const regex = new RegExp(`from\\s+['"]\\.\\.\\/${target}(\\/[^'"]*)?['"]`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '../../${target}$1'`);
        changed = true;
      }
    });

    // B. Fix inter-component imports between siblings that moved at root
    // Example: import { Avatar } from './Avatar' inside Leaderboard
    Object.keys(compFolders).forEach(comp => {
      const targetFolder = compFolders[comp];
      const regex = new RegExp(`from\\s+['"]\\.\\/${comp}['"]`, 'g');
      if (regex.test(content)) {
         // Is the current file in the same target folder?
         const currentFolder = relPath.split('/')[0];
         if (currentFolder === targetFolder) {
           // Keep './Comp'
         } else {
           content = content.replace(regex, `from '../${targetFolder}/${comp}'`);
           changed = true;
         }
      }
    });

    // C. Fix specific UI/Store imports: 
    // Example Settings.jsx was importing from './ui/ToggleSwitch', now should be '../ui/ToggleSwitch'
    ['ui', 'store', 'dashboard'].forEach(folder => {
        const regexDir = new RegExp(`from\\s+['"]\\.\\/${folder}\\/([^'"]*)['"]`, 'g');
        if (regexDir.test(content)) {
            // Note Avatar is in UI, so if it's inside UI, it remains './'
            const currentFolder = relPath.split('/')[0];
            if (currentFolder !== folder) {
               content = content.replace(regexDir, `from '../${folder}/$1'`);
               changed = true;
            }
        }
    });

    if (changed) {
      fs.writeFileSync(file, content);
      console.log('Fixed imports in', relPath);
    }
  } else {
    console.error('Moved file not found:', file);
  }
});

console.log('Done refactoring imports!');
