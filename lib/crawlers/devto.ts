import type { RawIdea, Platform } from '../types'

export async function crawlDevto(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://dev.to/api/articles?per_page=15&top=7', {
    headers: { 'User-Agent': 'IdeaHub/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`Dev.to API returned ${resp.status}`)
  const articles = await resp.json()

  for (const article of articles.slice(0, 15)) {
    results.push({
      title: article.title,
      description: article.description || article.title,
      platform: 'other' as Platform,
      sourceUrl: article.url,
      publishedAt: article.published_at || new Date().toISOString(),
      heat: article.positive_reactions_count || 0,
    })
  }
  return results
}
