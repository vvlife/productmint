'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { CommunityProduct } from '@/lib/types'

const SwipeFeed = dynamic(() => import('@/components/swipe/SwipeFeed'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      <p className="mt-6 text-lg font-semibold text-white">IdeaHub</p>
      <p className="mt-1 text-sm text-white/40">加载中...</p>
    </div>
  ),
})

const USER_KEY = 'ideahub_user_id'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(USER_KEY)
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem(USER_KEY, id)
  }
  return id
}

export default function HomePage() {
  const [products, setProducts] = useState<CommunityProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const viewedAllRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  const loadProducts = useCallback(async (excludeIds?: string[]) => {
    try {
      const params = new URLSearchParams()
      if (excludeIds && excludeIds.length > 0) {
        params.set('exclude', excludeIds.join(','))
      }
      const url = '/api/community' + (params.toString() ? '?' + params.toString() : '')
      const resp = await fetch(url, { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        const newProducts = data.products || []
        if (excludeIds && excludeIds.length > 0 && newProducts.length > 0) {
          // Append new products after existing ones for "infinite refresh" pattern
          setProducts(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map((p: CommunityProduct) => p.id))
            const fresh = newProducts.filter((p: CommunityProduct) => !existingIds.has(p.id))
            return [...prev, ...fresh]
          })
        } else {
          // Initial load or full refresh
          setProducts(newProducts)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // 监听新作品创建事件
  useEffect(() => {
    const handler = () => loadProducts()
    window.addEventListener('product-created', handler)
    return () => window.removeEventListener('product-created', handler)
  }, [loadProducts])

  const handleRefresh = useCallback((excludeIds: string[]) => {
    loadProducts(excludeIds)
  }, [loadProducts])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="mt-6 text-lg font-semibold text-white">IdeaHub</p>
        <p className="mt-1 text-sm text-white/40">加载作品...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shadow-2xl shadow-pink-500/30">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg text-white/90 font-medium">还没有游戏</p>
          <p className="text-sm text-white/40 mt-1">输入想法，AI 帮你生成第一个</p>
        </div>
        <a
          href="/create"
          className="px-6 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition active:scale-95"
        >
          开始创作
        </a>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      <SwipeFeed products={products} userId={userId} onRefresh={handleRefresh} />
    </div>
  )
}
