import { NextResponse } from 'next/server'
import { triggerCrawl } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await triggerCrawl()
    return NextResponse.json({
      success: true,
      ideas: result.ideas,
      collections: result.collections,
      ...result.response,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    message: 'RSS feed crawler is built-in, no external server needed',
  })
}
