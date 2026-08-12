export interface DentalApiConfig {
  base_url: string
  api_key: string
}

export interface ToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export interface ToolDef {
  schema: ToolSchema
  run: (args: Record<string, unknown>, dentalApi: DentalApiConfig) => Promise<unknown>
}

async function callApi(
  dentalApi: DentalApiConfig,
  method: string,
  path: string,
  options: { query?: Record<string, string | number | undefined>; body?: unknown } = {}
): Promise<unknown> {
  const url = new URL(path.replace(/^\//, ''), dentalApi.base_url.replace(/\/?$/, '/'))
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dentalApi.api_key}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await res.text()
  if (!text) return { status: res.status }
  try {
    return JSON.parse(text)
  } catch {
    return { error: { code: 'INVALID_RESPONSE', message: text } }
  }
}

function tool(schema: ToolSchema, run: ToolDef['run']): ToolDef {
  return { schema, run }
}

export const tools: Record<string, ToolDef> = {
  get_practice_info: tool(
    {
      type: 'function',
      function: {
        name: 'get_practice_info',
        description:
          'Get practice metadata: name, address, phone, timezone, business hours.',
        parameters: { type: 'object', properties: {} },
      },
    },
    (_args, dentalApi) => callApi(dentalApi, 'GET', '/api/v1/practice')
  ),

  get_services: tool(
    {
      type: 'function',
      function: {
        name: 'get_services',
        description:
          'List the service catalog: codes, names, descriptions, provider types, durations, self-pay prices. Call this to find the correct service code before searching availability.',
        parameters: { type: 'object', properties: {} },
      },
    },
    (_args, dentalApi) => callApi(dentalApi, 'GET', '/api/v1/services')
  ),

  get_payers: tool(
    {
      type: 'function',
      function: {
        name: 'get_payers',
        description:
          'List insurance payer_id/name mappings. Call this to translate a patient-stated insurance provider name into a payer_id before verifying insurance.',
        parameters: { type: 'object', properties: {} },
      },
    },
    (_args, dentalApi) => callApi(dentalApi, 'GET', '/api/v1/payers')
  ),

  search_faqs: tool(
    {
      type: 'function',
      function: {
        name: 'search_faqs',
        description: 'Search office FAQs by free-text query and/or category.',
        parameters: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Natural-language search text, max 200 chars' },
            category: { type: 'string', description: 'Category slug filter, max 50 chars' },
            page: { type: 'number' },
            page_size: { type: 'number', description: '1-100, default 20' },
          },
        },
      },
    },
    (args, dentalApi) =>
      callApi(dentalApi, 'GET', '/api/v1/faqs', {
        query: {
          q: args.q as string | undefined,
          category: args.category as string | undefined,
          page: args.page as number | undefined,
          page_size: args.page_size as number | undefined,
        },
      })
  ),

  register_patient: tool(
    {
      type: 'function',
      function: {
        name: 'register_patient',
        description:
          "Register a new or returning patient. Only call this once per run after confirming the patient's details out loud — do not call it again if a patient_id is already known.",
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['new', 'returning'] },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            date_of_birth: { type: 'string', description: 'ISO date, e.g. 1990-05-14' },
            phone: { type: 'string', description: 'Format 555-555-5555' },
            email: { type: 'string' },
            address_line1: { type: 'string', description: 'New patients only' },
            city: { type: 'string', description: 'New patients only' },
            state: { type: 'string', description: 'New patients only' },
            zip: { type: 'string', description: 'New patients only' },
            emergency_contact_name: { type: 'string', description: 'New patients only' },
            emergency_contact_phone: { type: 'string', description: 'New patients only' },
          },
          required: ['status', 'first_name', 'last_name', 'date_of_birth', 'phone', 'email'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'POST', '/api/v1/patients', { body: args })
  ),

  get_patient: tool(
    {
      type: 'function',
      function: {
        name: 'get_patient',
        description: "Look up a patient's registration details by id.",
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'GET', `/api/v1/patients/${args.id}`)
  ),

  verify_insurance: tool(
    {
      type: 'function',
      function: {
        name: 'verify_insurance',
        description:
          'Verify insurance coverage for a patient, or elect self-pay. Required before searching availability. Provide either (payer_id + member_id) or self_pay: true.',
        parameters: {
          type: 'object',
          properties: {
            patient_id: { type: 'string' },
            payer_id: { type: 'string' },
            member_id: { type: 'string' },
            date_of_birth: { type: 'string' },
            self_pay: { type: 'boolean' },
          },
          required: ['patient_id'],
        },
      },
    },
    (args, dentalApi) => {
      const { patient_id, ...body } = args
      return callApi(dentalApi, 'POST', `/api/v1/patients/${patient_id}/insurance`, { body })
    }
  ),

  search_availability: tool(
    {
      type: 'function',
      function: {
        name: 'search_availability',
        description:
          'Search bookable appointment start times for a service and patient. Insurance must be verified (or self-pay elected) first.',
        parameters: {
          type: 'object',
          properties: {
            service: { type: 'string', description: 'Service code, e.g. D1110' },
            patient_id: { type: 'string' },
            from: { type: 'string', description: 'ISO date, default today' },
            to: { type: 'string', description: 'ISO date, default 14 days ahead' },
            page: { type: 'number' },
          },
          required: ['service', 'patient_id'],
        },
      },
    },
    (args, dentalApi) =>
      callApi(dentalApi, 'GET', '/api/v1/availability', {
        query: {
          service: args.service as string,
          patient_id: args.patient_id as string,
          from: args.from as string | undefined,
          to: args.to as string | undefined,
          page: args.page as number | undefined,
        },
      })
  ),

  create_hold: tool(
    {
      type: 'function',
      function: {
        name: 'create_hold',
        description:
          'Temporarily hold a slot (5 minutes) prior to booking. Do this right before confirming, since holds expire quickly.',
        parameters: {
          type: 'object',
          properties: {
            slot_id: { type: 'string' },
            patient_id: { type: 'string' },
            service: { type: 'string' },
          },
          required: ['slot_id', 'patient_id', 'service'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'POST', '/api/v1/holds', { body: args })
  ),

  book_appointment: tool(
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description:
          'Confirm a held slot into a booked appointment using a hold_id from create_hold. Idempotent for an already-used hold.',
        parameters: {
          type: 'object',
          properties: {
            hold_id: { type: 'string' },
            notes: { type: 'string', description: 'Optional, max 255 chars' },
          },
          required: ['hold_id'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'POST', '/api/v1/appointments', { body: args })
  ),

  get_appointment: tool(
    {
      type: 'function',
      function: {
        name: 'get_appointment',
        description: 'Retrieve appointment details by id.',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'GET', `/api/v1/appointments/${args.id}`)
  ),

  cancel_appointment: tool(
    {
      type: 'function',
      function: {
        name: 'cancel_appointment',
        description:
          'Cancel a booked appointment and reopen its slot. Only use this if the patient explicitly asks to cancel or change an existing booking.',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    (args, dentalApi) => callApi(dentalApi, 'DELETE', `/api/v1/appointments/${args.id}`)
  ),
}

export const toolSchemas: ToolSchema[] = Object.values(tools).map((t) => t.schema)
