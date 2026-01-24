import type { Metadata } from 'next'
import { baseUrl } from '../sitemap'

export const siteConfig = {
  name: 'James McDougall',
  title: 'James McDougall',
  description:
    'James McDougall is a software engineer based in Salt Lake City, Utah. Exploring web development, AI, and creative problem solving.',
  url: baseUrl,
  location: {
    city: 'Salt Lake City',
    region: 'Utah',
    country: 'US',
  },
  social: {
    github: 'https://github.com/JamesMcDougallJr',
    linkedin: 'https://www.linkedin.com/in/james-mcdouga/',
  },
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description:
      'Software engineer based in Salt Lake City, Utah. Building web applications and exploring AI.',
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
