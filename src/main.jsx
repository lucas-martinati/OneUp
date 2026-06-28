import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'
import App from './App.jsx'
import { ErrorBoundary } from'@components/core/ErrorBoundary.jsx'
// Cardio providers (Strava, HealthConnect, Google Health) register native
// OAuth listeners (appUrlOpen, getLaunchUrl). Loaded via microtask to stay
// off the synchronous import chain while still resolving before any user
// interaction or OAuth deep-link redirect can reach the app.
Promise.resolve().then(() => import('@services/cardioProviders'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </StrictMode>,
)
