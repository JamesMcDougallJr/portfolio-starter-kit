#!/usr/bin/env node
/**
 * Regenerates site-context.md for the local Q&A agent by building the site,
 * booting a throwaway production server, fetching each page's rendered
 * HTML, and stripping it down to prose.
 *
 * Rendered HTML (not JSX source) is used deliberately: this site's content
 * lives as hardcoded JSX with runtime-only expressions (siteConfig lookups,
 * Portable Text), so the rendered page is the only place the real text
 * exists. A production server (not `next dev`) is used because Turbopack's
 * dev server lazily compiles each route on first request, which can race
 * this script and return a partially-streamed response; a built app has no
 * such cold-start window. See the implementation plan for the full
 * rationale.
 *
 * Usage: `npm run build:context` — fully self-contained, no other server
 * needs to be running first.
 */

import { spawn } from 'node:child_process'

const PORT = process.env.CONTEXT_BUILD_PORT || 39217
const SITE_ORIGIN = `http://localhost:${PORT}`
const OUTPUT_PATH =
  process.env.CONTEXT_OUTPUT_PATH ||
  '../jamesmcdougalljr-agent/app/site_qa_agent/site-context.md'
const TOKEN_LIMIT = 15000
// Rough chars-per-token estimate; good enough for a fail-loud guardrail.
const CHARS_PER_TOKEN = 4

function runToCompletion(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' })
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))
    )
  })
}

function startServer() {
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return child
}

async function waitForServer(child, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited early with code ${child.exitCode}`)
    }
    try {
      const res = await fetch(SITE_ORIGIN)
      if (res.ok || res.status === 404) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Production server did not become ready within ${timeoutMs}ms`)
}

const STATIC_PAGES = [
  { path: '/', title: 'Home' },
  { path: '/tutoring', title: 'Tutoring' },
  { path: '/projects', title: 'Projects' },
]

async function fetchHtml(path) {
  const res = await fetch(`${SITE_ORIGIN}${path}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

function extractBody(html) {
  // Some routes bail out of static SSR partway through <main> (a
  // BAILOUT_TO_CLIENT_SIDE_RENDERING boundary) and stream the real,
  // fully-resolved markup as a later sibling in the document rather than
  // nested inside <main>. Operating on the whole <body> (nav/footer are
  // stripped separately below, wherever they occur) picks up that content
  // regardless of which shape a given route's response takes.
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return match ? match[1] : html
}

function stripBlock(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
  return html.replace(re, '')
}

function extractLinks(html, pattern) {
  const links = new Set()
  const re = /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi
  let m
  while ((m = re.exec(html))) {
    if (pattern.test(m[1])) links.add(m[1])
  }
  return [...links]
}

function decodeEntities(str) {
  return str
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function htmlToText(html) {
  let text = html
  // Drop non-content tags entirely.
  text = stripBlock(text, 'script')
  text = stripBlock(text, 'style')
  text = stripBlock(text, 'svg')
  text = stripBlock(text, 'template')
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  // Drop the nav (wrapped in <aside>) and footer regions, wherever they occur.
  text = stripBlock(text, 'aside')
  text = stripBlock(text, 'footer')
  // Drop screen-reader-only decorative text (e.g. a hidden loading spinner label).
  text = text.replace(/<span[^>]*\bclass=["'][^"']*\bsr-only\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')

  // Drop the "skip to main content" accessibility link.
  text = text.replace(/<a\s[^>]*href=["']#main-content["'][^>]*>[\s\S]*?<\/a>/gi, '')

  // Turn links into "text (url)" before stripping tags.
  text = text.replace(
    /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, inner) => {
      const label = inner.replace(/<[^>]+>/g, '').trim()
      return label ? `${label} (${href})` : href
    }
  )

  // Headings on their own line with a markdown-ish prefix.
  text = text.replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '').trim()
    return `\n${'#'.repeat(Number(level))} ${clean}\n`
  })

  // Block-level tags become paragraph breaks.
  text = text.replace(/<\/(p|div|li|section|article)>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Strip all remaining tags.
  text = text.replace(/<[^>]+>/g, '')

  text = decodeEntities(text)

  // Collapse whitespace.
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')

  return text.trim()
}

async function buildPageSection(path, titleHint) {
  const html = await fetchHtml(path)
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = titleHint || (titleMatch ? titleMatch[1] : path)
  const body = extractBody(html)
  const text = htmlToText(body)
  return `## ${title} (${path})\n\n${text}\n`
}

async function discoverProjectSlugs() {
  const html = await fetchHtml('/projects')
  return extractLinks(html, /^\/projects\/[^/]+$/)
}

async function discoverBlogSlugs() {
  try {
    const html = await fetchHtml('/blog')
    return extractLinks(html, /^\/blog\/[^/]+$/)
  } catch {
    return []
  }
}

async function main() {
  console.log('Building production bundle...')
  await runToCompletion('npx', ['next', 'build'])

  console.log(`Starting production server on port ${PORT}...`)
  const server = startServer()
  try {
    await waitForServer(server)
    await extractAndWrite()
  } finally {
    server.kill()
  }
}

async function extractAndWrite() {
  const sections = []

  for (const { path, title } of STATIC_PAGES) {
    sections.push(await buildPageSection(path, title))
  }

  const projectSlugs = await discoverProjectSlugs()
  for (const path of projectSlugs) {
    sections.push(await buildPageSection(path))
  }

  const blogSlugs = await discoverBlogSlugs()
  if (blogSlugs.length === 0) {
    console.warn('No blog posts found (Sanity may not be configured locally) — skipping /blog content.')
  }
  for (const path of blogSlugs) {
    sections.push(await buildPageSection(path))
  }

  // /map is an external redirect, not on-site content — one factual line only.
  sections.push(
    '## Map (/map)\n\nThe "map" nav link redirects to an external interactive historical map tool hosted separately from this site; it is not on-site content.\n'
  )

  const doc = sections.join('\n')
  const approxTokens = Math.ceil(doc.length / CHARS_PER_TOKEN)

  if (approxTokens > TOKEN_LIMIT) {
    console.error(
      `site-context.md would be ~${approxTokens} tokens, over the ${TOKEN_LIMIT}-token fixed-context limit. ` +
        `Stopping without writing output — this needs a design decision (trim content or revisit the fixed-context approach), not a silent truncation.`
    )
    process.exit(1)
  }

  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const outPath = path.resolve(process.cwd(), OUTPUT_PATH)
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, doc, 'utf8')
  console.log(`Wrote ${outPath} (~${approxTokens} tokens, ${sections.length} sections)`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
