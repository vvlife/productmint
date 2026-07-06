'use client'

import { categories } from '@/lib/data'
import type { Category } from '@/lib/types'

interface Props {
  selected: Category | 'all'
  onSelect: (cat: Category | 'all') => void
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  const allCats: (Category | 'all')[] = ['all', ...categories]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {allCats.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 px-3 py-1 text-xs rounded-full transition ${
            selected === cat
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {cat === 'all' ? '全部' : cat}
        </button>
      ))}
    </div>
  )
}
