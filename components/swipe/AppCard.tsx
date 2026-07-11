'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { CommunityProduct } from '@/lib/types'

interface AppCardProps {
  product: CommunityProduct
  userId: string
  isActive: boolean
  shouldLoad: boolean
  isFullscreen?: boolean
  onRequestFullscreen?: () => void
  onExitFullscreen?: () => void
  onFullscreenSwipeUp?: () => void
  onFullscreenSwipeDown?: () => void
}

const FS_SWIPE_THRESHOLD = 20

export default function AppCard({
  product, userId, isActive, shouldLoad,
  isFullscreen, onRequestFullscreen, onExitFullscreen,
  onFullscreenSwipeUp, onFullscreenSwipeDown,
}: AppCardProps) {
  const [hasVoted, setHasVoted] = useState(product.votedBy.includes(userId))
  const [votes, setVotes] = useState(product.votes)
  const [voting, setVoting] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  const fsTouchRef = useRef({ startY: 0, moved: false })
  const animatingRef = useRef(false)
  const lastFsSwipeRef = useRef(0)

  const handleVote = useCallback(async () => {
    if (voting || !userId) return
    setVoting(true)
    try {
      const resp = await fetch(`/api/community/${product.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (resp.ok) {
        const data = await resp.json()
        setVotes(data.votes)
        setHasVoted(data.hasVoted)
      }
    } catch { /* ignore */ }
    setVoting(false)
  }, [product.id, userId, voting])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/product/${product.id}/app`
    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch { /* ignore */ }
  }, [product.id])

  // Fullscreen swipe handlers
  const fsHandleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now()
    if (now - lastFsSwipeRef.current < 500 || animatingRef.current) return
    fsTouchRef.current = { startY: e.touches[0].clientY, moved: false }
  }

  const fsHandleTouchMove = (e: React.TouchEvent) => {
    const t = fsTouchRef.current
    if (!t.startY || animatingRef.current) return
    const dy = e.touches[0].clientY - t.startY
    if (Math.abs(dy) > 10) t.moved = true
  }

  const fsHandleTouchEnd = (e: React.TouchEvent) => {
    const t = fsTouchRef.current
    if (!t.startY || !t.moved || animatingRef.current) return
    const dy = e.changedTouches[0].clientY - t.startY
    t.startY = 0
    if (Math.abs(dy) >= FS_SWIPE_THRESHOLD) {
      lastFsSwipeRef.current = Date.now()
      if (dy < 0) {
        onFullscreenSwipeUp?.()
      } else {
        onFullscreenSwipeDown?.()
      }
    }
  }

  // Fullscreen wheel handler
  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastFsSwipeRef.current < 500 || animatingRef.current) return
      if (Math.abs(e.deltaY) <= 10) return
      lastFsSwipeRef.current = now
      animatingRef.current = true
      setTimeout(() => { animatingRef.current = false }, 350)
      if (e.deltaY > 0) {
        onFullscreenSwipeUp?.()
      } else {
        onFullscreenSwipeDown?.()
      }
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [isFullscreen, onFullscreenSwipeUp, onFullscreenSwipeDown])

  const iframeEl = (
    <iframe
      title={product.name}
      src={shouldLoad ? `/p/${product.id}` : undefined}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
      style={{ opacity: iframeLoaded ? 1 : 0 }}
      onLoad={() => setIframeLoaded(true)}
    />
  )

  if (isFullscreen) {
    return (
      <div className="absolute inset-0 bg-black select-none">
        <div className="absolute inset-0">
          {iframeEl}
        </div>

        {/* Left swipe zone */}
        <div className="absolute inset-y-0 left-0 w-16 z-10 touch-none flex items-center justify-start pl-3">
          <div className="w-[3px] h-12 rounded-full bg-white/20" />
        </div>

        {/* Right swipe zone */}
        <div className="absolute inset-y-0 right-0 w-16 z-10 touch-none flex items-center justify-end pr-3">
          <div className="w-[3px] h-12 rounded-full bg-white/20" />
        </div>

        {/* Touch capture for swipe zones */}
        <div
          className="absolute inset-y-0 left-0 w-16 z-30"
          onTouchStart={fsHandleTouchStart}
          onTouchMove={fsHandleTouchMove}
          onTouchEnd={fsHandleTouchEnd}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 z-30"
          onTouchStart={fsHandleTouchStart}
          onTouchMove={fsHandleTouchMove}
          onTouchEnd={fsHandleTouchEnd}
        />

        {/* Top bar — use absolute, NOT fixed, to avoid parent transform issues */}
        <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-center justify-between px-4 py-[10px] bg-gradient-to-b from-black/70 to-transparent">
            <button
              onClick={onExitFullscreen}
              className="pointer-events-auto text-sm text-white/70 hover:text-white transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              退出
            </button>
            <span className="text-xs text-white/40">{product.name}</span>
          </div>
        </div>

        {!iframeLoaded && shouldLoad && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none touch-none z-10">
      {/* Background blur */}
      <div className="absolute inset-0 z-[1]">
        <iframe
          title={product.name + '_bg'}
          src={shouldLoad ? `/p/${product.id}` : undefined}
          className="w-full h-full border-0 pointer-events-none opacity-50 scale-110 blur-sm"
          sandbox="allow-scripts"
          aria-hidden
        />
      </div>

      {/* App frame */}
      <div className="absolute inset-0 flex items-center justify-center p-5 z-10" style={{ paddingBottom: '180px' }}>
        <div
          className="w-full h-full max-w-[420px] relative"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          <div className="w-full h-full rounded-[28px] overflow-hidden border-[1.5px] border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.6)] bg-white">
            {shouldLoad ? iframeEl : <div className="w-full h-full bg-gray-900" />}
            {!iframeLoaded && shouldLoad && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-[28px] z-10">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{product.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swipe indicator */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-0.5 pointer-events-none">
        <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
        </svg>
        <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        <span className="text-[9px] text-white/15 tracking-wider">滑动</span>
        <div className="w-px h-10 bg-gradient-to-t from-white/30 to-transparent" />
        <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Bottom info */}
      <Link
        href={`/product/${product.id}`}
        className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-28 pb-5 px-5 block"
      >
        <div className="max-w-lg">
          <h2 className="text-xl font-bold text-white drop-shadow-lg">{product.name}</h2>
          <p className="text-sm text-gray-300 mt-1 line-clamp-2 drop-shadow">{product.tagline}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-gray-400 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {product.ideaTitle.slice(0, 20)}{product.ideaTitle.length > 20 ? '…' : ''}
            </span>
            <span className="text-[11px] text-gray-500">
              {new Date(product.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </Link>

      {/* Right action buttons */}
      <div className="absolute right-4 z-20 flex flex-col items-center gap-4 pointer-events-none" style={{ bottom: 'calc(180px + 16px)' }}>
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            onClick={handleVote}
            disabled={voting}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              hasVoted
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
            }`}
          >
            <svg className={`w-6 h-6 ${voting ? 'animate-pulse' : ''}`} fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className={`text-xs font-bold ${hasVoted ? 'text-blue-400' : 'text-white/80'}`}>{votes}</span>
        </div>

        <Link href={`/product/${product.id}`} className="flex flex-col items-center gap-1 pointer-events-auto">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-all backdrop-blur-sm active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] text-white/60">详情</span>
        </Link>

        <div className="relative flex flex-col items-center gap-1 pointer-events-auto">
          <button onClick={handleShare} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-all backdrop-blur-sm active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <span className="text-[10px] text-white/60">分享</span>
          {showCopied && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-30">
              链接已复制 ✓
            </div>
          )}
        </div>

        <button onClick={onRequestFullscreen} className="flex flex-col items-center gap-1 pointer-events-auto">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-all backdrop-blur-sm active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <span className="text-[10px] text-white/60">全屏</span>
        </button>
      </div>
    </div>
  )
}
