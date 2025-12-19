import Link from 'next/link'
import { formatDate, getBlogPosts } from 'app/blog/utils'

export function BlogPosts(): JSX.Element {
  const allBlogs = getBlogPosts()

  return (
    <div className="space-y-4" role="list" aria-label="Blog posts">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post) => (
          <article key={post.slug} role="listitem">
            <Link
              href={`/blog/${post.slug}`}
              className="group block"
              aria-label={`Read: ${post.metadata.title}`}
            >
              <div className="bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-6 transition-all duration-300 hover-lift hover:border-accent shadow-sm hover:shadow-accent">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <time
                    className="text-sm text-slate-500 dark:text-slate-400 tabular-nums w-[100px]"
                    dateTime={post.metadata.publishedAt}
                  >
                    {formatDate(post.metadata.publishedAt, false)}
                  </time>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-color transition-colors duration-200 flex-1">
                    {post.metadata.title}
                  </h3>
                </div>
                {post.metadata.summary && (
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm line-clamp-2">
                    {post.metadata.summary}
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
