/** @type {import('knip').KnipConfig} */
const config = {
  ignore: [
    "functions/index.js",
    "src/components/index.js",
    "src/components/*/index.js",
    "src/services/*Service.js"
  ],
  ignoreDependencies: [
    "@capacitor/android", // Indispensable pour GitHub Actions
    "googleapis", // Installé à la volée dans GitHub Actions
    "@capacitor/assets",
    "@testing-library/react",
    "i18next-parser",
    "playwright"
  ],
  ignoreBinaries: ["firebase-tools"]
};

export default config;