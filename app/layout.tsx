import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'IdeaHub - 创业需求聚合平台',
  description: '搜集社交媒体上的热点需求，汇聚成时间线，给创业者参考。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <Header />
        <main className="mx-auto max-w-content px-4 py-6">
          {children}
        </main>
        <footer className="mx-auto max-w-content px-4 py-8 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>IdeaHub · 创业需求聚合平台 · 数据仅供参考</p>
        </footer>
      </body>
    </html>
  )
}
