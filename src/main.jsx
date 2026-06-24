import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'
import App from './App.jsx'
import { ErrorBoundary } from'@components/core/ErrorBoundary.jsx'
// Instantiate the cardio providers at startup so their native listeners
// (notably Strava's appUrlOpen + getLaunchUrl OAuth-return recovery) are
// registered before any OAuth redirect can reach the app.
import '@services/cardioProviders'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </StrictMode>,
)
