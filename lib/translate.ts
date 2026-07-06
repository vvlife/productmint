// ── 翻译功能 ──────────────────────────────────────────────────
// 使用免费的 LibreTranslate API (libretranslate.de) 或 Google Translate

export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ru'

export const LANGUAGE_NAMES: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ru: 'Русский',
}

// 检测文本语言（简单版）
export function detectLanguage(text: string): Language {
  // 如果包含大量中文字符，认为是中文
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  
  if (totalChars > 0 && chineseChars / totalChars > 0.3) {
    return 'zh'
  }
  
  // 简单的日语检测
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'ja'
  }
  
  // 简单的韩语检测
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return 'ko'
  }
  
  // 默认英文
  return 'en'
}

// 使用 LibreTranslate API 翻译
export async function translateText(
  text: string,
  targetLang: Language,
  sourceLang?: Language
): Promise<string> {
  if (!text.trim()) return text
  
  // 如果目标语言和源语言相同，直接返回
  const detectedLang = sourceLang || detectLanguage(text)
  if (detectedLang === targetLang) {
    return text
  }
  
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: detectedLang,
        target: targetLang,
        format: 'text',
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.translatedText || text
  } catch (error) {
    console.error('Translation failed:', error)
    // 翻译失败返回原文
    return text
  }
}

// 批量翻译（带缓存）
const translationCache = new Map<string, string>()

export async function translateWithCache(
  text: string,
  targetLang: Language,
  sourceLang?: Language
): Promise<string> {
  const cacheKey = `${text}_${sourceLang || 'auto'}_${targetLang}`
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }
  
  const translated = await translateText(text, targetLang, sourceLang)
  translationCache.set(cacheKey, translated)
  
  // 限制缓存大小
  if (translationCache.size > 1000) {
    const firstKey = translationCache.keys().next().value
    if (firstKey) translationCache.delete(firstKey)
  }
  
  return translated
}

// 翻译 Idea 对象
export async function translateIdea(
  idea: {
    title: string
    description: string
    _originalTitle?: string
    _originalDescription?: string
  },
  targetLang: Language
): Promise<void> {
  // 保存原文
  if (!idea._originalTitle) {
    idea._originalTitle = idea.title
    idea._originalDescription = idea.description
  }
  
  // 检测源语言
  const sourceLang = detectLanguage(idea._originalTitle)
  
  // 如果目标语言与源语言相同，恢复原文
  if (sourceLang === targetLang) {
    idea.title = idea._originalTitle ?? idea.title
    idea.description = idea._originalDescription ?? idea.description
    return
  }
  
  // 翻译
  const [translatedTitle, translatedDesc] = await Promise.all([
    translateWithCache(idea._originalTitle ?? idea.title, targetLang, sourceLang),
    translateWithCache(idea._originalDescription ?? idea.description, targetLang, sourceLang),
  ])
  
  idea.title = translatedTitle
  idea.description = translatedDesc
}
