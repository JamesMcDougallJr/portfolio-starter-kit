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
  '/map': {
    name: 'map',
  },
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
          <div className="flex flex-row space-x-0" role="list">
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
