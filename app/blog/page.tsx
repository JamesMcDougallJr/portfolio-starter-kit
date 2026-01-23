import { BlogPosts } from 'app/components/posts'

export const revalidate = 3600 // Revalidate every hour

export const metadata = {
  title: 'Articles',
  description: 'Read my blog.',
}

export default async function Page() {
  return (
    <section>
      <h1 className="font-semibold text-3xl mb-8 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Things to know
      </h1>
      <BlogPosts />
    </section>
  )
}
