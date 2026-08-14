#!/usr/bin/env node
/**
 * Exercises the dental scheduling agent's evaluator endpoint
 * (`POST /api/dental-agent`) the same way Podium's interview evaluator will:
 * drives full booking conversations turn-by-turn and checks every response
 * against the documented "Candidate Agent Evaluation Protocol"
 * (<dental-api-base-url>/agent-protocol.md).
 *
 * Only protocol-schema violations (bad status, malformed JSON, wrong echoed
 * ids, timeouts, oversized bodies, non-idempotent replays, redirects) fail
 * the run. Conversational drift (the agent asking things in a different
 * order than scripted) is handled by falling back to generic nudge lines
 * and only produces a warning, never a failure.
 *
 * Usage:
 *   node scripts/test-dental-agent.mjs \
 *     --base-url https://dental.play.podium-dev.com \
 *     --api-key cand_xxx \
 *     [--agent-url http://localhost:3000/api/dental-agent] \
 *     [--bearer-token xxx] \
 *     [--cookie 'name=value; other=value'] \
 *     [--scenario new-patient-self-pay] \
 *     [--verbose]
 *
 * `--cookie` is only needed when the agent URL sits behind something like
 * Vercel's preview-deployment protection (e.g. a `_vercel_share` bypass
 * cookie) — pass the raw Cookie header value and it's sent on every turn.
 *
 * `--base-url`/`--api-key` are interview-specific credentials issued by the
 * interviewer — there is no safe default, so the script fails fast if
 * they're missing from both flags and env vars.
 *
 * Idempotency check caveat: the target route caches per-(run_id, turn_id)
 * responses in Redis; if the target environment has no
 * UPSTASH_REDIS_REST_URL/TOKEN configured, that cache is a no-op and a
 * replayed turn could legitimately re-invoke the LLM and differ. That's a
 * deployment-config issue, not something this script can distinguish from a
 * real protocol bug — treat an idempotency failure against an
 * unconfigured-Redis target as inconclusive.
 */

import { performance } from 'node:perf_hooks'

const PROTOCOL_VERSION = 'candidate-agent/1'
const MAX_RESPONSE_BYTES = 256 * 1024
const TIMEOUT_MS = 20_000
const MAX_TURNS = 25

// ---------------------------------------------------------------------------
// CLI / env config
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const name = arg.slice(2)
    if (name === 'verbose') {
      flags.verbose = true
      continue
    }
    flags[name] = argv[++i]
  }

  const config = {
    agentUrl: flags['agent-url'] ?? process.env.AGENT_URL ?? 'http://localhost:3000/api/dental-agent',
    baseUrl: flags['base-url'] ?? process.env.DENTAL_API_BASE_URL,
    apiKey: flags['api-key'] ?? process.env.DENTAL_API_KEY,
    bearerToken: flags['bearer-token'] ?? process.env.AGENT_BEARER_TOKEN,
    cookie: flags['cookie'] ?? process.env.AGENT_COOKIE,
    scenario: flags['scenario'] ?? 'all',
    verbose: Boolean(flags.verbose),
  }

  const missing = []
  if (!config.baseUrl) missing.push('--base-url (or DENTAL_API_BASE_URL)')
  if (!config.apiKey) missing.push('--api-key (or DENTAL_API_KEY)')
  if (missing.length > 0) {
    console.error(
      `Missing required scheduling-API credentials: ${missing.join(', ')}.\n` +
        'These are interview-specific and must be supplied — there is no default.\n\n' +
        'Usage: node scripts/test-dental-agent.mjs --base-url <url> --api-key <key> [--agent-url <url>] [--bearer-token <token>] [--cookie <header-value>] [--scenario <name>] [--verbose]'
    )
    process.exit(1)
  }

  config.docsUrl = `${config.baseUrl}/agent-protocol.md`
  return config
}

// ---------------------------------------------------------------------------
// Scenario data
// ---------------------------------------------------------------------------

const SCENARIOS = {
  'new-patient-self-pay': {
    description: 'New patient, self-pay, books a cleaning',
    turns: [
      "Hi, I'm a new patient and I'd like to book an appointment.",
      'My name is Jordan Rivera.',
      'My date of birth is March 4th, 1990.',
      'My phone is 555-201-3344 and my email is jordan.rivera@example.com.',
      '482 Maple Street, Springfield, IL, 62704.',
      'Emergency contact is Alex Rivera, 555-201-9988.',
      'I need a routine cleaning and checkup.',
      "I'll be self-pay, no insurance.",
    ],
    confirmLine: "Yes, that's all correct, please go ahead.",
    pickSlotLine: 'The first available option works for me.',
  },
  'returning-patient-insurance': {
    description: 'Returning patient, uses insurance, books a visit',
    turns: [
      "Hi, I'm a returning patient and I'd like to book an appointment.",
      'My name is Casey Nguyen, date of birth June 12th, 1985.',
      'My phone is 555-887-2244 and my email is casey.nguyen@example.com.',
      'I have a toothache and need to be seen.',
      'My insurance is Delta Dental, member ID DD-4471209.',
    ],
    confirmLine: "Yes, that's all correct, please go ahead.",
    pickSlotLine: 'The first available option works for me.',
  },
}

// ---------------------------------------------------------------------------
// Protocol client
// ---------------------------------------------------------------------------

async function sendTurn({ agentUrl, bearerToken, cookie, body }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const startedAt = performance.now()

  let res
  try {
    res = await fetch(agentUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    return { networkError: err, elapsedMs: performance.now() - startedAt }
  } finally {
    clearTimeout(timer)
  }

  const elapsedMs = performance.now() - startedAt
  const redirected = res.status >= 300 && res.status < 400
  const text = await res.text()
  const byteLength = Buffer.byteLength(text, 'utf8')

  let json
  let parseError
  try {
    json = JSON.parse(text)
  } catch (err) {
    parseError = err
  }

  return { httpStatus: res.status, redirected, rawText: text, byteLength, json, parseError, elapsedMs }
}

// ---------------------------------------------------------------------------
// Validators — the only things that fail the run
// ---------------------------------------------------------------------------

function validateTurnResponse(result, expected) {
  const checks = []
  const check = (name, pass, detail) => checks.push({ name, pass, detail })

  if (result.networkError) {
    check('network', false, result.networkError.message)
    return checks
  }

  check('timing (<20s)', result.elapsedMs <= TIMEOUT_MS, `${Math.round(result.elapsedMs)}ms`)
  check('http status 200', result.httpStatus === 200, `got ${result.httpStatus}`)
  check('no redirect', !result.redirected, `got ${result.httpStatus}`)
  check('response size (<=256 KiB)', result.byteLength <= MAX_RESPONSE_BYTES, `${result.byteLength} bytes`)
  check('valid JSON', !result.parseError, result.parseError?.message)

  if (result.parseError || !result.json) return checks

  const { json } = result
  check(
    'protocol_version echoed',
    json.protocol_version === expected.protocolVersion,
    `got ${JSON.stringify(json.protocol_version)}`
  )
  check('run_id echoed', json.run_id === expected.runId, `got ${JSON.stringify(json.run_id)}`)
  check('turn_id echoed', json.turn_id === expected.turnId, `got ${JSON.stringify(json.turn_id)}`)
  check(
    'output.message is non-empty string',
    typeof json.output?.message === 'string' && json.output.message.trim().length > 0,
    `got ${JSON.stringify(json.output?.message)}`
  )
  check(
    'status is continue|complete',
    json.status === 'continue' || json.status === 'complete',
    `got ${JSON.stringify(json.status)}`
  )

  return checks
}

// ---------------------------------------------------------------------------
// Conversation driver
// ---------------------------------------------------------------------------

function buildRequestBody({ config, runId, turnId, turnNumber, message, history }) {
  return {
    protocol_version: PROTOCOL_VERSION,
    run_id: runId,
    turn_id: turnId,
    turn_number: turnNumber,
    input: { message, history },
    resources: {
      dental_api: { base_url: config.baseUrl, api_key: config.apiKey, docs_url: config.docsUrl },
    },
  }
}

async function runScenario(name, scenario, config) {
  console.log(`\n=== Scenario: ${name} — ${scenario.description} ===`)

  const runId = crypto.randomUUID()
  const history = []
  const scriptedLines = [...scenario.turns]
  const scenarioResult = { name, turnResults: [], warnings: [], reachedComplete: false, lastTurn: null }

  let turnNumber = 0
  let status = 'continue'

  while (status !== 'complete' && turnNumber < MAX_TURNS) {
    turnNumber++

    let message
    if (scriptedLines.length > 0) {
      message = scriptedLines.shift()
    } else {
      message = turnNumber % 2 === 0 ? scenario.pickSlotLine : scenario.confirmLine
      scenarioResult.warnings.push(
        `turn ${turnNumber}: scripted lines exhausted, used fallback nudge — agent conversation diverged from the scripted assumption`
      )
      console.warn(`  ⚠ scripted lines exhausted, using fallback nudge`)
    }

    const turnId = crypto.randomUUID()
    const body = buildRequestBody({ config, runId, turnId, turnNumber, message, history: [...history] })

    console.log(`Patient: ${message}`)
    const result = await sendTurn({
      agentUrl: config.agentUrl,
      bearerToken: config.bearerToken,
      cookie: config.cookie,
      body,
    })
    const checks = validateTurnResponse(result, { protocolVersion: PROTOCOL_VERSION, runId, turnId })
    scenarioResult.turnResults.push({ turnNumber, checks })

    const failed = checks.filter((c) => !c.pass)
    for (const f of failed) console.error(`  ✗ FAIL [${f.name}]: ${f.detail}`)
    if (config.verbose) console.log('  raw:', result.rawText)

    const agentMessage = result.json?.output?.message ?? '(no message — see failures above)'
    console.log(`Agent: ${agentMessage}`)

    history.push({ role: 'patient', content: message })
    history.push({ role: 'agent', content: agentMessage })

    scenarioResult.lastTurn = { runId, turnId, body, response: result }
    status = result.json?.status

    if (status === 'complete') scenarioResult.reachedComplete = true
  }

  if (!scenarioResult.reachedComplete) {
    scenarioResult.warnings.push(
      `scenario did not reach status "complete" within ${MAX_TURNS} turns — may indicate a conversational/business-logic issue, not necessarily a protocol violation`
    )
    console.warn(`  ⚠ scenario never reached "complete" within ${MAX_TURNS} turns`)
  }

  return scenarioResult
}

async function testIdempotency(config, lastTurn) {
  if (!lastTurn) return { name: 'idempotency replay', pass: false, detail: 'no prior turn to replay' }

  const replay = await sendTurn({
    agentUrl: config.agentUrl,
    bearerToken: config.bearerToken,
    cookie: config.cookie,
    body: lastTurn.body,
  })
  const identical = replay.rawText === lastTurn.response.rawText
  return {
    name: 'idempotency replay',
    pass: identical,
    detail: identical
      ? undefined
      : 'replayed (run_id, turn_id) returned a different response body — if the target has no Redis configured this may be a false positive, not a real protocol bug',
  }
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

function summarize(results) {
  console.log('\n=== Summary ===')
  let anyFailure = false

  for (const r of results) {
    const allChecks = r.turnResults.flatMap((t) => t.checks)
    const failed = allChecks.filter((c) => !c.pass)
    const status = failed.length === 0 && r.idempotency.pass ? 'PASS' : 'FAIL'
    if (status === 'FAIL') anyFailure = true

    console.log(`\n${r.name}: ${status} (${allChecks.length - failed.length}/${allChecks.length} checks passed)`)
    for (const t of r.turnResults) {
      for (const c of t.checks.filter((c) => !c.pass)) {
        console.log(`  ✗ turn ${t.turnNumber} [${c.name}]: ${c.detail}`)
      }
    }
    if (!r.idempotency.pass) console.log(`  ✗ [${r.idempotency.name}]: ${r.idempotency.detail}`)
    for (const w of r.warnings) console.log(`  ⚠ ${w}`)
  }

  console.log(`\n${anyFailure ? 'FAILED' : 'ALL PASSED'}`)
  return anyFailure
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = parseArgs(process.argv.slice(2))

  const scenarioNames = config.scenario === 'all' ? Object.keys(SCENARIOS) : [config.scenario]
  for (const name of scenarioNames) {
    if (!SCENARIOS[name]) {
      console.error(`Unknown scenario "${name}". Available: ${Object.keys(SCENARIOS).join(', ')}`)
      process.exit(1)
    }
  }

  const results = []
  for (const name of scenarioNames) {
    const scenarioResult = await runScenario(name, SCENARIOS[name], config)
    scenarioResult.idempotency = await testIdempotency(config, scenarioResult.lastTurn)
    results.push(scenarioResult)
  }

  const anyFailure = summarize(results)
  process.exitCode = anyFailure ? 1 : 0
}

main()
