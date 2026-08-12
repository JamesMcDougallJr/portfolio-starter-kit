import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { agents, getAgent } from '../agent-data'
import { AgentChat } from './agent-chat'
import { DentalSchedulerAdmin } from './dental-scheduler-admin'
import { DentalSchedulerChat } from './dental-scheduler-chat'

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

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }))
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) return { title: 'Agent Not Found' }

  return {
    title: agent.name,
    description: agent.description,
  }
}

export default async function AgentPage({ params }: { params: Params }) {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) notFound()

  return (
    <section>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {agent.name}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {agent.status}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[agent.type] ?? ''}`}
          >
            {typeLabels[agent.type] ?? agent.type}
          </span>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {agent.description}
        </p>
      </div>

      {agent.kind === 'dental-scheduler' ? (
        <div className="space-y-6">
          <DentalSchedulerAdmin agent={agent} />
          <DentalSchedulerChat agent={agent} />
        </div>
      ) : (
        <AgentChat agent={agent} />
      )}
    </section>
  )
}
