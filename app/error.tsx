'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <section className="bg-card border border-red-200 dark:border-red-800 rounded-lg p-12 shadow-md text-center">
      <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
        Something went wrong!
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="space-x-4">
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-block px-6 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200 font-medium"
        >
          Return Home
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 text-left">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Error details
          </summary>
          <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </section>
  )
}
