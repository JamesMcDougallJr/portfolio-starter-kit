'use client'

import { useEffect, useRef, useState } from 'react'
import type { Agent } from '../agent-data'

interface ChatMessage {
  role: 'patient' | 'agent'
  content: string
}

const DEFAULT_BASE_URL = 'https://dental.play.podium-dev.com'
const MAX_INPUT_LENGTH = 500
const REQUEST_TIMEOUT_MS = 30000

function storageKey(agentSlug: string, field: string): string {
  return `dental-agent:${agentSlug}:${field}`
}

export function DentalSchedulerChat({ agent }: { agent: Agent }): JSX.Element {
  const [dentalApiKey, setDentalApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [bearerToken, setBearerToken] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [runId, setRunId] = useState('')
  const [turnNumber, setTurnNumber] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastStatus, setLastStatus] = useState<'continue' | 'complete' | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDentalApiKey(sessionStorage.getItem(storageKey(agent.slug, 'api-key')) ?? '')
    setBaseUrl(
      sessionStorage.getItem(storageKey(agent.slug, 'base-url')) ?? DEFAULT_BASE_URL
    )
    setBearerToken(sessionStorage.getItem(storageKey(agent.slug, 'bearer')) ?? '')
    setOpenaiApiKey(sessionStorage.getItem(storageKey(agent.slug, 'openai-key')) ?? '')
    setRunId(crypto.randomUUID())
  }, [agent.slug])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, pending])

  function persist(field: string, value: string) {
    const key = storageKey(agent.slug, field)
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  }

  function resetRun() {
    setRunId(crypto.randomUUID())
    setTurnNumber(0)
    setMessages([])
    setLastStatus(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = input.trim()
    if (!message || pending || !dentalApiKey) return

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'patient', content: message }])
    setInput('')
    setPending(true)
    setError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const nextTurnNumber = turnNumber + 1

    try {
      const res = await fetch(agent.invokePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        },
        body: JSON.stringify({
          protocol_version: 'candidate-agent/1',
          run_id: runId,
          turn_id: crypto.randomUUID(),
          turn_number: nextTurnNumber,
          input: { message, history },
          resources: {
            dental_api: {
              base_url: baseUrl,
              api_key: dentalApiKey,
              docs_url: `${baseUrl}/agent-protocol.md`,
            },
          },
          ...(openaiApiKey ? { openai_api_key: openaiApiKey } : {}),
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Agent request failed (${res.status})`)
      const data: { output?: { message?: string }; status?: 'continue' | 'complete' } =
        await res.json()

      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: data.output?.message ?? '(empty reply)' },
      ])
      setLastStatus(data.status ?? null)
      setTurnNumber(nextTurnNumber)
    } catch (err) {
      const timedOut = controller.signal.aborted
      setError(
        timedOut
          ? 'That took too long and was cancelled. Try again.'
          : `Couldn't reach the agent. (${
              err instanceof Error ? err.message : 'unknown error'
            })`
      )
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      clearTimeout(timeout)
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 space-y-3">
        <div>
          <label
            htmlFor="dental-api-key"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            Scheduling API key
          </label>
          <input
            id="dental-api-key"
            type="password"
            value={dentalApiKey}
            onChange={(e) => {
              setDentalApiKey(e.target.value)
              persist('api-key', e.target.value)
            }}
            placeholder="cand_..."
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[12rem]">
            <label
              htmlFor="dental-base-url"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Base URL
            </label>
            <input
              id="dental-base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value)
                persist('base-url', e.target.value)
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label
              htmlFor="dental-bearer"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Bearer token (only if set on the server)
            </label>
            <input
              id="dental-bearer"
              type="password"
              value={bearerToken}
              onChange={(e) => {
                setBearerToken(e.target.value)
                persist('bearer', e.target.value)
              }}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="dental-openai-key"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            OpenAI API key (optional — only if the server&apos;s key expires or is removed)
          </label>
          <input
            id="dental-openai-key"
            type="password"
            value={openaiApiKey}
            onChange={(e) => {
              setOpenaiApiKey(e.target.value)
              persist('openai-key', e.target.value)
            }}
            placeholder="sk-..."
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Session-only, sent only to this agent&apos;s own endpoint — never
            stored on our servers.
          </p>
          <button
            type="button"
            onClick={resetRun}
            className="text-xs font-medium text-primary-color hover:opacity-80 whitespace-nowrap"
          >
            New run
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-96 space-y-3 overflow-y-auto px-4 py-3 text-sm"
      >
        {messages.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">
            Type your first message as the patient to start the run.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'patient'
                ? 'ml-auto max-w-2xl rounded-lg bg-primary-color px-3 py-2 text-white'
                : 'mr-auto max-w-2xl rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100'
            }
          >
            {m.content}
          </div>
        ))}
        {pending && (
          <div className="mr-auto max-w-2xl rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            …
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}
      </div>

      {lastStatus === 'complete' && (
        <p className="px-4 pb-2 text-xs text-green-600 dark:text-green-400">
          Agent marked this run complete — it can still receive follow-up turns.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
          maxLength={MAX_INPUT_LENGTH}
          disabled={pending}
          placeholder="Type as the patient..."
          aria-label="Your message as the patient"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={pending || !input.trim() || !dentalApiKey}
          className="rounded-lg bg-primary-color px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {!dentalApiKey && (
        <p className="px-4 pb-3 text-xs text-amber-600 dark:text-amber-400">
          Enter your Scheduling API key above to start testing.
        </p>
      )}
    </div>
  )
}
