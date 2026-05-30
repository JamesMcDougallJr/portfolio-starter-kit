export interface ProjectFeature {
  title: string
  description: string
}

export interface TechItem {
  name: string
  category: 'core' | 'infrastructure' | 'ai' | 'testing'
}

export interface Project {
  slug: string
  title: string
  description: string
  overview: string
  features: ProjectFeature[]
  techStack: TechItem[]
  githubUrl: string
  status: 'Active' | 'Beta' | 'Archived'
}

export const projects: Project[] = [
  {
    slug: 'smollama',
    title: 'Smollama',
    description:
      'Distributed LLM coordination for resource-constrained devices',
    overview:
      'Smollama is a distributed AI agent system designed for resource-constrained devices like Raspberry Pi. It enables nodes to sense their environment through GPIO sensors and system metrics, remember observations with semantic search, think using local LLMs via Ollama, communicate with other nodes over MQTT, and sync data using conflict-free replicated data types (CRDTs) for seamless offline-first operation.',
    features: [
      {
        title: 'Sense',
        description:
          'Read GPIO sensors, system metrics, and environmental data from connected hardware.',
      },
      {
        title: 'Remember',
        description:
          'Store observations and memories in SQLite with vector embeddings for semantic search.',
      },
      {
        title: 'Think',
        description:
          'Process events using local LLMs via Ollama with a tool-based reasoning loop.',
      },
      {
        title: 'Communicate',
        description:
          'Share state with other nodes via MQTT for distributed coordination.',
      },
      {
        title: 'Sync',
        description:
          'Operate offline and merge data deterministically using append-only CRDT logs with Lamport timestamps.',
      },
      {
        title: 'Dashboard',
        description:
          'FastAPI web interface with HTMX for live monitoring and interaction.',
      },
    ],
    techStack: [
      { name: 'Python', category: 'core' },
      { name: 'FastAPI', category: 'core' },
      { name: 'SQLite', category: 'core' },
      { name: 'Ollama', category: 'ai' },
      { name: 'Vector Embeddings', category: 'ai' },
      { name: 'MQTT', category: 'infrastructure' },
      { name: 'CRDTs', category: 'infrastructure' },
      { name: 'Raspberry Pi', category: 'infrastructure' },
      { name: 'pytest', category: 'testing' },
    ],
    githubUrl: 'https://github.com/JamesMcDougallJr/smollama',
    status: 'Active',
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
