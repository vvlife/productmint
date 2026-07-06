'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Language } from '@/lib/translate'
import { LANGUAGE_NAMES } from '@/lib/translate'
import { loadSettings, saveSettings, type UserSettings } from '@/lib/settings'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  autoTranslate: boolean
  setAutoTranslate: (enabled: boolean) => void
  filterAds: boolean
  setFilterAds: (enabled: boolean) => void
  languageName: string
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<UserSettings>({
    language: 'zh',
    autoTranslate: true,
    filterAds: true,
    theme: 'system',
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSettingsState(loadSettings())
    setMounted(true)
  }, [])

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettingsState(prev => {
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
          setSettingsState(prev => ({ ...prev, ...newSettings }))
        } catch {
          // Ignore parse errors
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const value: LanguageContextType = {
    language: settings.language,
    setLanguage,
    autoTranslate: settings.autoTranslate,
    setAutoTranslate,
    filterAds: settings.filterAds,
    setFilterAds,
    languageName: LANGUAGE_NAMES[settings.language],
    settings,
    updateSettings,
  }

  // 避免 hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
