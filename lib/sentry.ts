import * as Sentry from "@sentry/nextjs"

/**
 * Initialize Sentry for client-side error tracking
 * Automatically captures unhandled exceptions and performance metrics
 */
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      debug: false,
      beforeSend(event, hint) {
        // Filter out certain errors if needed
        if (event.exception) {
          const error = hint.originalException
          // Example: Don't send network errors from external APIs
          if (error instanceof Error && error.message.includes("Network")) {
            return null
          }
        }
        return event
      },
    })
  }
}

/**
 * Capture custom errors with additional context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

/**
 * Add breadcrumb for debugging user actions
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    level: "info",
    data,
  })
}