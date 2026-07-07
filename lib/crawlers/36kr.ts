import type { RawIdea, Platform } from '../types'

export async function crawl36kr(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://36kr.com/newsflashes', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`36kr returned ${resp.status}`)
  const html = await resp.text()

  // 提取新闻条目
  const itemRegex = /<a[^>]*href="\/p\/(\d+)"[^>]*>([^<]+)<\/a>/g
  let match
  const seen = new Set<string>()

  while ((match = itemRegex.exec(html)) !== null && results.length < 15) {
    const title = match[2].trim()
    const id = match[1]
    if (title.length < 5 || seen.has(id)) continue
    seen.add(id)
    results.push({
      title,
      description: title,
      platform: 'other' as Platform,
      sourceUrl: `https://36kr.com/p/${id}`,
      publishedAt: new Date().toISOString(),
      heat: 0,
    })
  }
  return results
}
