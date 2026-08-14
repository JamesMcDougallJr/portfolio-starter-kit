import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { tools, toolSchemas, type DentalApiConfig } from './tools'
import { buildSystemPrompt } from './system-prompt'
import {
  extractChecklist,
  getNextGatheringDirective,
  renderKnownValues,
  hasCoreIdentity,
  hasNewPatientExtras,
  type Checklist,
  type HistoryTurn,
} from './checklist'

export type { HistoryTurn } from './checklist'

export interface SlotOption {
  slot_id: string
  starts_at: string
  duration_minutes?: number
  provider?: { id?: string; name?: string; type?: string }
}

export interface RunState {
  patientId?: string
  patientOnFile?: boolean
  insuranceStatus?: string
  serviceCode?: string
  holdId?: string
  appointmentId?: string
  checklist?: Checklist
  insuranceVerificationAttempts?: number
  // The exact slots most recently presented to the patient. Tool results
  // never survive into a later turn's `messages` array (it's rebuilt fresh
  // from visible history text each turn), so without persisting the real
  // slot_id here the model has no way to book what it already offered and
  // is forced to search again indefinitely — this is what fixes that.
  presentedSlots?: SlotOption[]
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

// Registration is deterministic — our own code calls it at the precise
// moment the state machine allows, rather than leaving it to the model's
// judgment of "have I gathered enough yet."
async function ensureRegistered(
  state: RunState,
  checklist: Checklist,
  dentalApi: DentalApiConfig
): Promise<void> {
  if (state.patientId) return
  if (!hasCoreIdentity(checklist)) return

  const registerPatient = tools.register_patient
  if (!registerPatient) return

  const core = {
    first_name: checklist.first_name.value,
    last_name: checklist.last_name.value,
    date_of_birth: checklist.date_of_birth.value,
    phone: checklist.phone.value,
    email: checklist.email.value,
  }

  if (checklist.patient_type.value === 'new') {
    if (!hasNewPatientExtras(checklist)) return
    const result = (await registerPatient.run(
      {
        status: 'new',
        ...core,
        address_line1: checklist.address_line1.value,
        city: checklist.city.value,
        state: checklist.state.value,
        zip: checklist.zip.value,
        emergency_contact_name: checklist.emergency_contact_name.value,
        emergency_contact_phone: checklist.emergency_contact_phone.value,
      },
      dentalApi
    )) as Record<string, unknown>
    if (result && !('error' in result) && typeof result.id === 'string') {
      state.patientId = result.id
    }
    return
  }

  // Returning: probe with no address/emergency-contact fields. There's no
  // patient search endpoint in this API — this create call is the only
  // available signal. If the response comes back with on-file address data
  // we never sent, this patient is genuinely known; if it comes back null,
  // treat them like a new patient for the remaining questions (the record
  // already exists either way — POST /patients always succeeds).
  const result = (await registerPatient.run(
    { status: 'returning', ...core },
    dentalApi
  )) as Record<string, unknown>
  if (result && !('error' in result) && typeof result.id === 'string') {
    state.patientId = result.id
    state.patientOnFile = Boolean(result.address_line1)
  }
}

// Insurance fallback is deterministic too — after repeated verification
// failures we stop leaving "retry or self-pay?" to the model's read of a
// possibly-ambiguous patient reply (which was observed to spiral into
// invented excuses instead of ever converging), and just elect self-pay
// ourselves so the conversation can't stall indefinitely.
const MAX_INSURANCE_ATTEMPTS = 2

async function ensureInsuranceResolved(state: RunState, dentalApi: DentalApiConfig): Promise<void> {
  if (!state.patientId) return
  if (state.insuranceStatus === 'active' || state.insuranceStatus === 'self_pay') return
  if ((state.insuranceVerificationAttempts ?? 0) < MAX_INSURANCE_ATTEMPTS) return

  const verifyInsurance = tools.verify_insurance
  if (!verifyInsurance) return

  const result = (await verifyInsurance.run(
    { patient_id: state.patientId, self_pay: true },
    dentalApi
  )) as Record<string, unknown>
  if (result && !('error' in result) && typeof result.status === 'string') {
    state.insuranceStatus = result.status
    state.insuranceVerificationAttempts = 0
  }
}

function buildStateSummary(state: RunState): string {
  return [
    `patient_id: ${state.patientId ?? 'none yet'}`,
    `patient_on_file: ${state.patientOnFile === undefined ? 'n/a' : state.patientOnFile}`,
    `insurance: ${state.insuranceStatus ?? 'not verified yet'}${state.insuranceVerificationAttempts ? ` (${state.insuranceVerificationAttempts} failed attempt(s))` : ''}`,
    `service: ${state.serviceCode ?? 'not chosen yet'}`,
    `hold_id: ${state.holdId ?? 'none yet'}`,
    `appointment_id: ${state.appointmentId ?? 'not booked yet'}`,
    ...(state.presentedSlots && state.presentedSlots.length > 0
      ? [
          'previously_presented_slots (use these exact slot_id values for create_hold — do not search again just to re-find one of these):',
          ...state.presentedSlots.map(
            (s) =>
              `  - slot_id=${s.slot_id} starts_at=${s.starts_at}${s.provider?.name ? ` provider=${s.provider.name}` : ''}`
          ),
        ]
      : []),
  ].join('\n')
}

function buildTurnDirective(state: RunState, checklist: Checklist): string {
  if (state.appointmentId) {
    return 'The appointment is already booked and confirmed. Help with any follow-up requests (changes, cancellations, questions) or wrap up politely — do not re-book.'
  }

  const nextGathering = getNextGatheringDirective(checklist, state.patientOnFile)
  if (nextGathering) {
    return `Ask only: ${nextGathering}. Do not ask about or mention anything else this turn.`
  }

  if (!checklist.patient_confirmed_booking.value) {
    return `Do not ask any further questions. Summarize back to the patient exactly what you have: ${renderKnownValues(checklist)}. Ask them to confirm before you proceed. Do not call search_availability, create_hold, or book_appointment yet.`
  }

  if (state.presentedSlots && state.presentedSlots.length > 0 && !state.holdId) {
    return `You already presented the patient the slot(s) listed under "previously_presented_slots" in Known state above and are waiting on their answer. If their latest message picks one of those (including a plain "yes"/"that works" when only one was offered), call create_hold using that exact slot_id from Known state — do not call search_availability again, the slot_id you need is already there. Once create_hold succeeds, immediately call book_appointment with the resulting hold_id. Only call search_availability again if the patient explicitly asked for something different than what was offered.`
  }

  const insuranceResolved =
    state.insuranceStatus === 'active' || state.insuranceStatus === 'self_pay'
  const insuranceFailedOnce =
    !insuranceResolved &&
    (state.insuranceStatus === 'invalid_member' || state.insuranceStatus === 'not_accepted')

  const insuranceInstruction = insuranceResolved
    ? `Insurance is already resolved (status: ${state.insuranceStatus}) — do not call get_payers or verify_insurance again this run.`
    : `If using insurance, resolve a real payer_id via get_payers for "${checklist.insurance_or_self_pay.value}"; if no matching payer exists, tell the patient honestly and offer self-pay instead of proceeding as if it succeeded. Then call verify_insurance or self_pay.${insuranceFailedOnce ? ` Insurance verification already failed once with the details on file (${state.insuranceStatus}) — do not silently retry verify_insurance with the exact same payer_id/member_id/date_of_birth; only call it again if the patient's latest message actually supplied different insurance details, otherwise tell them you'll continue on a self-pay basis and call verify_insurance with self_pay: true.` : ''}`

  return `The patient has confirmed. Resolve a real service code via get_services for "${checklist.visit_reason.value}" before calling search_availability — never guess or invent one. ${insuranceInstruction} Only ever state specific times, providers, or slots that came back from a search_availability result you just received this turn — never invent, guess, or reuse stale-sounding availability.

When calling search_availability, default the "to" param to about 7 days out if the patient hasn't stated a preferred timeframe (respect whatever they did specify otherwise, even if it's further out or narrower). In your reply, present a concise handful of the real returned options (day/time and provider) so the patient can just pick one — then explicitly invite them to ask for a different day, time of day, or a wider window instead if none of those work.`
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
      if (typeof r.status === 'string') {
        state.insuranceStatus = r.status
        state.insuranceVerificationAttempts =
          r.status === 'invalid_member' || r.status === 'not_accepted'
            ? (state.insuranceVerificationAttempts ?? 0) + 1
            : 0
      }
      break
    case 'search_availability':
      if (typeof args.service === 'string') state.serviceCode = args.service as string
      if (Array.isArray(r.availability)) {
        state.presentedSlots = (r.availability as Record<string, unknown>[])
          .slice(0, 5)
          .filter((s): s is Record<string, unknown> => typeof s.slot_id === 'string')
          .map((s) => ({
            slot_id: s.slot_id as string,
            starts_at: typeof s.starts_at === 'string' ? s.starts_at : '',
            duration_minutes:
              typeof s.duration_minutes === 'number' ? s.duration_minutes : undefined,
            provider:
              s.provider && typeof s.provider === 'object'
                ? (s.provider as SlotOption['provider'])
                : undefined,
          }))
      }
      break
    case 'create_hold':
      if (typeof r.hold_id === 'string') {
        state.holdId = r.hold_id
        state.presentedSlots = undefined
      }
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

  const checklist = await extractChecklist({
    openaiKey,
    history,
    userMessage,
    previous: state.checklist,
    model,
  })
  state.checklist = checklist

  await ensureRegistered(state, checklist, dentalApi)
  await ensureInsuranceResolved(state, dentalApi)

  const turnDirective = buildTurnDirective(state, checklist)

  const client = new OpenAI({ apiKey: openaiKey })

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt(buildStateSummary(state), turnDirective),
    },
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
          // Insurance status can't regress once resolved: even if the model
          // calls verify_insurance again (e.g. re-deriving stale checklist
          // details after a confusing patient reply), a fresh failed lookup
          // must never overwrite an already-successful resolution.
          if (
            toolCall.function.name === 'verify_insurance' &&
            (state.insuranceStatus === 'active' || state.insuranceStatus === 'self_pay')
          ) {
            result = { status: state.insuranceStatus }
          } else {
            result = await toolDef.run(parsedArgs, dentalApi)
          }
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

    messages[0] = {
      role: 'system',
      content: buildSystemPrompt(buildStateSummary(state), turnDirective),
    }
  }

  if (!finalContent) {
    finalContent =
      "Sorry, I'm having trouble processing that — could you repeat your last message?"
  }

  return {
    message: finalContent.trim(),
    status: state.appointmentId ? 'complete' : 'continue',
    newState: state,
  }
}
