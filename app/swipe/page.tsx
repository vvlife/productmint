'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { CommunityProduct } from '@/lib/types'

const SwipeFeed = dynamic(() => import('@/components/swipe/SwipeFeed'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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

export default function SwipePage() {
  const [products, setProducts] = useState<CommunityProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const resp = await fetch('/api/community', { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        setProducts(data.products || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-lg text-gray-300">还没有作品</p>
        <p className="text-sm text-gray-500">还没有 AI 生成的产品</p>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition"
        >
          去首页生成第一个
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <SwipeFeed products={products} userId={userId} />
    </div>
  )
}
