import { BlogPosts } from 'app/components/posts'
import { ObjectDetectionPlayer } from './components/object_detector/object_detection_player'

export default function Page() {
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
          <BlogPosts />
        </div>
      </section>

      <section className="mt-8">
        <ObjectDetectionPlayer />
      </section>
    </>
  )
}
