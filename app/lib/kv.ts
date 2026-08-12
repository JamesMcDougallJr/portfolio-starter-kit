const BASE = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Upstash isn't wired up yet in every environment (e.g. local dev before
// setup) — degrade to "no persistence" instead of hard-failing, so the
// agent still works, just without cross-turn state/idempotency caching.
const KV_CONFIGURED = Boolean(BASE && TOKEN)

async function call(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`KV error ${res.status}`)
  }
  const body = (await res.json()) as { result: unknown }
  return body.result
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_CONFIGURED) return null
  const raw = await call(`/get/${encodeURIComponent(key)}`)
  if (typeof raw !== 'string') return null
  return JSON.parse(raw) as T
}

export async function kvSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!KV_CONFIGURED) return
  const body = encodeURIComponent(JSON.stringify(value))
  await call(`/set/${encodeURIComponent(key)}/${body}?EX=${ttlSeconds}`)
}
