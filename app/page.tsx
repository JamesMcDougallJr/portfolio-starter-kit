import { BlogPosts } from 'app/components/posts'
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from './components/loading-spinner'
import { siteConfig } from './lib/seo'
import { baseUrl } from './sitemap'

const ObjectDetectionPlayer = lazy(
  () =>
    import('./components/object_detector/object_detection_player').then(
      (mod) => ({
        default: mod.ObjectDetectionPlayer,
      })
    )
)

export default function Page(): JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: siteConfig.name,
            url: baseUrl,
            jobTitle: 'Software Engineer & AI Builder',
            description: `Software engineer in the defense industry building AI-powered solutions in ${siteConfig.location.region}. Helping businesses integrate AI and preparing students at the intersection of language, history, and technology.`,
            sameAs: [siteConfig.social.linkedin, siteConfig.social.github],
            knowsAbout: [
              'Software Engineering',
              'Artificial Intelligence',
              'Defense Technology',
              'Web Development',
              'Education',
            ],
            address: {
              '@type': 'PostalAddress',
              addressLocality: siteConfig.location.city,
              addressRegion: siteConfig.location.region,
              addressCountry: siteConfig.location.country,
            },
          }),
        }}
      />
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          James McDougall
        </h1>
        <p className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-4">
          Building AI for Defense, Business & Education
        </p>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          I&apos;m a software engineer in the defense industry building
          AI-powered solutions. Beyond my work
          in defense, I help small businesses integrate AI into their workflows
          in practical ways, and tutor students in computer science, history,
          and English—developing well-rounded critical thinkers ready to make an
          impact.
        </p>
      </section>

      {/* Service Cards */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="https://calendly.com/jamesmcdougalljr/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                AI for Business
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Practical AI integration for small businesses
              </p>
            </div>
          </div>
          <span className="absolute bottom-4 right-4 text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Book a call →
          </span>
        </a>

        <a
          href="/tutoring"
          className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Tutoring
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Computer Science, History & English
              </p>
            </div>
          </div>
          <span className="absolute bottom-4 right-4 text-sm text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Learn more →
          </span>
        </a>
      </section>

      <section className="relative mt-8">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl -z-10" />
        <div className="relative p-8">
          <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
            Recent Posts
          </h2>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="md" />
              </div>
            }
          >
            <BlogPosts />
          </Suspense>
        </div>
      </section>

      <section className="mt-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12 bg-card border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex flex-col items-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Loading object detection model...
                </p>
              </div>
            </div>
          }
        >
          <ObjectDetectionPlayer />
        </Suspense>
      </section>
    </>
  )
}
