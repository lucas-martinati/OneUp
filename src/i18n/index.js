import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const savedLang = localStorage.getItem('oneup_language');

// Custom backend to load translations dynamically with Vite
const lazyLoadBackend = {
  type: 'backend',
  read(language, namespace, callback) {
    import(`./locales/${language}.json`)
      .then((resources) => {
        callback(null, resources.default || resources);
      })
      .catch((error) => {
        console.error(`Error loading language ${language}:`, error);
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
