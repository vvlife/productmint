import type { RawIdea, Idea, CrawlStats } from '../types'
import { categorize } from '../categorize'
import { filterAds } from '../filter'
import { crawlAllFeeds } from '../rss-fetcher'

export interface CrawlResult {
  ideas: Idea[]
  stats: CrawlStats
}

export async function crawlAll(): Promise<CrawlResult> {
  const errors: string[] = []
  const byPlatform: Record<string, number> = {}

  let allRawIdeas: RawIdea[] = []

  try {
    allRawIdeas = await crawlAllFeeds()
    byPlatform['RSS'] = allRawIdeas.length
  } catch (e: any) {
    errors.push(`RSS feeds: ${e?.message || 'unknown error'}`)
  }

  const filteredIdeas = filterAds(allRawIdeas)
  const filteredCount = allRawIdeas.length - filteredIdeas.length

  const ideas: Idea[] = filteredIdeas.map((raw, index) => {
    const category = categorize(raw.title, raw.description)
    return {
      id: `idea_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      title: raw.title,
      description: raw.description,
      platform: raw.platform,
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      heat: raw.heat,
      category,
    }
  })

  const stats: CrawlStats = {
    totalFetched: allRawIdeas.length,
    filteredCount,
    byPlatform,
    collectionsFormed: 0,
    errors,
  }

  return { ideas, stats }
}
