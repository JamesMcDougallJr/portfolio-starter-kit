import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { tools, toolSchemas, type DentalApiConfig } from './tools'
import { buildSystemPrompt } from './system-prompt'

export interface RunState {
  patientId?: string
  insuranceStatus?: string
  serviceCode?: string
  holdId?: string
  appointmentId?: string
}

export interface HistoryTurn {
  role: 'patient' | 'agent'
  content: string
}

interface RunTurnArgs {
  openaiKey: string
  history: HistoryTurn[]
  userMessage: string
  dentalApi: DentalApiConfig
  state: RunState
  model?: string
}

interface RunTurnResult {
  message: string
  status: 'continue' | 'complete'
  newState: RunState
}

const MAX_TOOL_ITERATIONS = 6
const STATUS_MARKER = 'STATUS_COMPLETE'

function buildStateSummary(state: RunState): string {
  return [
    `patient_id: ${state.patientId ?? 'none yet'}`,
    `insurance: ${state.insuranceStatus ?? 'not verified yet'}`,
    `service: ${state.serviceCode ?? 'not chosen yet'}`,
    `hold_id: ${state.holdId ?? 'none yet'}`,
    `appointment_id: ${state.appointmentId ?? 'not booked yet'}`,
  ].join('\n')
}

function applyStateEffects(
  state: RunState,
  toolName: string,
  args: Record<string, unknown>,
  result: unknown
): void {
  if (!result || typeof result !== 'object' || 'error' in (result as object)) return
  const r = result as Record<string, unknown>

  switch (toolName) {
    case 'register_patient':
      if (typeof r.id === 'string') state.patientId = r.id
      break
    case 'verify_insurance':
      if (typeof r.status === 'string') state.insuranceStatus = r.status
      break
    case 'search_availability':
      if (typeof args.service === 'string') state.serviceCode = args.service as string
      break
    case 'create_hold':
      if (typeof r.hold_id === 'string') state.holdId = r.hold_id
      break
    case 'book_appointment':
      if (typeof r.id === 'string') state.appointmentId = r.id
      break
    case 'cancel_appointment':
      state.appointmentId = undefined
      state.holdId = undefined
      break
    default:
      break
  }
}

export async function runTurn(args: RunTurnArgs): Promise<RunTurnResult> {
  const { openaiKey, history, userMessage, dentalApi, model } = args
  const state: RunState = { ...args.state }
  const client = new OpenAI({ apiKey: openaiKey })

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(buildStateSummary(state)) },
    ...history.map(
      (h): ChatCompletionMessageParam => ({
        role: h.role === 'patient' ? 'user' : 'assistant',
        content: h.content,
      })
    ),
    { role: 'user', content: userMessage },
  ]

  let finalContent = ''

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const completion = await client.chat.completions.create({
      model: model ?? process.env.OPENAI_MODEL_ID ?? 'gpt-4o',
      messages,
      tools: toolSchemas,
    })

    const msg = completion.choices[0]?.message
    if (!msg) break

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalContent = msg.content ?? ''
      break
    }

    messages.push(msg as ChatCompletionMessageParam)

    for (const toolCall of msg.tool_calls) {
      if (toolCall.type !== 'function') continue
      const toolDef = tools[toolCall.function.name]
      let result: unknown

      if (!toolDef) {
        result = {
          error: {
            code: 'UNKNOWN_TOOL',
            message: `No such tool: ${toolCall.function.name}`,
          },
        }
      } else {
        let parsedArgs: Record<string, unknown> = {}
        try {
          parsedArgs = JSON.parse(toolCall.function.arguments || '{}')
        } catch {
          // leave empty; the model will see an empty-args tool result and can retry
        }
        try {
          result = await toolDef.run(parsedArgs, dentalApi)
        } catch (err) {
          result = {
            error: {
              code: 'TOOL_EXECUTION_FAILED',
              message: err instanceof Error ? err.message : 'unknown error',
            },
          }
        }
        applyStateEffects(state, toolCall.function.name, parsedArgs, result)
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }

    messages[0] = { role: 'system', content: buildSystemPrompt(buildStateSummary(state)) }
  }

  if (!finalContent) {
    finalContent =
      "Sorry, I'm having trouble processing that — could you repeat your last message?"
  }

  const trimmed = finalContent.trim()
  const isComplete = trimmed.endsWith(STATUS_MARKER)
  const message = isComplete
    ? trimmed.slice(0, -STATUS_MARKER.length).trim()
    : trimmed

  return {
    message: message || trimmed,
    status: isComplete ? 'complete' : 'continue',
    newState: state,
  }
}
