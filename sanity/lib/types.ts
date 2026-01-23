import type { PortableTextBlock, ImageAsset } from 'sanity'

export interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  summary: string
  image?: {
    asset: ImageAsset
  }
  body: PortableTextBlock[]
}

export interface PostListItem {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  summary: string
}
