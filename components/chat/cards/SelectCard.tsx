'use client'

interface SelectCardProps {
  options: Array<{ label: string; value: string; icon?: string; description?: string }>
  onSelect?: (value: string) => void
}

export default function SelectCard({ options, onSelect }: SelectCardProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect?.(opt.value)}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition text-left"
        >
          {opt.icon && <span className="text-lg">{opt.icon}</span>}
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
            {opt.description && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.description}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
