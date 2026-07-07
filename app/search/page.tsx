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
  const [inputValue, setInputValue] = useState(query)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
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
    setInputValue(query)
    if (query) {
      doSearch(query)
    }
  }, [query, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(inputValue.trim())}`
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="搜索..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300:ring-gray-600 transition"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          搜索
        </button>
      </form>

      {!query ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">输入关键词搜索</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['AI写作', '代码助手', 'SaaS工具', '出海产品'].map(tag => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-sm text-gray-500 border border-gray-200 rounded-full hover:bg-gray-100 transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
          <p className="mt-3 text-sm text-gray-400">搜索中...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">没有找到相关内容</p>
          <p className="text-xs text-gray-400 mt-2">
            <Link href="/" className="hover:text-gray-600-300 transition">返回首页</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            找到 {results.length} 条结果
          </p>
          <div className="divide-y divide-gray-100">
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
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
