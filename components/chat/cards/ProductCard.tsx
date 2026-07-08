'use client'

import type { Product } from '@/lib/types'

interface ProductCardProps {
  data: Product
  onAction?: (action: string, data?: any) => void
}

export default function ProductCard({ data, onAction }: ProductCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-w-lg">
      {/* 产品头部 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">{data.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{data.tagline}</p>
      </div>

      {/* 产品详情 */}
      <div className="p-4 space-y-3">
        {data.problem && (
          <div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">问题</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{data.problem}</p>
          </div>
        )}
        {data.coreFeatures?.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-gray-400 uppercase">核心功能</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.coreFeatures.slice(0, 4).map((f, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onAction?.('confirm_product', data)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:opacity-90 transition"
        >
          确认生成
        </button>
        <button
          onClick={() => onAction?.('adjust_product', data)}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          调整
        </button>
      </div>
    </div>
  )
}
