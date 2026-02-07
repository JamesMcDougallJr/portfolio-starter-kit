'use client'

import { usePathname } from 'next/navigation'
import Footer from './footer'

export function ConditionalFooter(): JSX.Element | null {
  const pathname = usePathname()

  // Hide footer on map pages (full-screen layout)
  if (pathname.startsWith('/map')) {
    return null
  }

  return <Footer />
}
