'use client'

import { useEffect } from 'react'

export function ErrorMonitor(): null {
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      // Send to error monitoring service (e.g., Sentry) in production
    }

    // Unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      // Send to error monitoring service in production
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
