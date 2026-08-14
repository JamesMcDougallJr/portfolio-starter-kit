import Link from 'next/link'
import type { Metadata } from 'next'
import { agents } from './agent-data'

export const metadata: Metadata = {
  title: 'Agents',
  description: 'AI agents built and hosted by James McDougall.',
}

const typeColors: Record<string, string> = {
  'prompt-driven':
    'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  automated:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
}

const typeLabels: Record<string, string> = {
  'prompt-driven': 'Prompt-driven',
  automated: 'Automated',
}

export default function AgentsPage(): JSX.Element {
  return (
    <section>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Agents
      </h1>
      <div className="grid grid-cols-1 gap-6">
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            href={`/agents/${agent.slug}`}
            className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-lg transition-all duration-300 hover-lift"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {agent.name}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {agent.status}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {agent.description}
            </p>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[agent.type] ?? ''}`}
            >
              {typeLabels[agent.type] ?? agent.type}
            </span>
            <span className="absolute bottom-4 right-4 text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
