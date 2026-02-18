import React from 'react'
import ReactDOM from 'react-dom/client'

// Initialize Sentry FIRST, before any other imports
// This ensures all errors are captured, including during app initialization
import { initSentry } from '@/config/sentry'
initSentry()

import { initCapacitor } from '@/lib/capacitor-init'
import App from '@/App.jsx'
import '@/index.css'

// Initialize Capacitor native plugins (no-op on web)
initCapacitor()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
