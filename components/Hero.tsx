'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="py-12 sm:py-20 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        IdeaHub
      </h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        从需求到产品，一键生成
      </p>

      <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索你感兴趣的方向..."
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300:ring-gray-600 transition"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          搜索
        </button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['AI写作', 'SaaS工具', '开发者工具', '出海产品'].map(tag => (
          <a
            key={tag}
            href={`/search?q=${encodeURIComponent(tag)}`}
            className="px-3 py-1 text-sm text-gray-500 border border-gray-200 rounded-full hover:bg-gray-100 transition"
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  )
}
