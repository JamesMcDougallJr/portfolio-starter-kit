import { PortableText, PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { client } from '@/sanity/sanity.client'
import type { PortableTextBlock, ImageAsset } from 'sanity'

const builder = imageUrlBuilder(client)

function urlFor(source: ImageAsset) {
  return builder.image(source)
}

interface CodeBlock {
  _type: 'code'
  language?: string
  code: string
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: ImageAsset; alt?: string } }) => {
      if (!value?.asset) return null
      return (
        <figure className="my-8">
          <Image
            src={urlFor(value.asset).width(800).url()}
            alt={value.alt ?? 'Blog image'}
            width={800}
            height={450}
            className="rounded-lg"
          />
        </figure>
      )
    },
    code: ({ value }: { value: CodeBlock }) => {
      return (
        <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto my-6">
          <code className={`language-${value.language ?? 'text'} text-sm`}>
            {value.code}
          </code>
        </pre>
      )
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic my-6">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      const isExternal = href.startsWith('http')
      return (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {children}
        </a>
      )
    },
    code: ({ children }) => (
      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
}

interface BlogPortableTextProps {
  content: PortableTextBlock[]
}

export function BlogPortableText({ content }: BlogPortableTextProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <PortableText value={content} components={components} />
    </div>
  )
}
