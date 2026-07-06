import { getFeed } from '@/lib/store'
import Timeline from '@/components/Timeline'

export default function HomePage() {
  const { ideas, collections } = getFeed()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          创业需求时间线
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          搜集社交媒体上的热点需求，发现创业机会
        </p>
      </div>
      <Timeline ideas={ideas} collections={collections} />
    </>
  )
}
