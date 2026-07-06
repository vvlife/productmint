import { NextResponse } from 'next/server'
import { triggerCrawl, getLastCrawlTime } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await triggerCrawl()
    // Return ideas + collections + meta so frontend can cache
    return NextResponse.json({
      success: true,
      message: result.response.message,
      crawledAt: result.response.crawledAt,
      newItems: result.response.newItems,
      stats: result.response.stats,
      ideas: result.ideas,
      collections: result.collections,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Crawl failed: ${error?.message || 'unknown error'}`,
      crawledAt: new Date().toISOString(),
      newItems: 0,
      ideas: [],
      collections: [],
    }, { status: 500 })
  }
}

export async function GET() {
  const lastCrawlAt = getLastCrawlTime()
  return NextResponse.json({
    success: true,
    lastCrawlAt,
    message: lastCrawlAt
      ? `Last crawl was at ${lastCrawlAt}`
      : 'No crawl has been performed yet.',
  })
}
