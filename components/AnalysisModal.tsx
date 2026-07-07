'use client'

import { useState, useEffect } from 'react'
import type { Idea, Product } from '@/lib/types'
import { addNotification, updateNotification, subscribe, getNotifications, type AppNotification } from '@/lib/notify'
import Link from 'next/link'

interface AnalysisModalProps {
  idea: Idea
  autoStart?: boolean
  onClose: () => void
  onProductCreated: (product: Product) => void
}

type Step = 'idle' | 'analyzing' | 'result' | 'saving' | 'saved' | 'generating' | 'done'

interface GenInfo {
  state: 'idle' | 'generating' | 'done' | 'error'
  progress: number
  stage: string
  productId?: string
  notifId?: string
}

export default function AnalysisModal({
  idea,
  autoStart = false,
  onClose,
  onProductCreated,
}: AnalysisModalProps) {
  const [step, setStep] = useState<Step>(autoStart ? 'analyzing' : 'idle')
  const [analysis, setAnalysis] = useState<Partial<Product> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingProducts, setExistingProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [savedProduct, setSavedProduct] = useState<Product | null>(null)
  const [genInfo, setGenInfo] = useState<GenInfo>({ state: 'idle', progress: 0, stage: '正在构思产品原型与交互...' })

  // 订阅站内信：实时把生成进度/结果同步到弹窗（弹窗关闭重开也能恢复）
  useEffect(() => {
    const sync = () => {
      const items = getNotifications()
      const gen = items.find(n => n.type === 'generating' || n.type === 'done' || n.type === 'error')
      if (!gen) return
      setGenInfo(prev => ({
        state: gen.type === 'generating' ? 'generating' : gen.type === 'error' ? 'error' : 'done',
        progress: gen.progress || (gen.type === 'done' || gen.type === 'error' ? 100 : prev.progress),
        stage: gen.body || prev.stage,
        productId: gen.href?.replace(/.*\/product\//, '').replace(/\/app$/, ''),
        notifId: gen.id,
      }))
    }
    sync()
    const unsub = subscribe(sync)
    window.addEventListener('ideahub:notification', sync)
    return () => {
      unsub()
      window.removeEventListener('ideahub:notification', sync)
    }
  }, [])

  // autoStart: 直接开始分析
  useEffect(() => {
    if (autoStart && step === 'analyzing') {
      handleAnalyze()
    }
  }, [])

  // 标准化分析结果中的数组字段，兼容 AI 返回对象/字符串的情况
  const coreFeatures = analysis ? normalizeList(analysis.coreFeatures) : []
  const techStack = analysis ? normalizeList(analysis.techStack) : []

  // 加载已有产品
  useEffect(() => {
    let cancelled = false
    const loadProducts = async () => {
      try {
        const resp = await fetch(`/api/products/${idea.id}?type=idea`, { cache: 'no-store' })
        if (resp.ok) {
          const data = await resp.json()
          if (!cancelled) {
            setExistingProducts(data.products || [])
          }
        }
      } catch {} finally {
        if (!cancelled) setLoadingProducts(false)
      }
    }
    loadProducts()
    return () => { cancelled = true }
  }, [idea.id])

  const handleAnalyze = async () => {
    setStep('analyzing')
    setError(null)
    try {
      // 先搜索相关内容作为参考
      let relatedContext = ''
      try {
        const searchResp = await fetch(`/api/search?q=${encodeURIComponent(idea.title)}`, { cache: 'no-store' })
        if (searchResp.ok) {
          const searchData = await searchResp.json()
          const related = (searchData.results || []).slice(0, 5)
          if (related.length > 0) {
            relatedContext = '\n\n## 相关动态参考\n' + related.map((r: any, i: number) =>
              `${i + 1}. ${r.title}: ${r.description?.slice(0, 100) || ''}`
            ).join('\n')
          }
        }
      } catch {}

      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle: idea.title,
          ideaDescription: idea.description + relatedContext,
          platform: idea.platform,
          category: idea.category,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.success) {
        let msg = data.error || '分析失败'
        if (msg === 'Failed to parse AI response as JSON') {
          msg = 'AI 返回内容格式异常，请重试（可调整需求描述或稍后再试）'
        }
        throw new Error(msg)
      }
      setAnalysis(data.product)
      setStep('result')

      // 同时保存分析记录到远程
      try {
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `analysis_${Date.now()}`,
            ideaId: idea.id,
            ideaTitle: idea.title,
            analysis: data.product,
            createdAt: new Date().toISOString(),
          }),
        })
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
      setStep('idle')
    }
  }

  const handleConfirm = async () => {
    if (!analysis) return
    setStep('saving')

    const product: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ideaId: idea.id,
      ideaTitle: idea.title,
      name: analysis.name || '未命名产品',
      tagline: analysis.tagline || '',
      problem: analysis.problem || '',
      solution: analysis.solution || '',
      targetUsers: toText(analysis.targetUsers),
      coreFeatures: normalizeList(analysis.coreFeatures),
      techStack: normalizeList(analysis.techStack),
      monetization: analysis.monetization || '',
      competitors: analysis.competitors || '',
      differentiator: analysis.differentiator || '',
      mvp: analysis.mvp || '',
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    }

    // 1) 先同步保存产品方案（不含可运行页面），进入生成中状态
    try {
      const resp = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const data = await resp.json()
      if (!resp.ok || !data.success) {
        throw new Error(data.error || '保存失败')
      }
      onProductCreated(product)
      setSavedProduct(product)
      setExistingProducts(prev => [product, ...prev])
      setStep('generating')
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
      setStep('result')
      return
    }

    // 2) 异步（非阻塞）生成可运行产品页面，完成后写回并通知
    generateProductPage(product)
  }

  // 异步生成产品页面：成功后 PATCH 写回，并通过站内信通知用户
  const generateProductPage = async (product: Product) => {
    // 站内信：先写一条 generating 进度通知（弹窗外也能看到）
    const notif = addNotification({
      title: `⏳ 正在生成「${product.name}」`,
      body: '正在构思产品原型与交互...',
      type: 'generating',
      progress: 10,
      href: `/product/${product.id}/app`,
    })
    setGenInfo({ state: 'generating', progress: 10, stage: '正在构思产品原型与交互...', productId: product.id, notifId: notif.id })

    try {
      // 阶段推进：开始请求
      updateNotification(notif.id, { progress: 35, body: 'AI 正在编写界面与交互逻辑...' })
      setGenInfo(prev => ({ ...prev, progress: 35, stage: 'AI 正在编写界面与交互逻辑...' }))

      const genResp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          tagline: product.tagline,
          problem: product.problem,
          solution: product.solution,
          targetUsers: product.targetUsers,
          coreFeatures: product.coreFeatures,
          techStack: product.techStack,
        }),
      })
      const genData = await genResp.json()
      if (!genResp.ok || !genData.success || !genData.html) {
        updateNotification(notif.id, {
          type: 'error',
          title: '⚠️ 产品页面生成失败',
          body: '可运行页面生成未完成，你仍可在介绍页查看方案。',
          progress: 100,
        })
        setGenInfo(prev => ({ ...prev, state: 'error', progress: 100, stage: '生成失败' }))
        return
      }

      updateNotification(notif.id, { progress: 80, body: '正在打包可运行页面...' })
      setGenInfo(prev => ({ ...prev, progress: 80, stage: '正在打包可运行页面...' }))

      // 写回：作为第 1 个版本持久化（建立版本历史）
      const verResp = await fetch(`/api/products/${product.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '' }),
      })
      // 若版本接口不可用，退回旧 PATCH 逻辑
      if (!verResp.ok) {
        await fetch(`/api/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generatedHtml: genData.html }),
        })
      }

      // 站内信：更新为完成态
      updateNotification(notif.id, {
        type: 'done',
        title: '🚀 你的产品页面已生成',
        body: `「${product.name}」的可运行产品页面已经准备好了，点击查看并试用。`,
        progress: 100,
      })

      if (step === 'generating') setStep('done')
    } catch {
      updateNotification(notif.id, {
        type: 'error',
        title: '⚠️ 产品页面生成失败',
        body: '可运行页面生成未完成，你仍可在介绍页查看方案。',
        progress: 100,
      })
      setGenInfo(prev => ({ ...prev, state: 'error', progress: 100, stage: '生成失败' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              需求分析
            </h2>
            <p className="text-sm text-gray-500 truncate">
              {idea.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 已有产品 */}
          {!loadingProducts && existingProducts.length > 0 && step !== 'result' && step !== 'analyzing' && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                已生成的产品方案 ({existingProducts.length})
              </h3>
              <div className="space-y-2">
                {existingProducts.map(p => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    onClick={onClose}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300:border-blue-700 transition"
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.tagline}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">
                  想要生成新的产品方案？
                </p>
              </div>
            </div>
          )}

          {/* 保存成功（生成失败回退态） */}
          {step === 'saved' && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                产品方案已保存
              </p>
              <p className="text-sm text-gray-500 mb-6">
                可运行产品页面生成未完成，但你可以先查看方案详情。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  关闭
                </button>
                <Link
                  href={`/product/${savedProduct?.id}`}
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full hover:opacity-90 transition shadow-sm"
                >
                  查看方案 →
                </Link>
              </div>
            </div>
          )}

          {/* 生成中 / 失败 / 完成：由 genInfo.state 驱动，订阅站内信实时刷新 */}
          {step === 'generating' && genInfo.state === 'generating' && (
            <div className="text-center py-12">
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100" />
                <div className="absolute w-12 h-12 rounded-full border-4 border-transparent border-t-gray-900 animate-spin" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                正在生成产品页面
              </p>
              <p className="text-sm text-gray-500 mb-5" id="gen-status">
                {genInfo.stage}
              </p>
              <div className="max-w-sm mx-auto h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all duration-700"
                  style={{ width: `${Math.max(8, Math.min(100, genInfo.progress))}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4">
                页面在后台生成，你可以关闭此弹窗，完成后会通过站内信通知你
              </p>
            </div>
          )}

          {/* 生成失败 */}
          {step === 'generating' && genInfo.state === 'error' && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-900 mb-2">
                产品页面生成失败
              </p>
              <p className="text-sm text-gray-500 mb-6">
                可运行页面未能生成，但你仍可查看产品方案。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  关闭
                </button>
                <Link
                  href={`/product/${savedProduct?.id}`}
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full hover:opacity-90 transition shadow-sm"
                >
                  查看方案 →
                </Link>
              </div>
            </div>
          )}

          {/* 生成完成 */}
          {step === 'generating' && genInfo.state === 'done' && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-900 mb-2">
                产品页面已生成
              </p>
              <p className="text-sm text-gray-500 mb-6">
                可运行的产品页面已经准备好，点击即可试用。
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/product/${savedProduct?.id}`}
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  查看方案
                </Link>
                <Link
                  href={`/product/${savedProduct?.id}/app`}
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
                >
                  查看产品页面
                </Link>
              </div>
            </div>
          )}

          {/* 初始状态 */}
          {step === 'idle' && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">
                分析这个需求并生成产品方案
              </p>
              <p className="text-sm text-gray-400 mb-6">
                分析用户痛点，设计核心功能、技术栈、商业模式等
              </p>
              <button
                onClick={handleAnalyze}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                开始分析
              </button>
              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* 分析中 */}
          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-600">
                AI 正在分析需求...
              </p>
              <p className="text-sm text-gray-400 mt-1">
                深入挖掘痛点，设计解决方案
              </p>
            </div>
          )}

          {/* 分析结果 */}
          {step === 'result' && analysis && (
            <div className="space-y-4">
              {/* 产品名称 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {analysis.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {analysis.tagline}
                </p>
              </div>

              <Section title="🎯 问题分析" content={analysis.problem} />
              <Section title="💡 解决方案" content={analysis.solution} />
              <Section title="👥 目标用户" content={analysis.targetUsers} />

              {coreFeatures.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    ⚡ 核心功能
                  </h4>
                    <div className="flex flex-wrap gap-2">
                    {coreFeatures.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {techStack.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    🛠 推荐技术栈
                  </h4>
                    <div className="flex flex-wrap gap-2">
                    {techStack.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Section title="💰 商业模式" content={analysis.monetization} />
              <Section title="🔍 竞品分析" content={analysis.competitors} />
              <Section title="✨ 差异化优势" content={analysis.differentiator} />
              <Section title="🚀 MVP 方案" content={analysis.mvp} />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'result' || step === 'saving') && analysis && (
          <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100">
            <button
              onClick={() => setStep('idle')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ← 重新分析
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full hover:opacity-90 transition shadow-sm"
              >
                {step === 'saving' ? '保存中...' : '✓ 确认生成产品'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 把可能是字符串/对象/数组的字段安全地转成可显示的文本
// 把可能是数组/字符串的字段统一转成字符串数组
function normalizeList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map(v => (typeof v === 'string' ? v : toText(v)))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(/[\n,，、]/).map(s => s.trim()).filter(Boolean)
  }
  return [toText(value)]
}

function toText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .filter(v => v != null)
      .map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join('；')
  }
  return String(value)
}

function Section({ title, content }: { title: string; content?: unknown }) {
  const text = toText(content)
  if (!text) return null
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-1.5">
        {title}
      </h4>
      <p className="text-sm text-gray-600 leading-relaxed">
        {text}
      </p>
    </div>
  )
}
