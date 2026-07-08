'use client'

import { platformMeta } from '@/lib/data'
import type { Idea } from '@/lib/types'

interface IdeaCardProps {
  data: Idea
  onAction?: (action: string, data?: any) => void
}

export default function IdeaCard({ data, onAction }: IdeaCardProps) {
  const meta = platformMeta[data.platform] || platformMeta.other

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-w-md hover:border-blue-300 dark:hover:border-blue-600 transition">
      <div className="flex items-start gap-2 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${meta.bgClass} ${meta.textClass}`}>
          {meta.label}
        </span>
        {data.heat > 0 && (
          <span className="text-[10px] text-gray-400">🔥 {data.heat}</span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
        {data.title}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
        {data.description}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAction?.('analyze_idea', data)}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition"
        >
          AI 分析
        </button>
        <button
          onClick={() => onAction?.('select_idea', data)}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          选择
        </button>
      </div>
    </div>
  )
}
