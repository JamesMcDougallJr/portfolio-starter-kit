import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    bearerRequired: Boolean(process.env.AGENT_BEARER_TOKEN),
  })
}
