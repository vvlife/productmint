'use client'

interface QuickActionsProps {
  onAction: (action: string) => void
}

const actions = [
  { icon: '🔍', label: '发现需求', action: '帮我找一些热门的创业需求' },
  { icon: '💡', label: '发布想法', action: '我有一个创业想法' },
  { icon: '🚀', label: '生成产品', action: '帮我把一个想法变成产品' },
  { icon: '🏆', label: '社区作品', action: '看看社区里别人做了什么' },
]

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => onAction(a.action)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <span>{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  )
}
