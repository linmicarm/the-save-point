/**
 * Sentry — browser error & performance monitoring.
 *
 * Called once from main.jsx before the React tree mounts.
 * Gracefully no-ops when VITE_SENTRY_DSN is not set (local dev, CI).
 *
 * To enable: add VITE_SENTRY_DSN=<your-dsn> to client/.env.local
 * Get a free DSN at https://sentry.io (Hobby plan is free forever).
 */

import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,          // 'development' or 'production'
    integrations: [
      Sentry.browserTracingIntegration(),        // page-load / navigation timing
    ],
    // Capture 10 % of transactions — enough for performance insights without cost
    tracesSampleRate: 0.1,
    // Don't send errors from localhost
    beforeSend(event) {
      if (window.location.hostname === 'localhost') return null
      return event
    },
  })
}
