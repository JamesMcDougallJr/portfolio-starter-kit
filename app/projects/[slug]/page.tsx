import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { projects, getProject } from '../project-data'

const categoryColors: Record<string, string> = {
  core: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  ai: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  infrastructure:
    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  testing:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
}

const categoryLabels: Record<string, string> = {
  core: 'Core',
  ai: 'AI & ML',
  infrastructure: 'Infrastructure',
  testing: 'Testing',
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }))
}

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const project = getProject(params.slug)
  if (!project) return { title: 'Project Not Found' }

  return {
    title: project.title,
    description: project.description,
  }
}

export default function ProjectPage({
  params,
}: {
  params: { slug: string }
}): JSX.Element {
  const project = getProject(params.slug)
  if (!project) notFound()

  const groupedTech = project.techStack.reduce(
    (acc, tech) => {
      const group = acc[tech.category] ?? []
      group.push(tech)
      acc[tech.category] = group
      return acc
    },
    {} as Record<string, typeof project.techStack>
  )

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {project.title}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {project.status}
          </span>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
          {project.description}
        </p>
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          View on GitHub
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Overview */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Overview
        </h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {project.overview}
        </p>
      </div>

      {/* Key Features */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.features.map((feature) => (
            <div
              key={feature.title}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
            >
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Tech Stack
        </h2>
        <div className="space-y-4">
          {Object.entries(groupedTech).map(([category, techs]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                {categoryLabels[category] ?? category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <span
                    key={tech.name}
                    className={`text-sm font-medium px-3 py-1 rounded-full ${categoryColors[tech.category] ?? ''}`}
                  >
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
