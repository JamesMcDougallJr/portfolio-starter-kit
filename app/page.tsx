import { BlogPosts } from 'app/components/posts'
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from './components/loading-spinner'

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
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          James McDougall
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Software Engineer & Problem Solver
        </p>
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
