import OpenAI from 'openai'

export interface HistoryTurn {
  role: 'patient' | 'agent'
  content: string
}

interface StringField {
  known: boolean
  value: string | null
}

interface BoolField {
  known: boolean
  value: boolean | null
}

interface PatientTypeField {
  known: boolean
  value: 'new' | 'returning' | null
}

export interface Checklist {
  patient_type: PatientTypeField
  first_name: StringField
  last_name: StringField
  date_of_birth: StringField
  phone: StringField
  email: StringField
  address_line1: StringField
  city: StringField
  state: StringField
  zip: StringField
  emergency_contact_name: StringField
  emergency_contact_phone: StringField
  visit_reason: StringField
  insurance_or_self_pay: StringField
  patient_confirmed_booking: BoolField
}

const CHECKLIST_FIELDS = [
  'patient_type',
  'first_name',
  'last_name',
  'date_of_birth',
  'phone',
  'email',
  'address_line1',
  'city',
  'state',
  'zip',
  'emergency_contact_name',
  'emergency_contact_phone',
  'visit_reason',
  'insurance_or_self_pay',
  'patient_confirmed_booking',
] as const

function emptyChecklist(): Checklist {
  const empty = { known: false, value: null }
  return {
    patient_type: { ...empty },
    first_name: { ...empty },
    last_name: { ...empty },
    date_of_birth: { ...empty },
    phone: { ...empty },
    email: { ...empty },
    address_line1: { ...empty },
    city: { ...empty },
    state: { ...empty },
    zip: { ...empty },
    emergency_contact_name: { ...empty },
    emergency_contact_phone: { ...empty },
    visit_reason: { ...empty },
    insurance_or_self_pay: { ...empty },
    patient_confirmed_booking: { ...empty },
  }
}

const stringFieldSchema = {
  type: 'object',
  properties: {
    known: { type: 'boolean' },
    value: { type: ['string', 'null'] },
  },
  required: ['known', 'value'],
  additionalProperties: false,
}

const boolFieldSchema = {
  type: 'object',
  properties: {
    known: { type: 'boolean' },
    value: { type: ['boolean', 'null'] },
  },
  required: ['known', 'value'],
  additionalProperties: false,
}

const patientTypeFieldSchema = {
  type: 'object',
  properties: {
    known: { type: 'boolean' },
    value: { type: ['string', 'null'], enum: ['new', 'returning', null] },
  },
  required: ['known', 'value'],
  additionalProperties: false,
}

const checklistJsonSchema = {
  type: 'object',
  properties: {
    patient_type: patientTypeFieldSchema,
    first_name: stringFieldSchema,
    last_name: stringFieldSchema,
    date_of_birth: stringFieldSchema,
    phone: stringFieldSchema,
    email: stringFieldSchema,
    address_line1: stringFieldSchema,
    city: stringFieldSchema,
    state: stringFieldSchema,
    zip: stringFieldSchema,
    emergency_contact_name: stringFieldSchema,
    emergency_contact_phone: stringFieldSchema,
    visit_reason: stringFieldSchema,
    insurance_or_self_pay: stringFieldSchema,
    patient_confirmed_booking: boolFieldSchema,
  },
  required: [...CHECKLIST_FIELDS],
  additionalProperties: false,
}

interface ExtractChecklistArgs {
  openaiKey: string
  history: HistoryTurn[]
  userMessage: string
  previous: Checklist | undefined
  model?: string
}

export async function extractChecklist(args: ExtractChecklistArgs): Promise<Checklist> {
  const { openaiKey, history, userMessage, previous, model } = args
  const client = new OpenAI({ apiKey: openaiKey })

  const transcript = [
    ...history.map((h) => `${h.role === 'patient' ? 'Patient' : 'Agent'}: ${h.content}`),
    `Patient: ${userMessage}`,
  ].join('\n')

  const previousJson = previous ? JSON.stringify(previous) : '(nothing recorded yet)'

  try {
    const completion = await client.chat.completions.create({
      model: model ?? process.env.OPENAI_MODEL_ID ?? 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You extract structured facts from a dental-scheduling conversation. Given the full conversation transcript and what was previously known, output the CURRENT complete state of every field. If the patient contradicted an earlier statement, use their most recent statement, not the stale one. Do not infer or guess values the patient never actually stated — leave known:false if genuinely unstated. Decompose freely: if the patient gives a full name, split it into first_name/last_name; if they give a full mailing address in one sentence, split it into address_line1/city/state/zip; if they give an emergency contact, split it into emergency_contact_name/emergency_contact_phone. "insurance_or_self_pay" should capture either "self-pay" or the insurance provider name plus member ID as free text, whatever the patient actually said. "patient_confirmed_booking" should only be known:true/value:true if the patient just gave a clear affirmative response (e.g. "yes", "that works", "book it") to an agent message that was specifically asking them to confirm booking — not general earlier agreement.',
        },
        {
          role: 'user',
          content: `Previously recorded state:\n${previousJson}\n\nFull conversation so far:\n${transcript}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'checklist',
          strict: true,
          schema: checklistJsonSchema,
        },
      },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return previous ?? emptyChecklist()
    return JSON.parse(raw) as Checklist
  } catch {
    return previous ?? emptyChecklist()
  }
}

interface OrderStep {
  fields: (keyof Checklist)[]
  instruction: string
  when?: (c: Checklist, patientOnFile: boolean | undefined) => boolean
}

const needsFullProfile = (c: Checklist, patientOnFile: boolean | undefined) =>
  c.patient_type.value === 'new' || patientOnFile === false

const ORDER: OrderStep[] = [
  {
    fields: ['patient_type'],
    instruction: 'ask whether they are a new or returning patient',
  },
  {
    fields: ['first_name', 'last_name'],
    instruction: 'ask for their full name',
  },
  { fields: ['date_of_birth'], instruction: 'ask for their date of birth' },
  { fields: ['phone', 'email'], instruction: 'ask for their phone number and email' },
  {
    fields: ['address_line1', 'city', 'state', 'zip'],
    instruction: 'ask for their mailing address',
    when: needsFullProfile,
  },
  {
    fields: ['emergency_contact_name', 'emergency_contact_phone'],
    instruction: 'ask for an emergency contact name and phone number',
    when: needsFullProfile,
  },
  {
    fields: ['visit_reason'],
    instruction: 'ask what kind of visit or dental service they need',
  },
  {
    fields: ['insurance_or_self_pay'],
    instruction:
      "ask for their insurance provider name and member ID, or whether they'd like to self-pay",
  },
]

const FIELD_LABELS: Partial<Record<keyof Checklist, string>> = {
  phone: 'phone number',
  email: 'email address',
  address_line1: 'street address',
  emergency_contact_name: "emergency contact's name",
  emergency_contact_phone: "emergency contact's phone number",
}

export function getNextGatheringDirective(
  checklist: Checklist,
  patientOnFile: boolean | undefined
): string | null {
  for (const step of ORDER) {
    if (step.when && !step.when(checklist, patientOnFile)) continue
    const missing = step.fields.filter((f) => !checklist[f].known)
    if (missing.length === 0) continue
    if (missing.length === step.fields.length) {
      return step.instruction
    }
    const labels = missing.map((f) => FIELD_LABELS[f] ?? String(f).replace(/_/g, ' '))
    return `ask for their ${labels.join(' and ')}`
  }
  return null
}

export function renderKnownValues(checklist: Checklist): string {
  const lines: string[] = []
  if (checklist.first_name.known || checklist.last_name.known) {
    lines.push(
      `Name: ${[checklist.first_name.value, checklist.last_name.value]
        .filter(Boolean)
        .join(' ')}`
    )
  }
  if (checklist.patient_type.known)
    lines.push(`Patient type: ${checklist.patient_type.value}`)
  if (checklist.date_of_birth.known)
    lines.push(`Date of birth: ${checklist.date_of_birth.value}`)
  if (checklist.phone.known) lines.push(`Phone: ${checklist.phone.value}`)
  if (checklist.email.known) lines.push(`Email: ${checklist.email.value}`)
  if (
    checklist.address_line1.known ||
    checklist.city.known ||
    checklist.state.known ||
    checklist.zip.known
  ) {
    lines.push(
      `Address: ${[
        checklist.address_line1.value,
        checklist.city.value,
        checklist.state.value,
        checklist.zip.value,
      ]
        .filter(Boolean)
        .join(', ')}`
    )
  }
  if (checklist.emergency_contact_name.known || checklist.emergency_contact_phone.known) {
    lines.push(
      `Emergency contact: ${[
        checklist.emergency_contact_name.value,
        checklist.emergency_contact_phone.value,
      ]
        .filter(Boolean)
        .join(', ')}`
    )
  }
  if (checklist.visit_reason.known)
    lines.push(`Visit reason: ${checklist.visit_reason.value}`)
  if (checklist.insurance_or_self_pay.known)
    lines.push(`Insurance/payment: ${checklist.insurance_or_self_pay.value}`)
  return lines.join('; ')
}

export function hasCoreIdentity(checklist: Checklist): boolean {
  return (
    checklist.patient_type.known &&
    checklist.first_name.known &&
    checklist.last_name.known &&
    checklist.date_of_birth.known &&
    checklist.phone.known &&
    checklist.email.known
  )
}

export function hasNewPatientExtras(checklist: Checklist): boolean {
  return (
    checklist.address_line1.known &&
    checklist.city.known &&
    checklist.state.known &&
    checklist.zip.known &&
    checklist.emergency_contact_name.known &&
    checklist.emergency_contact_phone.known
  )
}
