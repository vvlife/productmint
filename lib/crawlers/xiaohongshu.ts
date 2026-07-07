import type { RawIdea, Platform } from '../types'
import { crawlUrl, isCrawlServerAvailable } from '../crawl4ai-client'

// 小红书 - 用户真实的产品需求和吐槽
export async function crawlXiaohongshu(): Promise<RawIdea[]> {
  const results: RawIdea[] = []

  if (await isCrawlServerAvailable()) {
    try {
      // 搜索产品需求相关关键词
      const keywords = ['好用的app推荐', '想要一个工具', '有没有软件可以', '求推荐工具', '产品需求']
      const keyword = keywords[Math.floor(Math.random() * keywords.length)]
      const encoded = encodeURIComponent(keyword)
      const result = await crawlUrl(`https://www.xiaohongshu.com/search_result?keyword=${encoded}&source=web_search_result_notes`)
      if (result.success && result.markdown) {
        return parseXhsMarkdown(result.markdown)
      }
    } catch {}
  }

  return results
}

function parseXhsMarkdown(md: string): RawIdea[] {
  const results: RawIdea[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    // 找笔记标题
    if (line.length > 10 && line.length < 200 && !line.startsWith('!') && !line.startsWith('#')) {
      const clean = line.trim()
      if (clean.length > 8 && !clean.includes('小红书') && !clean.includes('登录')) {
        results.push({
          title: clean.slice(0, 100),
          description: clean,
          platform: 'xiaohongshu' as Platform,
          sourceUrl: 'https://www.xiaohongshu.com',
          publishedAt: new Date().toISOString(),
          heat: 0,
        })
      }
    }
    if (results.length >= 15) break
  }
  return results
}
