import type { RawIdea, Platform } from '../types'

export async function crawlSSPAI(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://sspai.com/api/v1/articles?limit=15&sort=hot', {
    headers: { 'User-Agent': 'IdeaHub/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`SSPAI API returned ${resp.status}`)
  const data = await resp.json()

  for (const article of (data.data || []).slice(0, 15)) {
    results.push({
      title: article.title || 'Untitled',
      description: article.summary || article.title || '',
      platform: 'other' as Platform,
      sourceUrl: `https://sspai.com/post/${article.id}`,
      publishedAt: article.created_at || new Date().toISOString(),
      heat: article.like_count || 0,
    })
  }
  return results
}
