import Link from 'next/link'
import { sanityFetch } from '@/sanity/sanity.client'
import { postsQuery } from '@/sanity/lib/queries'
import type { PostListItem } from '@/sanity/lib/types'

function formatDate(dateString: string, includeRelative = true): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) return formatted

  let relative: string
  if (diffDays === 0) relative = 'today'
  else if (diffDays === 1) relative = 'yesterday'
  else if (diffDays < 7) relative = `${diffDays}d ago`
  else if (diffDays < 30) relative = `${Math.floor(diffDays / 7)}w ago`
  else if (diffDays < 365) relative = `${Math.floor(diffDays / 30)}mo ago`
  else relative = `${Math.floor(diffDays / 365)}y ago`

  return `${formatted} (${relative})`
}

export async function BlogPosts(): Promise<JSX.Element> {
  const posts = await sanityFetch<PostListItem[]>(postsQuery)

  if (!posts || posts.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        No posts yet. Check back soon!
      </p>
    )
  }

  return (
    <div className="space-y-4" role="list" aria-label="Blog posts">
      {posts.map((post) => (
        <article key={post._id} role="listitem">
          <Link
            href={`/blog/${post.slug.current}`}
            className="group block"
            aria-label={`Read: ${post.title}`}
          >
            <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-6 transition-all duration-300 hover-lift hover:border-accent shadow-sm hover:shadow-accent">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <time
                  className="text-sm text-slate-500 dark:text-slate-400 tabular-nums w-[100px]"
                  dateTime={post.publishedAt}
                >
                  {formatDate(post.publishedAt, false)}
                </time>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-color transition-colors duration-200 flex-1">
                  {post.title}
                </h3>
              </div>
              {post.summary && (
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm line-clamp-2">
                  {post.summary}
                </p>
              )}
              <div className="mt-3 flex items-center text-primary-color text-sm font-medium group-hover:text-accent transition-colors">
                Read more <span aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        </article>
      ))}
    </div>
  )
}
