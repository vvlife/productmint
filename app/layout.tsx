import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: 'IdeaHub · 刷网页的 TikTok',
  description: 'AI 生成的可交互网页，上下滑动无限刷。发现好产品，一键创作你的作品。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-black text-gray-900 antialiased min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
