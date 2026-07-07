import { NextResponse } from 'next/server'
import { search } from '@/lib/store'
import { isNewsbotAvailable, searchNews } from '@/lib/newsbot-client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const source = searchParams.get('source') || 'local'

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 })
  }

  // NewsBot-only search
  if (source === 'newsbot' && (await isNewsbotAvailable())) {
    try {
      const result = await searchNews(q, 20)
      return NextResponse.json({
        results: result.ideas.map((item, idx) => ({
          type: 'idea' as const,
          id: item.id || `newsbot_${idx}`,
          title: item.title,
          description: item.description,
          platform: 'other',
          sourceUrl: item.sourceUrl || '',
          publishedAt: item.publishedAt || new Date().toISOString(),
          heat: item.heat || 0,
          category: item.category || '其他',
        })),
        total: result.total,
        source: 'newsbot',
      })
    } catch (e: any) {
      return NextResponse.json({
        results: [],
        total: 0,
        error: e?.message || 'NewsBot search failed',
        source: 'newsbot',
      })
    }
  }

  // Default: local search (with NewsBot fallback in store.search)
  const results = await search(q)
  return NextResponse.json(results)
}
