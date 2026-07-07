'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import CollectionCard from '@/components/CollectionCard'
import Link from 'next/link'
import type { Idea, Collection } from '@/lib/types'

const CACHE_KEY = 'ideahub_cache'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        setIdeas(data.ideas || [])
        setCollections(data.collections || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return { ideas: [], collections: [] }
    const q = query.toLowerCase().trim()
    return {
      ideas: ideas.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      ),
      collections: collections.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      ),
    }
  }, [query, ideas, collections])

  const total = results.ideas.length + results.collections.length

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">💡</p>
        <p className="text-gray-400 dark:text-gray-500">输入关键词搜索创业需求</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['AI写作', '代码审查', 'SaaS', '出海', '无代码', 'AI客服'].map(tag => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          搜索「{query}」
        </h1>
      </div>

      {total === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400 dark:text-gray-500">没有找到相关需求</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            试试其他关键词，或
            <Link href="/" className="text-blue-500 hover:underline ml-1">返回首页浏览</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            找到 <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span> 条结果
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {results.collections.map(c => (
              <CollectionCard key={`col-${c.id}`} collection={c} />
            ))}
            {results.ideas.map(i => (
              <IdeaCard key={`idea-${i.id}`} idea={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
