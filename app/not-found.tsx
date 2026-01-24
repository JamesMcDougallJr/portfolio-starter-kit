import Link from 'next/link'

function DimmedFlame() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      className="opacity-30"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dimmed-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#dimmed-flame-gradient)"
      />
      <path
        d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
        fill="#fbbf24"
        opacity="0.5"
      />
    </svg>
  )
}

export default function NotFound(): JSX.Element {
  return (
    <section className="bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-12 shadow-md text-center">
      <div className="mb-4 flex justify-center">
        <DimmedFlame />
      </div>
      <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        404
      </h1>
      <h2 className="mb-4 text-2xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100">
        Page Not Found
      </h2>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        This page has burned away into the void.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
      >
        Return Home
      </Link>
    </section>
  )
}
