import type { RawIdea, Platform } from '../types'

// ── ProductHunt RSS feed (no auth required) ────────────────────
export async function crawlProductHunt(): Promise<RawIdea[]> {
  const resp = await fetch('https://www.producthunt.com/feed', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IdeaHub/1.0)' },
    signal: AbortSignal.timeout(10000),
  })

  if (!resp.ok) throw new Error(`ProductHunt RSS returned ${resp.status}`)

  const xml = await resp.text()
  const results: RawIdea[] = []

  // Simple XML parsing (no dependency needed)
  const entries = xml.split('<entry>').slice(1)

  for (const entry of entries.slice(0, 15)) {
    const title = entry.match(/<title[^>]*>(.*?)<\/title>/)?.[1]?.trim()
    const link = entry.match(/<link[^>]*href="([^"]+)"/)?.[1]?.trim()
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim()
    const content = entry.match(/[\s\S]*?<content[^>]*>([\s\S]*?)<\/content>/)?.[1]
      ?.replace(/<[^>]+>/g, '').trim() || ''

    if (title && link) {
      results.push({
        title,
        description: content.slice(0, 200) || title,
        platform: 'producthunt' as Platform,
        sourceUrl: link,
        publishedAt: published || new Date().toISOString(),
        heat: 0,
      })
    }
  }

  return results
}
