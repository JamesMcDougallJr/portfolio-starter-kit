import { sanityFetch } from '@/sanity/sanity.client'
import { postsQuery } from '@/sanity/lib/queries'
import type { PostListItem } from '@/sanity/lib/types'

export const baseUrl = 'https://jamesmcdougalljr.com'

export const revalidate = 86400

export default async function sitemap() {
  const posts = await sanityFetch<PostListItem[]>(postsQuery)

  const blogs = (posts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug.current}`,
    lastModified: post.publishedAt,
  }))

  const routes = ['', '/blog', '/map', '/tutoring'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
