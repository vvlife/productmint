'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Idea, Collection, FeedResponse } from '@/lib/types'
import Timeline from '@/components/Timeline'
import { addNotification } from '@/lib/notify'

const CACHE_KEY = 'ideahub_cache'
const CACHE_TIME_KEY = 'ideahub_cache_time'
const USER_KEY = 'ideahub_user_id'

export default function HomePage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCrawlAt, setLastCrawlAt] = useState<string | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')

  // 初始化用户 ID 和昵称
  useEffect(() => {
    if (typeof window === 'undefined') return
    let userId = localStorage.getItem(USER_KEY)
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      localStorage.setItem(USER_KEY, userId)
    }
    const savedName = localStorage.getItem('ideahub_author')
    if (savedName) setAuthor(savedName)
  }, [])

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

  // 加载用户提交的需求（从 API）
  const loadUserIdeas = useCallback(async (): Promise<Idea[]> => {
    try {
      const resp = await fetch('/api/ideas', { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        return data.ideas || []
      }
    } catch {}
    return []
  }, [])

  const fetchFromAPI = useCallback(async () => {
    try {
      const [feedResp, userIdeas] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }),
        loadUserIdeas(),
      ])
      if (feedResp.ok) {
        const data: FeedResponse = await feedResp.json()
        const allIdeas = [...userIdeas, ...(data.ideas || [])]
        if (allIdeas.length > 0) {
          setIdeas(allIdeas)
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

  // 监听 Header 发布需求按钮
  useEffect(() => {
    const handleShowSubmit = () => setShowSubmit(true)
    window.addEventListener('ideahub:show-submit', handleShowSubmit)
    return () => window.removeEventListener('ideahub:show-submit', handleShowSubmit)
  }, [])

  const handleSubmitIdea = async () => {
    if (!title.trim() || !author.trim() || submitting) return
    setSubmitting(true)
    try {
      const resp = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), author: author.trim() }),
      })
      if (resp.ok) {
        const { idea } = await resp.json()
        // 更新显示
        setIdeas(prev => [idea, ...prev])
        localStorage.setItem('ideahub_author', author)
        setShowSubmit(false)
        setTitle('')
        setDescription('')
        addNotification({ title: '需求发布成功', body: `「${idea.title}」已发布`, type: 'done' })
      }
    } catch {}
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <>
      {/* 发布需求弹窗 */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSubmit(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">发布需求</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">昵称 *</label>
                <input
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="你的昵称"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">需求标题 *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：需要一个 AI 写周报的工具"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">详细描述（可选）</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="描述你的需求场景、痛点..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSubmit(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmitIdea}
                disabled={!title.trim() || !author.trim() || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ideas.length === 0 && collections.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">💡</p>
          <p className="text-gray-500 dark:text-gray-400 mb-2">暂无数据</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            点击右上角「刷新」抓取，或点击「发布需求」提交
          </p>
        </div>
      ) : (
        <Timeline ideas={ideas} collections={collections} />
      )}
    </>
  )
}
