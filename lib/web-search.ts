/**
 * Web search via DuckDuckGo (no API key needed)
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

interface SearchResult {
  title: string
  description: string
  url: string
}

export async function webSearch(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      t: 'h_',
      ia: 'web',
    })

    const resp = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (!resp.ok) return []

    const html = await resp.text()
    const results: SearchResult[] = []

    // Parse DuckDuckGo HTML results
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    const links: string[] = []
    const titles: string[] = []
    const snippets: string[] = []

    let match
    while ((match = resultRegex.exec(html)) !== null) {
      // DuckDuckGo wraps URLs in redirect, extract actual URL
      const href = match[1]
      const urlMatch = href.match(/uddg=([^&]+)/)
      const url = urlMatch ? decodeURIComponent(urlMatch[1]) : href
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      if (url && title) {
        links.push(url)
        titles.push(title)
      }
    }

    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]+>/g, '').trim())
    }

    for (let i = 0; i < Math.min(titles.length, maxResults); i++) {
      results.push({
        title: titles[i],
        description: snippets[i] || '',
        url: links[i] || '',
      })
    }

    return results
  } catch {
    return []
  }
}
