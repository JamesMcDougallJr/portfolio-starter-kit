import Link from 'next/link'
import type { Metadata } from 'next'
import { projects } from './project-data'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Open source projects and tools by James McDougall.',
}

const categoryColors: Record<string, string> = {
  core: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  ai: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  infrastructure:
    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  testing:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
}

export default function ProjectsPage(): JSX.Element {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Projects
      </h1>
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-lg transition-all duration-300 hover-lift"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.title}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {project.status}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 5).map((tech) => (
                <span
                  key={tech.name}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[tech.category] ?? ''}`}
                >
                  {tech.name}
                </span>
              ))}
              {project.techStack.length > 5 && (
                <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5">
                  +{project.techStack.length - 5} more
                </span>
              )}
            </div>
            <span className="absolute bottom-4 right-4 text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
