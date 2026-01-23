import { baseUrl } from 'app/sitemap'
import { sanityFetch } from '@/sanity/sanity.client'
import { postsQuery } from '@/sanity/lib/queries'
import type { PostListItem } from '@/sanity/lib/types'

export const revalidate = 3600

export async function GET() {
  const posts = await sanityFetch<PostListItem[]>(postsQuery)

  const itemsXml = (posts ?? [])
    .map(
      (post) =>
        `<item>
          <title>${escapeXml(post.title)}</title>
          <link>${baseUrl}/blog/${post.slug.current}</link>
          <description>${escapeXml(post.summary ?? '')}</description>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        </item>`
    )
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>James McDougall</title>
        <link>${baseUrl}</link>
        <description>James McDougall's blog RSS feed</description>
        ${itemsXml}
    </channel>
  </rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
