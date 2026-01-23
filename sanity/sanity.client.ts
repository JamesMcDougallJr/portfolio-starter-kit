import { createClient, type SanityClient, type QueryParams } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export const isSanityConfigured =
  projectId !== '' &&
  projectId !== 'your-project-id' &&
  !projectId.includes('your-')

const clientConfig = {
  projectId: isSanityConfigured ? projectId : 'placeholder',
  dataset,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
}

export const client: SanityClient = createClient(clientConfig)

export async function sanityFetch<T>(
  query: string,
  params?: QueryParams
): Promise<T | null> {
  if (!isSanityConfigured) {
    return null
  }
  if (params) {
    return client.fetch<T>(query, params)
  }
  return client.fetch<T>(query)
}
