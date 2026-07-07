'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Idea, Collection, FeedResponse } from '@/lib/types'
import Timeline from '@/components/Timeline'

const CACHE_KEY = 'ideahub_cache'
const CACHE_TIME_KEY = 'ideahub_cache_time'

export default function HomePage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCrawlAt, setLastCrawlAt] = useState<string | null>(null)

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        setIdeas(data.ideas || [])
        setCollections(data.collections || [])
        setLastCrawlAt(cachedTime)
        return true
      }
    } catch {}
    return false
  }, [])

  const fetchFromAPI = useCallback(async () => {
    try {
      const resp = await fetch('/api/feed', { cache: 'no-store' })
      if (resp.ok) {
        const data: FeedResponse = await resp.json()
        if (data.ideas?.length > 0) {
          setIdeas(data.ideas)
          setCollections(data.collections || [])
          return true
        }
      }
    } catch {}
    return false
  }, [])

  useEffect(() => {
    const init = async () => {
      const hasCache = loadFromCache()
      if (!hasCache) {
        await fetchFromAPI()
      }
      setLoading(false)
    }
    init()
  }, [loadFromCache, fetchFromAPI])

  // 监听 Header 刷新完成事件
  useEffect(() => {
    const handleCrawlComplete = (e: CustomEvent) => {
      const { ideas: newIdeas, collections: newCols, crawledAt } = e.detail || {}
      if (newIdeas) setIdeas(newIdeas)
      if (newCols) setCollections(newCols)
      if (crawledAt) setLastCrawlAt(crawledAt)
    }
    window.addEventListener('ideahub:crawl-complete', handleCrawlComplete as EventListener)
    return () => window.removeEventListener('ideahub:crawl-complete', handleCrawlComplete as EventListener)
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">加载中...</p>
      </div>
    )
  }

  if (ideas.length === 0 && collections.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">💡</p>
        <p className="text-gray-500 dark:text-gray-400 mb-2">暂无数据</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          点击右上角「刷新」按钮抓取最新内容
        </p>
      </div>
    )
  }

  return (
    <>
      {lastCrawlAt && (
        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
          上次抓取：{new Date(lastCrawlAt).toLocaleString('zh-CN')}
        </p>
      )}
      <Timeline ideas={ideas} collections={collections} />
    </>
  )
}
