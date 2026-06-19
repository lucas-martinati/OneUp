/** @type {import('knip').KnipConfig} */
const config = {
  ignore: [
    "firebase/functions/index.js",
    "firebase/functions/shared/badgeRules.js",
    "firebase/functions/shared/exerciseRules.js",
    "firebase/functions/shared/dbSchema.js",
    "src/components/index.js",
    "src/components/*/index.js",
    "src/services/*Service.js",
    "src/services/revenuecatWebStub.js",
    "coverage/**",
    "scratch/**",
    "scripts/**",
    "scripts/madge-resolve.config.cjs",
    "e2e/**"
  ],
  ignoreDependencies: [
    "@capacitor/android", // Indispensable pour GitHub Actions
    "googleapis", // Installé à la volée dans GitHub Actions
    "@capacitor/assets",
    "@testing-library/react",
    "playwright"
  ],
  ignoreBinaries: ["firebase-tools"]
};

export default config;