import type { RawIdea, Platform } from '../types'

// ── GitHub: search for feature-request / idea issues ──────────
// Reddit API blocks unauthenticated access since 2023.
// We use GitHub search API instead (60 req/hour without auth).
export async function crawlReddit(): Promise<RawIdea[]> {
  const queries = [
    'label:feature-request',
    'label:enhancement',
    'label:idea',
  ]

  const results: RawIdea[] = []

  for (const q of queries.slice(0, 1)) {
    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q + ' is:issue sort:created-desc')}&per_page=10`
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'IdeaHub/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!resp.ok) {
        // Rate limited or error — skip gracefully
        continue
      }

      const data = await resp.json() as {
        items: Array<{
          title: string
          body: string | null
          html_url: string
          comments: number
          created_at: string
          repository_url: string
        }>
      }

      for (const item of data.items || []) {
        const repoMatch = item.repository_url?.match(/repos\/(.+)$/)
        const repoName = repoMatch?.[1] || 'unknown'

        results.push({
          title: item.title,
          description: (item.body || '').replace(/<[^>]*>/g, '').slice(0, 200) || item.title,
          platform: 'github' as Platform,
          sourceUrl: item.html_url,
          publishedAt: item.created_at,
          heat: item.comments || 0,
        })
      }
    } catch {
      // Individual query failure is fine
    }
  }

  return results
}
