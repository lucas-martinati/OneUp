// Résolution des alias Vite (@components, @services, …) pour madge.
// madge/filing-cabinet lit les alias via une config façon webpack pour les fichiers JS/JSX.
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
};
