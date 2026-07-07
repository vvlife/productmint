/**
 * News Bot Client
 * Lightweight RSS/API-based news collection, no LLM required
 */

const NEWSBOT_SERVER = process.env.NEWSBOT_SERVER_URL || 'http://127.0.0.1:8766'

interface NewsIdea {
  id: string
  title: string
  description: string
  platform: string
  sourceUrl: string
  publishedAt: string
  heat: number
  category: string
  source: string
}

interface CollectResponse {
  success: boolean
  ideas: NewsIdea[]
  total: number
  sources: string[]
  collected_at: string
}

interface SearchResponse {
  success: boolean
  ideas: NewsIdea[]
  total: number
}

export async function isNewsbotAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${NEWSBOT_SERVER}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return resp.ok
  } catch {
    return false
  }
}

export async function collectNews(
  topics: string[] = [],
  maxItems: number = 20
): Promise<CollectResponse> {
  const resp = await fetch(`${NEWSBOT_SERVER}/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topics, max_items: maxItems }),
    signal: AbortSignal.timeout(60000),
  })
  if (!resp.ok) throw new Error(`NewsBot collect error: ${resp.status}`)
  return resp.json()
}

export async function searchNews(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  const resp = await fetch(`${NEWSBOT_SERVER}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
    signal: AbortSignal.timeout(30000),
  })
  if (!resp.ok) throw new Error(`NewsBot search error: ${resp.status}`)
  return resp.json()
}
