/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Native (Capacitor) builds set NATIVE_BUILD=true: the RevenueCat *web* SDK is
// never executed on native, so we alias it to a tiny stub to keep ~626 KB out of
// the Android APK. Web/PWA builds leave it untouched.
const NATIVE_BUILD = process.env.NATIVE_BUILD === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/OneUp/' : '/',
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps) {
        // Keep non-critical vendors out of the initial modulepreload so they
        // don't compete with first-paint resources. Firebase is booted lazily
        // (only for returning/signing-in users) and the app renders local data
        // first, so deferring its chunk doesn't delay perceived load.
        const DEFERRED = ['map-vendor', 'capacitor-vendor', 'firebase-vendor'];
        return deps.filter(dep => !DEFERRED.some(name => dep.includes(name)));
      }
    },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'preload-helper';
          if (id.includes('node_modules')) {
            // Specific packages first: the generic react matcher below would
            // otherwise swallow lucide-react, react-leaflet, react-easy-crop…
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('@revenuecat/purchases-js')) return 'revenuecat-web-vendor';
            if (id.includes('@revenuecat/purchases-capacitor')) return 'revenuecat-native-vendor';
            if (id.includes('@capacitor')) return 'capacitor-vendor';
            if (id.includes('recharts') || id.includes('d3')) return 'charts-vendor';
            if (id.includes('lucide-react')) return 'ui-vendor';
            if (id.includes('leaflet')) return 'map-vendor';
            if (id.includes('react-easy-crop') || id.includes('tslib')) return 'crop-vendor';
            if (id.includes('i18next')) return 'i18n-vendor';
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      // Strip the RevenueCat web SDK from native builds (see NATIVE_BUILD above).
      ...(NATIVE_BUILD ? { '@revenuecat/purchases-js': '/src/services/revenuecatWebStub.js' } : {}),
      '@components': '/src/components',
      '@config': '/src/config',
      '@contexts': '/src/contexts',
      '@hooks': '/src/hooks',
      '@features': '/src/features',
      '@services': '/src/services',
      '@utils': '/src/utils',
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'OneUp : Le Défi Fitness Ultime',
        short_name: 'OneUp',
        description: 'Un défi fitness progressif sur 365 jours pour bâtir la discipline. Suivez votre progression et transformez votre corps.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    watch: {
      ignored: [
        '**/android/**',
        '**/ios/**',
        '**/node_modules/**',
      ]
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'functions/**', 'dist/**']
  }
})
