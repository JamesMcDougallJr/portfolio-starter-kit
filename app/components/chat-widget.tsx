'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const MAX_INPUT_LENGTH = 500
const REQUEST_TIMEOUT_MS = 30000
const CONTACT_URL = 'https://calendly.com/jamesimcdougalljr/30min'

function FlameIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="chat-flame-gradient"
          x1="50%"
          y1="100%"
          x2="50%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 12 8 12 14c0 2-1 4-3 5 2 1 3 3 3 5 0 3 2 6 4 6s4-3 4-6c0-2 1-4 3-5-2-1-3-3-3-5 0-6-4-12-4-12z"
        fill="url(#chat-flame-gradient)"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 2L14 14M14 2L2 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

async function streamAgentReply(
  prompt: string,
  onDelta: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch('/agent/invocations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Agent request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      let payload: unknown
      try {
        payload = JSON.parse(line.slice('data: '.length))
      } catch {
        continue
      }
      const event = (payload as { event?: Record<string, unknown> })?.event
      const delta = (
        event?.contentBlockDelta as { delta?: { text?: string } } | undefined
      )?.delta?.text
      if (delta) onDelta(delta)
    }
  }
}

export function ChatWidget(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, pending])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || pending) return

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
      await streamAgentReply(
        prompt,
        (delta) => {
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, text: last.text + delta }
            }
            return next
          })
        },
        controller.signal
      )
    } catch (err) {
      const timedOut = controller.signal.aborted
      setError(
        timedOut
          ? `That took too long and was cancelled. Try again, or reach James directly: ${CONTACT_URL}`
          : `Couldn't reach the agent — make sure the local agent dev server is running on port 8080. (${
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Ask about James"
          className="flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800/95"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h2 className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-sm font-medium text-transparent">
              Ask about James
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <CloseIcon />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm"
          >
            {messages.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Ask about James&apos;s tutoring, AI consulting, background, or
                how to get in touch.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-primary-color px-3 py-2 text-white'
                    : 'mr-auto max-w-[85%] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100'
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
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) =>
                setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))
              }
              maxLength={MAX_INPUT_LENGTH}
              disabled={pending}
              placeholder="Type a question..."
              aria-label="Your question"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-lg bg-primary-color px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close chat' : 'Ask about James'}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-800"
      >
        {open ? <CloseIcon /> : <FlameIcon />}
      </button>
    </div>
  )
}
