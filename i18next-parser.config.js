// i18next-parser.config.js
export default {
  locales: ['fr', 'en', 'ru', 'zh', 'es'],
  output: 'src/i18n/locales/$LOCALE.json',
  input: ['src/**/*.{js,jsx,ts,tsx}'],
  keySeparator: '.',
  defaultValue: (locale, namespace, key) => key,
  keepRemoved: true, 
}