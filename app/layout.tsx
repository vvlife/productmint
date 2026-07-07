import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'IdeaHub',
  description: '从需求到产品，一键生成。自动抓取中文科技媒体动态，AI分析生成产品方案，支持多人协作讨论，一键提交AI产品排行榜。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-100 dark:border-gray-800 mt-12">
          <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>IdeaHub</span>
            <span>从需求到产品</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
