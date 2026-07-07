'use client'

import { useState, useEffect, useCallback } from 'react'
import { LANGUAGE_NAMES, type Language } from '@/lib/translate'
import { loadSettings, saveSettings, type UserSettings, DEFAULT_SETTINGS } from '@/lib/settings'

export default function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setMounted(true)
  }, [])

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    updateSettings({ language: lang })
  }, [updateSettings])

  const setAutoTranslate = useCallback((enabled: boolean) => {
    updateSettings({ autoTranslate: enabled })
  }, [updateSettings])

  const setFilterAds = useCallback((enabled: boolean) => {
    updateSettings({ filterAds: enabled })
  }, [updateSettings])

  // 监听其他标签页的设置变化
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'ideahub_settings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue)
          setSettings(prev => ({ ...prev, ...newSettings }))
        } catch {
          // Ignore parse errors
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const languages: Language[] = ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'ru']

  // 避免 hydration mismatch
  if (!mounted) {
    return (
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative">
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900-200 transition rounded-lg hover:bg-gray-100"
        title="设置"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">{LANGUAGE_NAMES[settings.language]}</span>
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 面板 */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              设置
            </h3>

            {/* 语言选择 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                界面语言 / Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-2 text-xs rounded-lg transition text-left ${
                      settings.language === lang
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {LANGUAGE_NAMES[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* 自动翻译 */}
            <div className="mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">
                  自动翻译内容
                </span>
                <button
                  onClick={() => setAutoTranslate(!settings.autoTranslate)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    settings.autoTranslate ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      settings.autoTranslate ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                自动将外文内容翻译为所选语言
              </p>
            </div>

            {/* 广告过滤 */}
            <div className="mb-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">
                  过滤广告内容
                </span>
                <button
                  onClick={() => setFilterAds(!settings.filterAds)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    settings.filterAds ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      settings.filterAds ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                自动过滤推广、营销类内容
              </p>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-gray-700-200 transition"
            >
              关闭
            </button>
          </div>
        </>
      )}
    </div>
  )
}
