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

export default function CollectionCard({ collection }: { collection: any }) {
  const count = collection.ideaCount ?? collection.ideaIds?.length ?? 0
  return (
    <Link
      href={`/collection/${collection.id}`}
      className="block py-4 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
              {count}条
            </span>
            <h3 className="text-[15px] font-medium text-gray-900 group-hover:text-blue-600:text-blue-400 transition leading-snug">
              {collection.title}
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {collection.summary}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span>{formatTime(collection.createdAt)}</span>
          </div>
        </div>
        <svg
          className="w-4 h-4 text-gray-300 mt-1 shrink-0 group-hover:text-gray-500 transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
