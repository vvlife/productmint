'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname === '/home') return null

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-12">
      <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>IdeaHub</span>
        <span>从需求到产品</span>
      </div>
    </footer>
  )
}
