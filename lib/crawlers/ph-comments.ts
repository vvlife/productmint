import type { RawIdea, Platform } from '../types'
import { crawlUrl, isCrawlServerAvailable } from '../crawl4ai-client'

// Product Hunt 评论 - 用户在评论区表达的需求
export async function crawlPHComments(): Promise<RawIdea[]> {
  const results: RawIdea[] = []

  if (await isCrawlServerAvailable()) {
    try {
      const result = await crawlUrl('https://www.producthunt.com/')
      if (result.success && result.markdown) {
        return parsePhMarkdown(result.markdown)
      }
    } catch {}
  }

  return results
}

function parsePhMarkdown(md: string): RawIdea[] {
  const results: RawIdea[] = []
  const lines = md.split('\n')

  let currentProduct = ''
  for (const line of lines) {
    // 找产品名
    if (line.startsWith('## ') || line.startsWith('### ')) {
      currentProduct = line.replace(/^#{2,3}\s*/, '').trim()
    }
    // 找评论中的需求
    if (line.includes('wish') || line.includes('need') || line.includes('looking for') ||
        line.includes('would be great') || line.includes('suggestion') || line.includes('feature request')) {
      const clean = line.replace(/^[-*]\s*/, '').trim()
      if (clean.length > 15 && clean.length < 300) {
        results.push({
          title: currentProduct ? `[${currentProduct}] ${clean.slice(0, 80)}` : clean.slice(0, 100),
          description: clean,
          platform: 'producthunt' as Platform,
          sourceUrl: 'https://www.producthunt.com',
          publishedAt: new Date().toISOString(),
          heat: 5,
        })
      }
    }
    if (results.length >= 10) break
  }
  return results
}
