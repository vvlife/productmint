/**
 * Web search via DuckDuckGo API (no scraping needed)
 */

interface SearchResult {
  title: string
  description: string
  url: string
}

export async function webSearch(query: string, maxResults: number = 10): Promise<SearchResult[]> {
  try {
    const resp = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!resp.ok) return []

    const data = await resp.json()
    const results: SearchResult[] = []

    // Add abstract if available
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        description: data.AbstractText,
        url: data.AbstractURL,
      })
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults) break
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
            description: topic.Text,
            url: topic.FirstURL,
          })
        }
        // Handle sub-topics
        if (topic.Topics) {
          for (const sub of topic.Topics) {
            if (results.length >= maxResults) break
            if (sub.Text && sub.FirstURL) {
              results.push({
                title: sub.Text.split(' - ')[0] || sub.Text.substring(0, 60),
                description: sub.Text,
                url: sub.FirstURL,
              })
            }
          }
        }
      }
    }

    return results.slice(0, maxResults)
  } catch {
    return []
  }
}
