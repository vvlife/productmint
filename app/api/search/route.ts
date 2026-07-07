import { NextResponse } from 'next/server'
import { search } from '@/lib/store'
import { crawlAllFeeds } from '@/lib/rss-fetcher'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 })
  }

  // 1. Search local cache
  const localResults = await search(q)

  // 2. Also search RSS feeds live
  let liveResults: any[] = []
  try {
    const allFeeds = await crawlAllFeeds()
    const query = q.toLowerCase()
    liveResults = allFeeds
      .filter(item => {
        const text = `${item.title} ${item.description}`.toLowerCase()
        return text.includes(query)
      })
      .slice(0, 10)
      .map((item, idx) => ({
        type: 'idea' as const,
        id: `live_${Date.now()}_${idx}`,
        title: item.title,
        description: item.description,
        platform: 'other',
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt,
        heat: item.heat,
        category: '其他',
      }))
  } catch {}

  // 3. Merge: local first, then live (dedup by title)
  const seenTitles = new Set(localResults.results.map((r: any) => r.title?.toLowerCase()))
  const uniqueLive = liveResults.filter((r: any) => !seenTitles.has(r.title?.toLowerCase()))

  return NextResponse.json({
    results: [...localResults.results, ...uniqueLive],
    total: localResults.results.length + uniqueLive.length,
  })
}
