# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js portfolio and blog site for James McDougall. It's built on the Next.js App Router with Sanity CMS for content management, featuring interactive demos including object detection and mapping functionality.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Deploy Sanity schema changes
npx sanity@latest schema deploy
```

## Architecture

### Framework & Routing
- **Next.js App Router** (canary version): Uses the `app/` directory structure
- **React canary**: Bleeding-edge React features
- **TypeScript**: Strict mode enabled with `noImplicitAny` and `noUncheckedIndexedAccess`

### Blog System (Sanity CMS)
- **Content Management**: Blog posts are managed via Sanity CMS
- **Sanity Studio**: Embedded at `/studio` route for content editing
- **Schema**: Defined in `sanity/schemas/post.ts` with fields:
  - `title`, `slug`, `publishedAt`, `summary`, `image`, `body` (Portable Text)
- **Queries**: GROQ queries in `sanity/lib/queries.ts`
- **Types**: TypeScript interfaces in `sanity/lib/types.ts`
- **Client**: `sanity/sanity.client.ts` - Sanity client with graceful fallback
- **Rendering**: `app/components/portable-text.tsx` - Renders Sanity Portable Text
- **Dynamic Routes**: `app/blog/[slug]/page.tsx` generates pages for each blog post
- **RSS Feed**: Available at `/rss` route via `app/rss/route.ts`

### Sanity Configuration
- **Project ID**: Stored in `NEXT_PUBLIC_SANITY_PROJECT_ID` env variable
- **Dataset**: Stored in `NEXT_PUBLIC_SANITY_DATASET` (default: "production")
- **Config**: `sanity.config.ts` - Main Sanity configuration
- **CLI Config**: `sanity.cli.ts` - For running Sanity CLI commands

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
- **Blog Posts Component**: `app/components/posts.tsx` - Fetches and displays blog posts from Sanity
- **Portable Text**: `app/components/portable-text.tsx` - Renders Sanity rich text
- **Sanity Client**: `sanity/sanity.client.ts` - Sanity client configuration
- **Sanity Queries**: `sanity/lib/queries.ts` - GROQ queries for fetching content
- **Sanity Schema**: `sanity/schemas/post.ts` - Blog post schema definition
- **Sanity Config**: `sanity.config.ts` - Main Sanity Studio configuration
- **Global Styles**: `app/global.css`

## Important Notes

- The site uses **npm** as the package manager
- **Node Version**: Locked to a specific version via `.nvmrc`
- **Base URL**: When deploying, update `baseUrl` in `app/sitemap.ts` to the production domain
- **Blog Posts**: Managed via Sanity Studio at `/studio` - create and publish posts there
- **Environment Variables**: Requires `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local`
- **Schema Deployment**: After changing schemas in `sanity/schemas/`, run `npx sanity@latest schema deploy`
