export type AgentType = 'prompt-driven' | 'automated'
export type AgentProvider = 'bedrock' | 'openai'

export interface AgentProviderOption {
  id: AgentProvider
  name: string
  requiresApiKey: boolean
}

export type AgentKind = 'chat' | 'dental-scheduler'

export interface Agent {
  slug: string
  name: string
  description: string
  type: AgentType
  status: 'Active' | 'Beta' | 'Archived'
  invokePath: string
  providers: AgentProviderOption[]
  kind: AgentKind
}

export const agents: Agent[] = [
  {
    slug: 'site-qa',
    name: 'Site Q&A',
    description:
      "Ask about James's tutoring, AI consulting, background, or how to get in touch.",
    type: 'prompt-driven',
    status: 'Active',
    invokePath: '/agent/invocations',
    providers: [
      { id: 'bedrock', name: 'Bedrock (default)', requiresApiKey: false },
      {
        id: 'openai',
        name: 'OpenAI (bring your own key)',
        requiresApiKey: true,
      },
    ],
    kind: 'chat',
  },
  {
    slug: 'dental-scheduler',
    name: 'Dental Scheduler',
    description:
      "Books dental appointments via Cedar Ridge's Scheduling API — built for a live interview challenge. Test it below as the patient, or hand the endpoint to an evaluator.",
    type: 'prompt-driven',
    status: 'Active',
    invokePath: '/api/dental-agent',
    providers: [],
    kind: 'dental-scheduler',
  },
]

export function getAgent(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug)
}
