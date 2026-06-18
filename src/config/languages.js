/**
 * Supported UI languages, with their native display names.
 * Shared by the Settings language selector and the onboarding switcher so the
 * list stays in one place.
 */
export const LANGUAGES = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'ru', label: 'Русский' },
];

/** Resolve an i18n language tag (e.g. "fr-FR") to a supported language code. */
export function resolveLanguageCode(lang) {
    const code = (lang || 'en').toLowerCase().split('-')[0];
    return LANGUAGES.some(l => l.code === code) ? code : 'en';
}
