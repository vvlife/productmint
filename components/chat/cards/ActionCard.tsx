'use client'

interface ActionCardProps {
  actions: Array<{ label: string; action: string; icon?: string; primary?: boolean }>
  onAction?: (action: string, data?: any) => void
}

export default function ActionCard({ actions, onAction }: ActionCardProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.action}
          onClick={() => onAction?.(a.action)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition ${
            a.primary
              ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90'
              : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {a.icon && <span>{a.icon}</span>}
          {a.label}
        </button>
      ))}
    </div>
  )
}
