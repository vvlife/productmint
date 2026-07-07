import type { RawIdea, Platform } from '../types'
import { isCrawlServerAvailable, crawlUrl } from '../crawl4ai-client'

// ── V2EX hot topics ────────────────────────────────────────────
export async function crawlV2EX(): Promise<RawIdea[]> {
  // 优先使用 crawl4ai 获取更丰富的内容
  if (await isCrawlServerAvailable()) {
    try {
      const result = await crawlUrl('https://www.v2ex.com/?tab=hot')
      if (result.success && result.markdown) {
        return parseV2exMarkdown(result.markdown)
      }
    } catch {}
  }

  // fallback: 原始 API
  const resp = await fetch('https://www.v2ex.com/api/topics/hot.json', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IdeaHub/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`V2EX API returned ${resp.status}`)

  const topics = await resp.json() as Array<{
    id: number; title: string; content: string; url: string
    replies: number; created: number; node?: { title: string }
  }>

  return topics.slice(0, 15).map(t => ({
    title: t.title,
    description: t.content ? t.content.replace(/<[^>]*>/g, '').slice(0, 200) : t.title,
    platform: 'v2ex' as Platform,
    sourceUrl: `https://www.v2ex.com/t/${t.id}`,
    publishedAt: new Date(t.created * 1000).toISOString(),
    heat: t.replies || 0,
  }))
}

function parseV2exMarkdown(md: string): RawIdea[] {
  const results: RawIdea[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/www\.v2ex\.com\/t\/\d+)/)
    if (linkMatch) {
      results.push({
        title: linkMatch[1].trim(),
        description: linkMatch[1].trim(),
        platform: 'v2ex' as Platform,
        sourceUrl: linkMatch[2],
        publishedAt: new Date().toISOString(),
        heat: 0,
      })
    }
    if (results.length >= 15) break
  }
  return results
}
