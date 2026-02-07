import './global.css'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import { ConditionalFooter } from './components/conditional-footer'
import { ThemeProvider } from './components/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ErrorMonitor } from './components/error-monitor'
import { defaultMetadata } from './lib/seo'

export const metadata = defaultMetadata

const cx = (...classes: (string | boolean | undefined)[]): string =>
  classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html
      lang="en"
      className={cx(
        GeistSans.variable,
        GeistMono.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme-preference') || 'system';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (theme === 'system' && systemDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors mt-8 lg:mx-auto">
        <ErrorMonitor />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-color text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <main
            id="main-content"
            className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0 max-w-4xl mx-auto"
          >
            <Navbar />
            {children}
            <ConditionalFooter />
          </main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
