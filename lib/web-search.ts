/**
 * Web search via Google News RSS (works from Vercel)
 */

interface SearchResult {
  title: string
  description: string
  url: string
}

function parseRSS(xml: string): SearchResult[] {
  const items: SearchResult[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const desc = extractTag(block, 'description')
    if (title) {
      items.push({
        title: cleanHTML(title),
        description: cleanHTML(desc || title).slice(0, 200),
        url: link,
      })
    }
  }
  return items
}

function extractTag(block: string, tag: string): string {
  // Try CDATA first
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i')
  const cdataMatch = block.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()

  // Try normal tag
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const m = block.match(regex)
  return m ? m[1].trim() : ''
}

function cleanHTML(text: string): string {
  // Decode HTML entities first
  let result = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
  // Remove HTML tags
  result = result.replace(/<[^>]*>/g, '')
  // Remove markdown links
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Clean up whitespace
  result = result.replace(/\s+/g, ' ').trim()
  return result
}

export async function webSearch(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!resp.ok) return []
    const xml = await resp.text()
    return parseRSS(xml).slice(0, maxResults)
  } catch {
    return []
  }
}
