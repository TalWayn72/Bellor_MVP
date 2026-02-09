import React from 'react'
import ReactDOM from 'react-dom/client'

// Initialize Sentry FIRST, before any other imports
// This ensures all errors are captured, including during app initialization
import { initSentry } from '@/config/sentry'
initSentry()

import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
