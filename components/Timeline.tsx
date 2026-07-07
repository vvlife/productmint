'use client'

import { useMemo } from 'react'
import type { Idea, Collection } from '@/lib/types'
import IdeaCard from './IdeaCard'
import CollectionCard from './CollectionCard'

interface Props {
  ideas: Idea[]
  collections: Collection[]
}

export default function Timeline({ ideas, collections }: Props) {
  const timeline = useMemo(() => {
    const items: Array<
      | { type: 'idea'; data: Idea; sortTime: string }
      | { type: 'collection'; data: Collection; sortTime: string }
    > = [
      ...ideas.map(i => ({ type: 'idea' as const, data: i, sortTime: i.publishedAt })),
      ...collections.map(c => ({ type: 'collection' as const, data: c, sortTime: c.createdAt })),
    ]
    return items.sort((a, b) => {
      return new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime()
    })
  }, [ideas, collections])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof timeline> = {}
    timeline.forEach(item => {
      const date = new Date(item.sortTime)
      const key = formatDateKey(date)
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return Object.entries(groups)
  }, [timeline])

  if (timeline.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400 dark:text-gray-500">
        <p className="text-lg">暂无内容</p>
      </div>
    )
  }

  return (
    <div>
      {grouped.map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <div className="sticky top-14 z-40 py-2 bg-gray-50 dark:bg-gray-950">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {dateLabel}
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) =>
              item.type === 'idea' ? (
                <IdeaCard key={`idea-${item.data.id}`} idea={item.data} />
              ) : (
                <CollectionCard key={`col-${item.data.id}`} collection={item.data} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDateKey(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return '今天'
  if (target.getTime() === yesterday.getTime()) return '昨天'

  return `${date.getMonth() + 1}月${date.getDate()}日`
}
