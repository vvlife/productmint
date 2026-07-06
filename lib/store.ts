import { ideas as mockIdeas, collections as mockCollections } from './data'
import type { Idea, Collection, Category, FeedResponse, CollectionsResponse, SearchResponse, CollectionResult, CrawlResponse } from './types'

// ── In-memory store (simulates a database) ─────────────────────
let _ideas: Idea[] = [...mockIdeas]
let _collections: Collection[] = [...mockCollections]

// ── Feed ───────────────────────────────────────────────────────
export function getFeed(category?: Category | 'all'): FeedResponse {
  let filtered = _ideas
  if (category && category !== 'all') {
    filtered = filtered.filter(i => i.category === category)
  }
  // Sort by publishedAt descending
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  return {
    ideas: sorted,
    collections: _collections,
    total: sorted.length,
  }
}

// ── Collections ────────────────────────────────────────────────
export function getCollections(category?: Category | 'all'): CollectionsResponse {
  let filtered = _collections
  if (category && category !== 'all') {
    filtered = filtered.filter(c => c.category === category)
  }
  return {
    collections: filtered,
    total: filtered.length,
  }
}

export function getCollectionById(id: string): { collection: Collection; ideas: Idea[] } | null {
  const collection = _collections.find(c => c.id === id)
  if (!collection) return null
  const collectionIdeas = _ideas.filter(i => i.collectionId === id)
  return { collection, ideas: collectionIdeas }
}

// ── Search ─────────────────────────────────────────────────────
export function search(query: string): SearchResponse {
  const q = query.toLowerCase().trim()
  if (!q) return { results: [], total: 0 }

  const matchedIdeas = _ideas.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q) ||
    i.category.toLowerCase().includes(q)
  )

  const matchedCollections = _collections.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.summary.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  )

  const collectionResults: CollectionResult[] = matchedCollections.map(c => ({
    type: 'collection' as const,
    id: c.id,
    title: c.title,
    summary: c.summary,
    category: c.category,
    ideaCount: c.ideaIds.length,
  }))

  // Merge and sort by heat
  const allResults = [
    ...matchedIdeas.map(i => ({ type: 'idea' as const, ...i })),
    ...collectionResults,
  ].sort((a: any, b: any) => (b.heat ?? 0) - (a.heat ?? 0))

  return {
    results: allResults,
    total: allResults.length,
  }
}

// ── Crawl (placeholder) ────────────────────────────────────────
export function triggerCrawl(): CrawlResponse {
  // Placeholder for future crawl logic
  return {
    success: true,
    message: 'Crawl task queued. In production, this would trigger scrapers for various platforms.',
    crawledAt: new Date().toISOString(),
    newItems: 0,
  }
}

// ── Helpers ────────────────────────────────────────────────────
export function getIdeaById(id: string): Idea | undefined {
  return _ideas.find(i => i.id === id)
}

export function getRelatedIdeas(category: Category, excludeId?: string, limit = 5): Idea[] {
  return _ideas
    .filter(i => i.category === category && i.id !== excludeId)
    .sort((a, b) => b.heat - a.heat)
    .slice(0, limit)
}
