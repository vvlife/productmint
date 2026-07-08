'use client'

import { useState } from 'react'

interface PreviewCardProps {
  data: {
    productId: string
    html?: string
    name?: string
  }
  onAction?: (action: string, data?: any) => void
}

export default function PreviewCard({ data, onAction }: PreviewCardProps) {
  const [showFull, setShowFull] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-w-lg">
      {/* 预览标题 */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">产品预览</span>
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          {showFull ? '收起' : '全屏'}
        </button>
      </div>

      {/* iframe 预览 */}
      <div className={`bg-gray-50 dark:bg-gray-950 ${showFull ? 'h-[60vh]' : 'h-48'}`}>
        <iframe
          src={`/p/${data.productId}`}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          title={data.name || '产品预览'}
        />
      </div>

      {/* 操作按钮 */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        <button
          onClick={() => onAction?.('deploy', data)}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:opacity-90 transition"
        >
          🚀 部署到公网
        </button>
        <button
          onClick={() => onAction?.('submit_leaderboard', data)}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition"
        >
          🏆 打榜
        </button>
        <button
          onClick={() => onAction?.('copy_product', data)}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          📋 复制改编
        </button>
        <button
          onClick={() => onAction?.('share_product', data)}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          🔗 分享
        </button>
      </div>
    </div>
  )
}
