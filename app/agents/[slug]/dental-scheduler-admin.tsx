'use client'

import { useEffect, useState } from 'react'
import type { Agent } from '../agent-data'

interface Status {
  configured: boolean
  bearerRequired: boolean
}

export function DentalSchedulerAdmin({ agent }: { agent: Agent }): JSX.Element {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [endpointUrl, setEndpointUrl] = useState('')

  useEffect(() => {
    setEndpointUrl(`${window.location.origin}${agent.invokePath}`)
    fetch('/api/dental-agent/status')
      .then((res) => {
        if (!res.ok) throw new Error(`status check failed (${res.status})`)
        return res.json()
      })
      .then(setStatus)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not check status')
      )
  }, [agent.invokePath])

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 space-y-4">
      <div>
        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          Evaluator endpoint
        </span>
        <code className="block rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm break-all text-slate-900 dark:text-slate-100">
          {endpointUrl || '…'}
        </code>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusPill
          label="OpenAI key"
          ok={status?.configured}
          okText="Configured"
          notOkText="Not set (OPENAI_API_KEY)"
        />
        <StatusPill
          label="Bearer token"
          ok={status ? true : undefined}
          okText={status?.bearerRequired ? 'Required' : 'Open (no token)'}
          notOkText="Unknown"
          neutral
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        This agent is driven entirely by Podium&apos;s evaluator hitting the
        endpoint above — there&apos;s no chat UI here to test with directly.
      </p>
    </div>
  )
}

function StatusPill({
  label,
  ok,
  okText,
  notOkText,
  neutral,
}: {
  label: string
  ok: boolean | undefined
  okText: string
  notOkText: string
  neutral?: boolean
}): JSX.Element {
  const color =
    ok === undefined
      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      : ok || neutral
        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${color}`}
    >
      {label}: {ok === undefined ? '…' : ok ? okText : notOkText}
    </span>
  )
}
