import type { RawIdea, Platform } from '../types'

export async function crawlIndieHackers(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://www.indiehackers.com/api/v1/posts?sort=hot&limit=15', {
    headers: { 'User-Agent': 'IdeaHub/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) {
    // Indie Hackers API 可能需要认证，fallback 到爬取首页
    return crawlIndieHackersFallback()
  }
  const data = await resp.json()
  for (const post of (data.posts || []).slice(0, 15)) {
    results.push({
      title: post.title || 'Untitled',
      description: post.description || post.title || '',
      platform: 'other' as Platform,
      sourceUrl: `https://www.indiehackers.com/post/${post.slug || post.id}`,
      publishedAt: post.published_at || new Date().toISOString(),
      heat: post.upvotes || 0,
    })
  }
  return results
}

async function crawlIndieHackersFallback(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://www.indiehackers.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) return results
  const html = await resp.text()

  const regex = /"title"\s*:\s*"([^"]{10,120})"/g
  let match
  const seen = new Set<string>()
  while ((match = regex.exec(html)) !== null && results.length < 15) {
    const title = match[1].replace(/\\"/g, '"')
    if (seen.has(title)) continue
    seen.add(title)
    results.push({
      title,
      description: title,
      platform: 'other' as Platform,
      sourceUrl: 'https://www.indiehackers.com/',
      publishedAt: new Date().toISOString(),
      heat: 0,
    })
  }
  return results
}
