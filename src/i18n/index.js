import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const savedLang = localStorage.getItem('oneup_language');
const supportedLanguages = ['en', 'fr', 'es', 'zh', 'ru', 'de', 'it', 'pt', 'ja', 'ko'];

function resolveLanguage(language) {
  const languageOnly = language?.toLowerCase().split('-')[0];
  return supportedLanguages.includes(languageOnly) ? languageOnly : 'en';
}

// Custom backend to load translations dynamically with Vite
const lazyLoadBackend = {
  type: 'backend',
  read(language, namespace, callback) {
    const resolvedLanguage = resolveLanguage(language);

    import(`./locales/${resolvedLanguage}.json`)
      .then((resources) => {
        callback(null, resources.default || resources);
      })
      .catch((error) => {
        console.error(`Error loading language ${resolvedLanguage}:`, error);
        callback(error, null);
      });
  },
};

i18n
  .use(lazyLoadBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: savedLang || undefined,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oneup_language',
    },
  });

export default i18n;
