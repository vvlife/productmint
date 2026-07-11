'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  // 在首页（swipe feed）和 home landing 页不显示 header
  if (pathname === '/' || pathname === '/home') return null

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between h-14 gap-3">
          <Link href="/" className="flex items-center gap-1.5 shrink-0 font-semibold text-gray-900">
            Idea<span className="text-blue-600">Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition shrink-0"
            >
              刷一刷
            </Link>
            <Link
              href="/chat"
              className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition shrink-0"
            >
              创作
            </Link>
            <Link
              href="/community"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition shrink-0"
            >
              社区
            </Link>
            <Link
              href="/subscribe"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition shrink-0"
            >
              订阅
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const pathname = usePathname()

  // 不在首页和 home 页显示 footer
  if (pathname === '/' || pathname === '/home') return null

  return (
    <footer className="border-t border-gray-100 mt-12">
      <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>IdeaHub · 刷网页的 TikTok</span>
        <span>AI 生成 · 可交互 · 可分享</span>
      </div>
    </footer>
  )
}
