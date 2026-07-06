import type { RawIdea, Platform } from '../types'

// ── V2EX hot topics ────────────────────────────────────────────
// Fetch all hot topics (not just need-keyword ones) since they represent
// trending discussions that may inspire startup ideas.
export async function crawlV2EX(): Promise<RawIdea[]> {
  const resp = await fetch('https://www.v2ex.com/api/topics/hot.json', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IdeaHub/1.0)',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!resp.ok) throw new Error(`V2EX API returned ${resp.status}`)

  const topics = await resp.json() as Array<{
    id: number
    title: string
    content: string
    url: string
    replies: number
    created: number
    node?: { title: string }
    member?: { username: string }
  }>

  const results: RawIdea[] = []

  for (const topic of topics.slice(0, 15)) {
    const description = topic.content
      ? topic.content.replace(/<[^>]*>/g, '').slice(0, 200)
      : topic.title

    results.push({
      title: topic.title,
      description: description || topic.title,
      platform: 'v2ex' as Platform,
      sourceUrl: `https://www.v2ex.com/t/${topic.id}`,
      publishedAt: new Date(topic.created * 1000).toISOString(),
      heat: topic.replies || 0,
    })
  }

  return results
}
