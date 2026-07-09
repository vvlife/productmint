'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import AppCard from './AppCard'
import type { CommunityProduct } from '@/lib/types'

interface SwipeFeedProps {
  products: CommunityProduct[]
  userId: string
  onRefresh?: () => void
}

const SWIPE_THRESHOLD = 50
const ANIMATION_MS = 350
const GOTO_COOLDOWN_MS = 1000

export default function SwipeFeed({ products, userId, onRefresh }: SwipeFeedProps) {
  const totalPages = products.length + 1
  const lastProductIdx = products.length - 1
  const endCardIdx = products.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef({ startY: 0, lastY: 0, dragging: false, moved: false })
  const animatingRef = useRef(false)
  const lastGoToTimeRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const goTo = useCallback((index: number) => {
    const now = Date.now()
    if (now - lastGoToTimeRef.current < GOTO_COOLDOWN_MS) return
    const clamped = Math.max(0, Math.min(index, totalPages - 1))
    if (clamped === currentIndex || animatingRef.current) return
    lastGoToTimeRef.current = now
    animatingRef.current = true
    setIsAnimating(true)
    setCurrentIndex(clamped)
    if (fullscreenIndex !== null && clamped <= lastProductIdx) {
      setFullscreenIndex(clamped)
    } else if (clamped === endCardIdx) {
      setFullscreenIndex(null)
    }
    setTimeout(() => {
      animatingRef.current = false
      setIsAnimating(false)
    }, ANIMATION_MS)
  }, [currentIndex, totalPages, lastProductIdx, endCardIdx, fullscreenIndex])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animatingRef.current || products.length <= 1) return
    const t = touchRef.current
    t.startY = e.touches[0].clientY
    t.lastY = t.startY
    t.dragging = true
    t.moved = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = touchRef.current
    if (!t.dragging || animatingRef.current || products.length <= 1) return
    t.lastY = e.touches[0].clientY
    const delta = t.lastY - t.startY
    t.moved = Math.abs(delta) > 10
  }

  const handleTouchEnd = () => {
    const t = touchRef.current
    if (!t.dragging || animatingRef.current) return
    t.dragging = false
    t.moved = false
    const delta = t.lastY - t.startY
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta < 0 && currentIndex < totalPages - 1) {
        goTo(currentIndex + 1)
      } else if (delta > 0 && currentIndex > 0) {
        goTo(currentIndex - 1)
      } else if (delta > 0 && currentIndex === 0 && onRefresh && Math.abs(delta) > 120) {
        onRefresh()
      }
    }
  }

  const handleTouchCancel = () => {
    const t = touchRef.current
    t.dragging = false
    t.moved = false
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    if (animatingRef.current || touchRef.current.dragging || products.length <= 1) return
    if (e.deltaY > 10) {
      if (currentIndex < totalPages - 1) goTo(currentIndex + 1)
    } else if (e.deltaY < -10) {
      if (currentIndex === 0 && onRefresh && Math.abs(e.deltaY) > 60) {
        onRefresh()
      } else {
        goTo(currentIndex - 1)
      }
    }
  }, [currentIndex, goTo, products.length, totalPages, onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: true })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        if (currentIndex < totalPages - 1) goTo(currentIndex + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        goTo(currentIndex - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goTo, currentIndex, totalPages])

  const getTransform = () => {
    if (products.length === 0) return 'translateY(0)'
    const base = -currentIndex * 100
    const t = touchRef.current
    let offset = 0
    if (t.dragging && t.moved) {
      const delta = t.lastY - t.startY
      if (
        (currentIndex === 0 && delta > 0) ||
        (currentIndex === totalPages - 1 && delta < 0)
      ) {
        offset = delta * 0.3
      } else {
        offset = delta
      }
    }
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1
    return `translateY(${base + offset / vh * 100}vh)`
  }

  const isFullscreen = fullscreenIndex !== null
  const atEndCard = currentIndex === endCardIdx

  const goNext = useCallback(() => {
    if (fullscreenIndex !== null && fullscreenIndex < lastProductIdx) {
      goTo(fullscreenIndex + 1)
    }
  }, [fullscreenIndex, lastProductIdx, goTo])

  const goPrev = useCallback(() => {
    if (fullscreenIndex !== null && fullscreenIndex > 0) {
      goTo(fullscreenIndex - 1)
    }
  }, [fullscreenIndex, goTo])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div
        className="will-change-transform"
        style={{
          transform: getTransform(),
          transition: isAnimating
            ? `transform ${ANIMATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`
            : 'transform 0ms',
        }}
      >
        {products.map((product, i) => (
          <div key={product.id} className="h-screen w-full relative">
            <AppCard
              product={product}
              userId={userId}
              isActive={i === currentIndex}
              shouldLoad={true}
              isFullscreen={fullscreenIndex === i}
              onRequestFullscreen={() => setFullscreenIndex(currentIndex)}
              onExitFullscreen={() => setFullscreenIndex(null)}
              onFullscreenSwipeUp={goNext}
              onFullscreenSwipeDown={goPrev}
            />
          </div>
        ))}

        {/* End card */}
        <div className="h-screen w-full relative bg-black flex flex-col items-center justify-center px-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-white/30 text-sm mb-1">已经到底了</p>
            <p className="text-white/15 text-xs mb-8">还没有你想要的应用？自己动手创作一个吧</p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all border border-white/10 text-sm font-medium active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创作应用
            </Link>
          </div>
        </div>
      </div>

      {showHint && products.length > 1 && !isFullscreen && !atEndCard && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md text-white/60 text-xs px-4 py-2 rounded-full border border-white/10 animate-bounce">
            ↕ 边缘滑动切换 · ↑↓ 键盘
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-0">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { if (!animatingRef.current) goTo(i) }}
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px' }}
            >
              <span
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-[4px] h-5 bg-white'
                    : 'w-[3px] h-[3px] bg-white/40'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {!isFullscreen && !atEndCard && (
        <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="flex items-center justify-between px-1.5 pt-0.5">
            <Link href="/community" className="pointer-events-auto text-[10px] font-bold text-white/20 hover:text-white/40 transition tracking-tight">
              IdeaHub
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/chat" className="pointer-events-auto text-[10px] text-white/30 hover:text-white/50 transition px-2 py-1">
                创作
              </Link>
              <span className="text-[9px] text-white/15 font-mono">
                {currentIndex + 1 < totalPages ? `${currentIndex + 1}/${lastProductIdx + 1}` : 'END'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
