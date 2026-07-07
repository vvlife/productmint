'use client'

import { useState, useEffect } from 'react'
import { platformMeta } from '@/lib/data'
import type { Idea, Product } from '@/lib/types'
import AnalysisModal from './AnalysisModal'

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

interface IdeaCardProps {
  idea: Idea
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const meta = platformMeta[idea.platform] || platformMeta.other
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [productCount, setProductCount] = useState(0)
  const [firstProduct, setFirstProduct] = useState<Product | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadProducts = async () => {
      try {
        const resp = await fetch(`/api/products/${idea.id}?type=idea`, { cache: 'no-store' })
        if (resp.ok) {
          const data = await resp.json()
          if (!cancelled) {
            const products: Product[] = data.products || []
            setProductCount(products.length)
            setFirstProduct(products[0] || null)
          }
        }
      } catch {}
    }
    loadProducts()
    return () => { cancelled = true }
  }, [idea.id, showAnalysis])

  const handleGenerate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowAnalysis(true)
  }

  const handleProductCreated = (product: Product) => {
    setProductCount(prev => prev + 1)
    setFirstProduct(product)
  }

  return (
    <>
      <div className="py-4 group">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={idea.sourceUrl || '#'}
              target={idea.sourceUrl ? '_blank' : undefined}
              rel={idea.sourceUrl ? 'noopener noreferrer' : undefined}
              className="block"
            >
              <h3 className="text-[15px] font-medium text-gray-900 hover:text-blue-600-400 transition leading-snug">
                {idea.title}
              </h3>
            </a>

            <p className="mt-1 text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {idea.description}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${meta.bgClass} ${meta.textClass}`}>
                {meta.label}
              </span>
              {idea.author && (
                <span className="text-blue-500">by {idea.author}</span>
              )}
              <span>{formatTime(idea.publishedAt)}</span>
              {idea.heat > 0 && (
                <span className="flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4z" />
                  </svg>
                  {idea.heat}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              生成点子
            </button>

            {productCount > 0 && firstProduct && (
              productCount === 1 ? (
                <a
                  href={`/product/${firstProduct.id}`}
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  {firstProduct.name}
                </a>
              ) : (
                <a
                  href={`/idea/${idea.id}/products`}
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  {productCount} 个方案
                </a>
              )
            )}
          </div>
        </div>
      </div>

      {showAnalysis && (
        <AnalysisModal
          idea={idea}
          autoStart
          onClose={() => setShowAnalysis(false)}
          onProductCreated={handleProductCreated}
        />
      )}
    </>
  )
}
