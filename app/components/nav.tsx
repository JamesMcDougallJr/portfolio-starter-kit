'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

const navItems = {
  '/': {
    name: 'home',
  },
  '/blog': {
    name: 'blog',
  },
  '/tutoring': {
    name: 'tutoring',
  },
  '/map': {
    name: 'map',
  },
}

function FlameIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nav-flame-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#nav-flame-gradient)"
      />
      <path
        d="M16 8c0 0-2 3-2 7 0 1.5 1 3 2 3s2-1.5 2-3c0-4-2-7-2-7z"
        fill="#fbbf24"
        opacity="0.8"
      />
    </svg>
  )
}

export function Navbar(): JSX.Element {
  const pathname = usePathname()

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <aside className="-ml-[8px] mb-16 tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-center justify-between px-4 py-3 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm"
          id="nav"
          aria-label="Main navigation"
        >
          <div className="flex flex-row items-center space-x-0" role="list">
            <Link
              href="/"
              className="mr-2 p-1 transition-all duration-200 flame-glow hover:scale-110"
              aria-label="Home"
            >
              <FlameIcon />
            </Link>
            {Object.entries(navItems).map(([path, { name }]) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  href={path}
                  className={`transition-all hover:text-primary-color hover:scale-105 duration-200 flex align-middle relative py-1 px-2 m-1 ${active
                    ? 'text-primary-color font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                    }`}
                  aria-current={active ? 'page' : undefined}
                  role="listitem"
                >
                  {name}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-color rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </aside>
  )
}
