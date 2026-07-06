// ── 用户设置管理 ──────────────────────────────────────────────

import type { Language } from './translate'

export const SETTINGS_KEY = 'ideahub_settings'

export interface UserSettings {
  language: Language
  autoTranslate: boolean
  filterAds: boolean
  theme: 'light' | 'dark' | 'system'
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'zh',
  autoTranslate: true,
  filterAds: true,
  theme: 'system',
}

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }
  
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {
    // Ignore parse errors
  }
  
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage errors
  }
}

// 监听设置变化
export function onSettingsChange(callback: (settings: UserSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) {
      callback(loadSettings())
    }
  }
  
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
