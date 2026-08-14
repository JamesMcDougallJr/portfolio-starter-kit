export interface StreamAgentOptions {
  invokePath: string
  prompt: string
  provider?: string
  apiKey?: string
  signal: AbortSignal
  onDelta: (text: string) => void
}

export async function streamAgentReply(
  opts: StreamAgentOptions
): Promise<void> {
  const { invokePath, prompt, provider, apiKey, signal, onDelta } = opts

  const res = await fetch(invokePath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      ...(provider ? { provider } : {}),
      ...(apiKey ? { api_key: apiKey } : {}),
    }),
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
