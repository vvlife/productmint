'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Idea, Collection, FeedResponse } from '@/lib/types'
import Timeline from '@/components/Timeline'

const CACHE_KEY = 'ideahub_cache'
const CACHE_TIME_KEY = 'ideahub_cache_time'

export default function HomePage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastCrawlAt, setLastCrawlAt] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // 加载缓存
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

  // 从 API 获取数据
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

  // 后台刷新：触发爬取并更新内容
  const backgroundRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const resp = await fetch('/api/crawl', { method: 'POST' })
      if (resp.ok) {
        const data = await resp.json()
        if (data.success && data.ideas?.length > 0) {
          setIdeas(data.ideas)
          setCollections(data.collections || [])
          const now = data.crawledAt || new Date().toISOString()
          setLastCrawlAt(now)
          // 更新缓存
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ideas: data.ideas, collections: data.collections }))
            localStorage.setItem(CACHE_TIME_KEY, now)
          } catch {}
        }
      }
    } catch {}
    setRefreshing(false)
  }, [])

  // 初始化：先显示缓存，再自动后台刷新
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      const hasCache = loadFromCache()
      if (!hasCache) {
        // 无缓存，先等爬取完成
        setRefreshing(true)
        try {
          const resp = await fetch('/api/crawl', { method: 'POST' })
          if (resp.ok) {
            const data = await resp.json()
            if (data.success && data.ideas?.length > 0) {
              setIdeas(data.ideas)
              setCollections(data.collections || [])
              const now = data.crawledAt || new Date().toISOString()
              setLastCrawlAt(now)
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ ideas: data.ideas, collections: data.collections }))
                localStorage.setItem(CACHE_TIME_KEY, now)
              } catch {}
            }
          }
        } catch {}
        setRefreshing(false)
      } else {
        // 有缓存，先显示，再后台刷新
        setLoading(false)
        backgroundRefresh()
        return
      }
      setLoading(false)
    }
    init()
  }, [loadFromCache, backgroundRefresh])

  // 监听 Header 刷新完成事件
  useEffect(() => {
    const handleCrawlComplete = (e: CustomEvent) => {
      const { ideas: newIdeas, collections: newCols, crawledAt } = e.detail || {}
      if (newIdeas) setIdeas(newIdeas)
      if (newCols) setCollections(newCols)
      if (crawledAt) setLastCrawlAt(crawledAt)
      setRefreshing(false)
    }
    window.addEventListener('ideahub:crawl-complete', handleCrawlComplete as EventListener)
    return () => window.removeEventListener('ideahub:crawl-complete', handleCrawlComplete as EventListener)
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">抓取中...</p>
      </div>
    )
  }

  if (ideas.length === 0 && collections.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">💡</p>
        <p className="text-gray-500 dark:text-gray-400 mb-2">暂无数据</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {refreshing ? '正在抓取最新内容...' : '点击右上角「刷新」按钮抓取'}
        </p>
      </div>
    )
  }

  return (
    <>
      {lastCrawlAt && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          {refreshing && (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>
          )}
          <span>
            {refreshing ? '正在更新...' : `上次抓取：${new Date(lastCrawlAt).toLocaleString('zh-CN')}`}
          </span>
        </div>
      )}
      <Timeline ideas={ideas} collections={collections} />
    </>
  )
}
