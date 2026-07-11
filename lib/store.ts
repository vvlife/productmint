import type { Idea, Collection, CrawlResponse, CrawlStats, FeedResponse } from './types'
import { crawlAllFeeds } from './rss-fetcher'
import { clusterIdeas } from './cluster'
import { filterAds } from './filter'
import { categorize } from './categorize'

// ── In-memory cache (per serverless instance) ─────────────────
let _ideas: Idea[] = []
let _collections: Collection[] = []
let _lastCrawlAt: string | null = null

// ── Trigger crawl: returns full data ──────────────────────────
export async function triggerCrawl(): Promise<{
  ideas: Idea[]
  collections: Collection[]
  response: CrawlResponse
}> {
  const rawIdeas = await crawlAllFeeds()
  const filtered = filterAds(rawIdeas)

  // Convert RawIdea → Idea
  const newIdeas: Idea[] = filtered.map((raw, i) => ({
    id: `crawl-${Date.now()}-${i}`,
    title: raw.title,
    description: raw.description,
    platform: raw.platform,
    sourceUrl: raw.sourceUrl,
    publishedAt: raw.publishedAt,
    heat: raw.heat,
    category: categorize(raw.title, raw.description),
  }))

  // Merge with existing (dedup by sourceUrl + title)
  const existingUrls = new Set(_ideas.map(i => i.sourceUrl))
  const existingTitles = new Set(_ideas.map(i => i.title.toLowerCase().trim()))
  const uniqueNew = newIdeas.filter(i =>
    !existingUrls.has(i.sourceUrl) &&
    !existingTitles.has(i.title.toLowerCase().trim())
  )

  const allIdeas = [..._ideas, ...uniqueNew]
  const { ideas: clusteredIdeas, collections: newCollections } = clusterIdeas(allIdeas, 0.4)

  _ideas = clusteredIdeas
  _collections = newCollections
  const crawledAt = new Date().toISOString()
  _lastCrawlAt = crawledAt

  const stats: CrawlStats = {
    totalFetched: rawIdeas.length,
    filteredCount: rawIdeas.length - filtered.length,
    byPlatform: {},
    collectionsFormed: newCollections.length,
    errors: [],
  }

  return {
    ideas: clusteredIdeas,
    collections: newCollections,
    response: {
      success: true,
      message: `Crawled ${stats.totalFetched} items. ${uniqueNew.length} new. ${stats.filteredCount} filtered.`,
      crawledAt,
      newItems: uniqueNew.length,
      stats,
    },
  }
}

// ── Get current cached data (auto-crawl if empty) ─────────────
export async function getFeed(category?: string): Promise<FeedResponse> {
  if (_ideas.length === 0) {
    await triggerCrawl()
  }

  let filtered = _ideas
  if (category && category !== 'all') {
    filtered = filtered.filter(i => i.category === category)
  }
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  return { ideas: sorted, collections: _collections, total: sorted.length }
}

export async function getCollections(category?: string) {
  let filtered = _collections
  if (category && category !== 'all') {
    filtered = filtered.filter(c => c.category === category)
  }
  return { collections: filtered, total: filtered.length }
}

export async function getCollectionById(id: string) {
  const collection = _collections.find(c => c.id === id)
  if (!collection) return null
  return {
    collection,
    ideas: _ideas.filter(i => i.collectionId === id),
  }
}

export async function search(query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return { results: [], total: 0 }

  if (_ideas.length === 0) {
    await triggerCrawl()
  }

  const matchedIdeas = _ideas.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q)
  )
  const matchedCollections = _collections.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.summary.toLowerCase().includes(q)
  )

  const results = [
    ...matchedIdeas.map(i => ({ type: 'idea' as const, ...i })),
    ...matchedCollections.map(c => ({
      type: 'collection' as const,
      id: c.id, title: c.title, summary: c.summary,
      category: c.category, ideaCount: c.ideaIds.length,
    })),
  ].sort((a: any, b: any) => (b.heat ?? 0) - (a.heat ?? 0))

  return { results, total: results.length }
}

export function getLastCrawlTime() { return _lastCrawlAt }

export async function getIdeaById(id: string) {
  return _ideas.find(i => i.id === id)
}

export async function getRelatedIdeas(category: string, excludeId?: string, limit = 5) {
  return _ideas
    .filter(i => i.category === category && i.id !== excludeId)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, limit)
}
