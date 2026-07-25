/**
 * App root — mounts engines as singletons, applies theme, initializes router.
 * See docs/08-engines.md: "Engines are plain TypeScript singletons instantiated
 * once at app start (src/main.tsx)".
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { AppRouter } from './router'
import './styles/globals.css'
import { timerEngine } from './engines/timer-engine'
import { reminderEngine } from './engines/reminder-engine'

// Auto-update service worker immediately to clear stale cached JS chunks
registerSW({ immediate: true })

// Initialize engines as singletons before React renders
void timerEngine.initialize()
void reminderEngine.initialize()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
