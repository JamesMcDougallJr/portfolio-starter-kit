'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BlogError({
  error,
  reset,
}: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error('Blog error:', error)
  }, [error])

  return (
    <section className="bg-card border border-red-200 dark:border-red-800 rounded-lg p-12 shadow-md text-center">
      <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
        Failed to load blog posts
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        There was an error loading the blog posts. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-block px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
      >
        Retry
      </button>
    </section>
  )
}
