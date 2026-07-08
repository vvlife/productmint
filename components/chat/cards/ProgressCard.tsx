'use client'

interface ProgressCardProps {
  progress: number // 0-100
  stage?: string
}

export default function ProgressCard({ progress, stage }: ProgressCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {stage || '处理中...'}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 mt-1 block">{Math.round(progress)}%</span>
    </div>
  )
}
