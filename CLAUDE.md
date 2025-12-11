# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js portfolio and blog site for James McDougall. It's built on the Next.js App Router with MDX blog support, featuring interactive demos including object detection and mapping functionality.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (default: http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

### Framework & Routing
- **Next.js App Router** (canary version): Uses the `app/` directory structure
- **React canary**: Bleeding-edge React features
- **TypeScript**: Configured with `strict: false` but `strictNullChecks: true`

### Blog System
- **Content Location**: Blog posts live in `app/blog/posts/` as `.mdx` files
- **Frontmatter**: Each MDX file has YAML frontmatter with `title`, `publishedAt`, `summary`, and optional `image`
- **Rendering**: Uses `next-mdx-remote` for server-side MDX rendering with custom components
- **Utilities**: `app/blog/utils.ts` contains:
  - `getBlogPosts()`: Reads and parses all MDX files from `app/blog/posts/`
  - `formatDate()`: Formats dates with relative time (e.g., "2mo ago")
- **Dynamic Routes**: `app/blog/[slug]/page.tsx` generates static pages for each blog post
- **RSS Feed**: Available at `/rss` route via `app/rss/route.ts`

### MDX Components
The `CustomMDX` component in `app/components/mdx.tsx` provides custom renderers:
- Auto-linking headings with slugified IDs
- Syntax highlighting via `sugar-high`
- Custom link handling (internal vs external)
- Rounded images via Next.js Image component
- Custom table rendering

### SEO & Metadata
- **Sitemap**: Auto-generated at `/sitemap.xml` from `app/sitemap.ts`, includes all blog posts and routes
- **OG Images**: Dynamic Open Graph images via `/og` route
- **JSON-LD**: Structured data for blog posts as BlogPosting schema
- **Base URL**: Defined in `app/sitemap.ts` as `baseUrl` constant (currently points to vercel.app demo)

### Special Features
- **Object Detection**: `app/components/object_detector/` contains MediaPipe-based webcam object detection
  - Uses `@mediapipe/tasks-vision` with EfficientDet Lite0 model
  - Client-side video processing with bounding box overlays
  - GPU-accelerated when available
- **Map Component**: `app/map/page.tsx` uses OpenLayers (`ol` package) to render an interactive map
  - Dark theme tiles from Stadia Maps
  - Vector layer support for markers
  - Centered on Utah coordinates

### Styling
- **Tailwind CSS v4** (alpha): Uses the new `@tailwindcss/postcss` package
- **Dark Mode**: Configured via className strategy on `<html>` element
- **Fonts**: Geist Sans and Geist Mono via `geist` package

### Analytics
- Vercel Analytics and Speed Insights integrated in production

## Key File Locations

- **Layout**: `app/layout.tsx` - Root layout with metadata, fonts, nav, and footer
- **Home Page**: `app/page.tsx` - Shows hero title, blog posts, and object detection demo
- **Navigation**: `app/components/nav.tsx`
- **Blog Utilities**: `app/blog/utils.ts` - Core blog data fetching and formatting
- **MDX Rendering**: `app/components/mdx.tsx` - Custom MDX component overrides
- **Global Styles**: `app/global.css`

## Important Notes

- The site uses **pnpm** as the package manager (confirmed by `pnpm-lock.yaml`)
- **Node Version**: Locked to a specific version via `.nvmrc`
- **Base URL**: When deploying, update `baseUrl` in `app/sitemap.ts` to the production domain
- **Blog Posts**: To add a new post, create an `.mdx` file in `app/blog/posts/` with proper frontmatter
- **TypeScript**: Not all type errors are caught due to `strict: false`, but null checks are enforced
