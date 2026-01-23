import { notFound } from 'next/navigation'
import { sanityFetch, isSanityConfigured } from '@/sanity/sanity.client'
import { postBySlugQuery, postSlugsQuery } from '@/sanity/lib/queries'
import { BlogPortableText } from '@/app/components/portable-text'
import { baseUrl } from 'app/sitemap'
import type { Metadata } from 'next'
import type { Post } from '@/sanity/lib/types'

export const revalidate = 3600

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (!isSanityConfigured) return []
  const slugs = await sanityFetch<{ slug: string }[]>(postSlugsQuery)
  return slugs?.map((item) => ({ slug: item.slug })) ?? []
}

type Params = Promise<{ slug: string }>

interface PageProps {
  params: Params
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata | undefined> {
  const { slug } = await params
  const post = await sanityFetch<Post>(postBySlugQuery, { slug })

  if (!post) return

  const ogImage = `${baseUrl}/og?title=${encodeURIComponent(post.title)}`

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.publishedAt,
      url: `${baseUrl}/blog/${post.slug.current}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [ogImage],
    },
  }
}

export default async function Blog({
  params,
}: PageProps): Promise<JSX.Element> {
  const { slug } = await params
  const post = await sanityFetch<Post>(postBySlugQuery, { slug })

  if (!post) {
    notFound()
  }

  return (
    <section className="bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-8 shadow-md">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            description: post.summary,
            image: `/og?title=${encodeURIComponent(post.title)}`,
            url: `${baseUrl}/blog/${post.slug.current}`,
            author: {
              '@type': 'Person',
              name: 'James McDougall',
            },
          }),
        }}
      />
      <h1 className="title font-semibold text-3xl tracking-tighter mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        {post.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(post.publishedAt)}
        </p>
      </div>
      <article className="prose dark:prose-invert max-w-none">
        <BlogPortableText content={post.body} />
      </article>
    </section>
  )
}
