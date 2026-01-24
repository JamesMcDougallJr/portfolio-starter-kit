'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function WarningFlame() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 32 32"
      className="opacity-60"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="warning-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#warning-flame-gradient)"
      />
      <path
        d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
        fill="#fef08a"
        opacity="0.8"
      />
    </svg>
  )
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <section className="bg-card border border-red-200 dark:border-red-800 rounded-lg p-12 shadow-md text-center">
      <div className="mb-4 flex justify-center">
        <WarningFlame />
      </div>
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
