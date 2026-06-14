/** @type {import('knip').KnipConfig} */
const config = {
  ignore: [
    "functions/index.js",
    "src/components/index.js",
    "src/components/*/index.js",
    "src/services/*Service.js",
    "src/services/revenuecatWebStub.js", // Référencé via un alias Vite (NATIVE_BUILD), invisible pour knip
    "coverage/**",
    "scratch/**"
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