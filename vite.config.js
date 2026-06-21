/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Native (Capacitor) builds set NATIVE_BUILD=true: the RevenueCat *web* SDK is
// never executed on native, so we alias it to a tiny stub to keep ~626 KB out of
// the Android APK. Web/PWA builds leave it untouched.
const NATIVE_BUILD = process.env.NATIVE_BUILD === 'true';

// Load path aliases from the single source of truth
const pathsConfig = JSON.parse(
  readFileSync(resolve(__dirname, 'jsconfig.paths.json'), 'utf-8')
);
const paths = pathsConfig.compilerOptions.paths;

const aliases = {};
for (const [key, value] of Object.entries(paths)) {
  const aliasKey = key.replace('/*', '');
  const aliasValue = value[0].replace('/*', '');
  aliases[aliasKey] = aliasValue.replace(/^\./, '');
}

if (NATIVE_BUILD) {
  aliases['@revenuecat/purchases-js'] = '/src/services/revenuecatWebStub.js';
}

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
    alias: aliases
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Heavy, feature-specific vendor chunks are loaded on demand (purchase
        // flow, stats charts, maps, admin). Keeping them OUT of the precache
        // manifest avoids eagerly downloading ~1 MB on a visitor's FIRST load
        // for features many users never open. The runtimeCaching rule below
        // still caches each chunk after its first real use, so offline keeps
        // working once a feature has been visited.
        globIgnores: [
          '**/revenuecat-web-vendor-*.js',
          '**/charts-vendor-*.js',
          '**/map-vendor-*.js',
          '**/AdminPanel-*.js'
        ],
        runtimeCaching: [
          {
            // Filenames are content-hashed (immutable) → CacheFirst is safe and
            // avoids a revalidation round-trip on every load.
            urlPattern: /\/assets\/(revenuecat-web-vendor|charts-vendor|map-vendor|AdminPanel)-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'on-demand-vendors',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
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
    exclude: ['e2e/**', 'node_modules/**', 'firebase/functions/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/**/__tests__/**',
        'src/main.jsx',
        'src/i18n/**',
        'src/**/*.module.css',
        // ── Pure presentational UI (excluded from the coverage target) ──
        // Coverage focuses on LOGIC (hooks, services, stores, utils, config,
        // contexts, orchestration). Purely presentational components — layout,
        // styling, charts, maps, modals — are out of scope: they carry little
        // branching logic and are better validated by the e2e suite.
        'src/App.jsx',
        'src/components/Dashboard.jsx',
        'src/components/admin/AdminPanel.jsx',
        'src/components/admin/AdminJsonSectionsEditor.jsx',
        'src/components/admin/AdminUserForm.jsx',
        'src/components/admin/AdminUserList.jsx',
        'src/components/admin/JsonTreeEditor.jsx',
        'src/components/admin/LineNumberTextarea.jsx',
        'src/components/dashboard/DashboardHeader.jsx',
        'src/components/dashboard/DashboardModals.jsx',
        'src/components/dashboard/DashboardSlide.jsx',
        'src/components/dashboard/DashboardSlideRenderer.jsx',
        'src/components/dashboard/ProPaywall.jsx',
        'src/components/dashboard/SessionBubble.jsx',
        'src/components/exercises/ExercisePanel.jsx',
        'src/components/exercises/CategoryManagerModal.jsx',
        'src/components/exercises/CustomExercisesModal.jsx',
        'src/components/exercises/SessionSummary.jsx',
        'src/components/exercises/WorkoutSession.jsx',
        'src/components/exercises/panel/**',
        'src/components/feedback/CSSConfetti.jsx',
        'src/components/settings/**',
        'src/components/social/ClanInviteCard.jsx',
        'src/components/social/ClanManager.jsx',
        'src/components/social/Leaderboard.jsx',
        'src/components/social/LeaderboardPodium.jsx',
        'src/components/social/LeaderboardRow.jsx',
        'src/components/social/LeaderboardTabs.jsx',
        'src/components/social/NotificationManager.jsx',
        'src/components/social/UserDetail.jsx',
        // Stats views are charts/calendars/cards — presentational viz. The
        // underlying stats computation lives in src/utils/stats.js & statUtils.js
        // (both fully covered).
        'src/components/stats/**',
        'src/components/feedback/Achievements.jsx',
        'src/components/dashboard/CategoryNav.jsx',
        'src/components/dashboard/DashboardNavBar.jsx',
        'src/components/store/StoreCard.jsx',
        'src/components/ui/AnimatedNumber.jsx',
        'src/features/announcements/AnnouncementOverlay.jsx',
        'src/features/cardio/Cardio*.jsx',
        'src/features/share/components/**',
      ],
      // Thresholds enforced on the LOGIC scope (pure UI excluded above).
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})
