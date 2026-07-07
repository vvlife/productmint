'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import Link from 'next/link'
import type { Idea } from '@/lib/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        setResults(data.results || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (query) {
      doSearch(query)
    }
  }, [query, doSearch])

  if (!query) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">💡</p>
        <p className="text-gray-400 dark:text-gray-500">输入关键词搜索</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['AI写作', '代码助手', 'SaaS工具', '出海产品', '无代码平台'].map(tag => (
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

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 dark:border-gray-600"></div>
          <p className="mt-3 text-sm text-gray-400">正在搜索...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400 dark:text-gray-500">没有找到相关内容</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            试试其他关键词，或
            <Link href="/" className="text-blue-500 hover:underline ml-1">返回首页</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            找到 <span className="font-semibold text-gray-900 dark:text-gray-100">{results.length}</span> 条结果
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {results.map(i => (
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
