'use client'

import { useState, useEffect, useCallback } from 'react'
import { platformMeta } from '@/lib/data'
import { translateWithCache, detectLanguage, type Language } from '@/lib/translate'
import type { Idea } from '@/lib/types'

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 从 localStorage 读取设置
function getSettings() {
  if (typeof window === 'undefined') {
    return { language: 'zh' as Language, autoTranslate: true }
  }
  try {
    const saved = localStorage.getItem('ideahub_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        language: (parsed.language || 'zh') as Language,
        autoTranslate: parsed.autoTranslate !== false,
      }
    }
  } catch {}
  return { language: 'zh' as Language, autoTranslate: true }
}

interface IdeaCardProps {
  idea: Idea
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const meta = platformMeta[idea.platform]
  
  const [settings, setSettings] = useState(() => getSettings())
  const [translatedTitle, setTranslatedTitle] = useState(idea.title)
  const [translatedDesc, setTranslatedDesc] = useState(idea.description)
  const [isTranslated, setIsTranslated] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [sourceLang, setSourceLang] = useState<Language | null>(null)

  // 监听设置变化
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ideahub_settings') {
        setSettings(getSettings())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // 检测源语言并翻译
  useEffect(() => {
    const doTranslate = async () => {
      const detected = detectLanguage(idea.title)
      setSourceLang(detected)
      
      // 如果自动翻译开启且语言不同
      if (settings.autoTranslate && detected !== settings.language) {
        setIsTranslating(true)
        try {
          const [tTitle, tDesc] = await Promise.all([
            translateWithCache(idea.title, settings.language, detected),
            translateWithCache(idea.description, settings.language, detected),
          ])
          setTranslatedTitle(tTitle)
          setTranslatedDesc(tDesc)
          setIsTranslated(true)
        } catch (e) {
          console.error('Translation error:', e)
        } finally {
          setIsTranslating(false)
        }
      } else {
        // 恢复原文
        setTranslatedTitle(idea.title)
        setTranslatedDesc(idea.description)
        setIsTranslated(false)
      }
    }
    
    doTranslate()
  }, [idea.title, idea.description, settings.language, settings.autoTranslate])

  // 手动切换翻译
  const toggleTranslation = useCallback(async () => {
    if (isTranslating) return
    
    if (isTranslated) {
      // 恢复原文
      setTranslatedTitle(idea.title)
      setTranslatedDesc(idea.description)
      setIsTranslated(false)
    } else {
      // 翻译
      setIsTranslating(true)
      try {
        const detected = sourceLang || detectLanguage(idea.title)
        const [tTitle, tDesc] = await Promise.all([
          translateWithCache(idea.title, settings.language, detected),
          translateWithCache(idea.description, settings.language, detected),
        ])
        setTranslatedTitle(tTitle)
        setTranslatedDesc(tDesc)
        setIsTranslated(true)
      } catch (e) {
        console.error('Translation error:', e)
      } finally {
        setIsTranslating(false)
      }
    }
  }, [isTranslated, isTranslating, idea, settings.language, sourceLang])

  const needsTranslation = sourceLang !== null && sourceLang !== settings.language

  return (
    <a
      href={idea.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-4 group cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug flex-1">
              {translatedTitle}
            </h3>
            
            {/* 翻译按钮 */}
            {needsTranslation && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleTranslation()
                }}
                disabled={isTranslating}
                className={`shrink-0 text-xs px-2 py-0.5 rounded transition ${
                  isTranslated
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={isTranslated ? '显示原文' : '翻译'}
              >
                {isTranslating ? (
                  <span className="inline-block animate-spin">⟳</span>
                ) : isTranslated ? (
                  '原文'
                ) : (
                  '译'
                )}
              </button>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {translatedDesc}
          </p>
          
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${meta.bgClass} ${meta.textClass}`}>
              {meta.label}
            </span>
            <span>{formatTime(idea.publishedAt)}</span>
            <span className="flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4z" />
              </svg>
              {idea.heat}
            </span>
            <span className="hidden sm:inline">{idea.category}</span>
          </div>
        </div>
      </div>
    </a>
  )
}
