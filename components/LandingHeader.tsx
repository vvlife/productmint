'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LandingHeader() {
  const pathname = usePathname()
  const isLanding = pathname === '/home'

  if (!isLanding) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/home" className="flex items-center gap-1.5 font-semibold text-white">
            Idea<span className="text-blue-400">Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
              进入应用
            </Link>
            <a
              href="https://github.com/vvlife/ideahub"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
