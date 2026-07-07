import type { RawIdea, Platform } from '../types'

// App Store 评论 - 用户真实的痛点和需求
export async function crawlAppStoreReviews(): Promise<RawIdea[]> {
  const results: RawIdea[] = []

  // 搜索热门应用的低分评论（用户痛点）
  const apps = [
    { id: '553834731', name: 'Notion' },      // Notion
    { id: '1455887714', name: 'Figma' },       // Figma
    { id: '1091189906', name: 'Slack' },       // Slack
    { id: '1480457110', name: 'Canva' },       // Canva
    { id: '904237743', name: 'Trello' },       // Trello
  ]

  for (const app of apps.slice(0, 3)) {
    try {
      const resp = await fetch(
        `https://itunes.apple.com/rss/customerreviews/id=${app.id}/sortBy=mostRecent/json`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!resp.ok) continue
      const data = await resp.json()
      const entries = data?.feed?.entry || []

      for (const entry of entries) {
        const rating = parseInt(entry['im:rating']?.label || '5')
        const content = entry.content?.label || ''
        const title = entry.title?.label || ''

        // 只要低分评论（用户痛点）
        if (rating <= 3 && content.length > 20) {
          results.push({
            title: `${app.name} 用户反馈: ${title || content.slice(0, 60)}`.slice(0, 120),
            description: content.slice(0, 300),
            platform: 'other' as Platform,
            sourceUrl: `https://apps.apple.com/app/id${app.id}`,
            publishedAt: new Date().toISOString(),
            heat: (5 - rating) * 10, // 评分越低热度越高
          })
        }
      }
    } catch {}
    if (results.length >= 15) break
  }

  return results
}
