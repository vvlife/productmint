import type { RawIdea, Platform } from '../types'
import { crawlUrl } from '../crawl4ai-client'
import { isCrawlServerAvailable } from '../crawl4ai-client'

// 通过 Nitter 实例或直接爬取获取推特需求
export async function crawlTwitter(): Promise<RawIdea[]> {
  // 使用搜索关键词找产品需求相关推文
  const queries = ['looking for tool', 'need app for', 'wish there was', 'is there any', 'recommend tool']
  const results: RawIdea[] = []

  if (await isCrawlServerAvailable()) {
    try {
      const q = queries[Math.floor(Math.random() * queries.length)]
      const encoded = encodeURIComponent(q)
      const result = await crawlUrl(`https://nitter.privacydev.net/search?f=tweets&q=${encoded}&since=&until=&near=`)
      if (result.success && result.markdown) {
        return parseTwitterMarkdown(result.markdown)
      }
    } catch {}
  }

  // fallback: 用公开的搜索 API
  return results
}

function parseTwitterMarkdown(md: string): RawIdea[] {
  const results: RawIdea[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    // 找推文内容
    if (line.length > 30 && line.length < 500 && !line.startsWith('!') && !line.startsWith('[')) {
      const clean = line.replace(/@\w+/g, '').replace(/https?:\/\/\S+/g, '').trim()
      if (clean.length > 20) {
        results.push({
          title: clean.slice(0, 100),
          description: clean,
          platform: 'twitter' as Platform,
          sourceUrl: 'https://twitter.com/search',
          publishedAt: new Date().toISOString(),
          heat: 0,
        })
      }
    }
    if (results.length >= 10) break
  }
  return results
}
