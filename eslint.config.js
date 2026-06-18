import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'

// SonarJS en mode informatif : toutes les règles recommandées passent en "warn"
// pour ne pas bloquer `npm run lint`. À nettoyer progressivement, puis promouvoir
// les règles voulues en "error".
// On ne dégrade que les règles réellement actives dans "recommended" ; celles
// désactivées par défaut (file-header, conventions de style, complexité…) restent off.
const sonarjsWarnings = Object.fromEntries(
  Object.entries(sonarjs.configs.recommended.rules)
    .filter(([, level]) => (Array.isArray(level) ? level[0] : level) !== 'off')
    .map(([rule]) => [rule, 'warn']),
)

export default defineConfig([
  globalIgnores(['dist', 'android/**', 'ios/**', 'coverage/**', 'node_modules/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-undef': 'error',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // SonarJS — détection de code spaghetti (code mort, duplication, bugs).
  // Scopé à src/, en "warn". Complexité et règles hors-sujet désactivées.
  {
    ...sonarjs.configs.recommended,
    files: ['src/**/*.{js,jsx}'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      ...sonarjsWarnings,
      // Complexité : choix volontaire de ne pas l'imposer.
      'sonarjs/cognitive-complexity': 'off',
      // Sécurité/tests : hors sujet pour la chasse au spaghetti.
      'sonarjs/pseudo-random': 'off',
      'sonarjs/prefer-specific-assertions': 'off',
      'sonarjs/assertions-in-tests': 'off',
    },
  },
  // Exceptions for React Fast Refresh (Contexts, paired hooks, and bundled portable components)
  {
    files: ['**/contexts/**/*.{js,jsx}', '**/hooks/**/*.{js,jsx}', '**/features/events/Day100Event.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Node.js files (Cloud Functions, build scripts)
  {
    files: ['functions/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Test files (vitest globals)
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  // E2E Playwright test files
  {
    files: ['e2e/**/*.{js,jsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
])
