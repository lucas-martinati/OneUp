// Résolution des alias Vite (@components, @services, …) pour madge.
// madge/filing-cabinet lit les alias via une config façon webpack pour les fichiers JS/JSX.
const fs = require('fs');
const path = require('path');

const pathsConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../jsconfig.paths.json'), 'utf-8')
);
const paths = pathsConfig.compilerOptions.paths;

const alias = {};
for (const [key, value] of Object.entries(paths)) {
  const aliasKey = key.replace('/*', '');
  const aliasValue = value[0].replace('/*', '');
  alias[aliasKey] = path.resolve(__dirname, '..', aliasValue);
}

module.exports = {
  resolve: {
    alias,
    extensions: ['.js', '.jsx', '.json'],
  },
};
