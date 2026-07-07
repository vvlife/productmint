import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import LandingHeader from '@/components/LandingHeader'
import Footer from '@/components/Footer'

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
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <LandingHeader />
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
