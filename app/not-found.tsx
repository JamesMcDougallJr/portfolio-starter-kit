import Link from 'next/link'

export default function NotFound(): JSX.Element {
  return (
    <section className="bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-12 shadow-md text-center">
      <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        404
      </h1>
      <h2 className="mb-4 text-2xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100">
        Page Not Found
      </h2>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        The page you are looking for does not exist.
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
