import { platformMeta } from '@/lib/data'
import type { Idea } from '@/lib/types'
import Link from 'next/link'

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

export default function IdeaCard({ idea }: { idea: Idea }) {
  const meta = platformMeta[idea.platform]

  return (
    <a
      href={idea.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-4 group cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
            {idea.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {idea.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${meta.bgClass} ${meta.textClass}`}>
              {meta.label}
            </span>
            <span>{formatTime(idea.publishedAt)}</span>
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4z" />
              </svg>
              {idea.heat}
            </span>
            <span className="hidden sm:inline">{idea.category}</span>
          </div>
        </div>
      </div>
    </a>
  )
}
