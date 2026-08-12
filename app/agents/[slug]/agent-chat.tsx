'use client'

import { useEffect, useRef, useState } from 'react'
import type { Agent, AgentProvider } from '../agent-data'
import { streamAgentReply } from '../../lib/agent-stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const MAX_INPUT_LENGTH = 500
const REQUEST_TIMEOUT_MS = 30000

function sessionKeyFor(agentSlug: string, provider: AgentProvider): string {
  return `agent-api-key:${agentSlug}:${provider}`
}

export function AgentChat({ agent }: { agent: Agent }): JSX.Element {
  const [selectedProvider, setSelectedProvider] = useState<AgentProvider>(
    agent.providers[0]?.id ?? 'bedrock'
  )
  const [apiKey, setApiKey] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const providerOption = agent.providers.find((p) => p.id === selectedProvider)
  const requiresApiKey = providerOption?.requiresApiKey ?? false

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, pending])

  function handleProviderChange(provider: AgentProvider) {
    setSelectedProvider(provider)
    const option = agent.providers.find((p) => p.id === provider)
    if (!option?.requiresApiKey) {
      setApiKey('')
      return
    }
    setApiKey(sessionStorage.getItem(sessionKeyFor(agent.slug, provider)) ?? '')
  }

  function handleApiKeyChange(value: string) {
    setApiKey(value)
    const key = sessionKeyFor(agent.slug, selectedProvider)
    if (value) {
      sessionStorage.setItem(key, value)
    } else {
      sessionStorage.removeItem(key)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || pending) return
    if (requiresApiKey && !apiKey) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'assistant', text: '' },
    ])
    setInput('')
    setPending(true)
    setError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      // NOTE: provider/apiKey are forwarded to the AgentCore harness as
      // `provider`/`api_key` body fields (see app/lib/agent-stream.ts) —
      // main.py in ../jamesmcdougalljr-agent reads them and picks the
      // matching model client in model/load.py.
      await streamAgentReply({
        invokePath: agent.invokePath,
        prompt,
        provider: selectedProvider,
        apiKey: requiresApiKey ? apiKey : undefined,
        signal: controller.signal,
        onDelta: (delta) => {
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, text: last.text + delta }
            }
            return next
          })
        },
      })
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">
          Provider:
        </span>
        {agent.providers.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleProviderChange(option.id)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
              selectedProvider === option.id
                ? 'bg-primary-color text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-color'
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>

      {requiresApiKey && (
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <label
            htmlFor="agent-api-key"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            Your OpenAI API key
          </label>
          <input
            id="agent-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Never stored on our servers — session-only in your browser, sent
            only with your requests to this agent.
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        className="h-96 space-y-3 overflow-y-auto px-4 py-3 text-sm"
      >
        {messages.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">
            Ask something to get started.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-2xl rounded-lg bg-primary-color px-3 py-2 text-white'
                : 'mr-auto max-w-2xl rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100'
            }
          >
            {m.text || (pending && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}
      </div>

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
          placeholder="Type a question..."
          aria-label="Your question"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={pending || !input.trim() || (requiresApiKey && !apiKey)}
          className="rounded-lg bg-primary-color px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {requiresApiKey && !apiKey && (
        <p className="px-4 pb-3 text-xs text-amber-600 dark:text-amber-400">
          Enter your OpenAI API key above to use this provider.
        </p>
      )}
    </div>
  )
}
