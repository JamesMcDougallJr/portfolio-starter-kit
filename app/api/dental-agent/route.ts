import { NextResponse } from 'next/server'
import { kvGet, kvSet } from '../../lib/kv'
import { runTurn, type RunState, type HistoryTurn } from '../../lib/dental-agent/agent'
import type { DentalApiConfig } from '../../lib/dental-agent/tools'

export const runtime = 'nodejs'
export const maxDuration = 60

interface TurnRequest {
  protocol_version: string
  run_id: string
  turn_id: string
  turn_number?: number
  input: {
    message: string
    history: HistoryTurn[]
  }
  resources: {
    dental_api: DentalApiConfig
  }
  // Additive, outside the protocol-defined shape — the evaluator never
  // sends this, so its requests/responses are unaffected. Lets us (or
  // whoever's testing) supply a fresh OpenAI key from the browser if the
  // server-configured one expires or gets pulled mid-interview.
  openai_api_key?: string
}

interface TurnResponse {
  protocol_version: string
  run_id: string
  turn_id: string
  output: { message: string }
  status: 'continue' | 'complete'
}

export async function POST(req: Request): Promise<NextResponse> {
  let turn: TurnRequest
  try {
    turn = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const requiredToken = process.env.AGENT_BEARER_TOKEN
  if (requiredToken) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${requiredToken}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const { run_id, turn_id, protocol_version, input, resources } = turn

  try {
    const cacheKey = `dental-agent:turn:${run_id}:${turn_id}`
    const cached = await kvGet<TurnResponse>(cacheKey)
    if (cached) return NextResponse.json(cached)

    const openaiKey = turn.openai_api_key || process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({
        protocol_version,
        run_id,
        turn_id,
        output: {
          message: "I'm not fully set up yet — please try again in a moment.",
        },
        status: 'continue',
      } satisfies TurnResponse)
    }

    const stateKey = `dental-agent:run:${run_id}`
    const state = (await kvGet<RunState>(stateKey)) ?? {}

    const result = await runTurn({
      openaiKey,
      history: input.history ?? [],
      userMessage: input.message,
      dentalApi: resources.dental_api,
      state,
    })

    await kvSet(stateKey, result.newState, 4 * 60 * 60)

    const response: TurnResponse = {
      protocol_version,
      run_id,
      turn_id,
      output: { message: result.message },
      status: result.status,
    }

    await kvSet(cacheKey, response, 10 * 60)

    return NextResponse.json(response)
  } catch (err) {
    console.error('dental-agent turn failed', err)
    return NextResponse.json({
      protocol_version,
      run_id,
      turn_id,
      output: {
        message: 'Sorry, something went wrong on my end — could you say that again?',
      },
      status: 'continue',
    } satisfies TurnResponse)
  }
}
