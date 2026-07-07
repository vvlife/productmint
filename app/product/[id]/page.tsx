'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Product, BrainstormSession } from '@/lib/types'
import { addNotification } from '@/lib/notify'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [brainstormSessions, setBrainstormSessions] = useState<BrainstormSession[]>([])
  const [startingBrainstorm, setStartingBrainstorm] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [submitResult, setSubmitResult] = useState<{ id?: number; message?: string } | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const id = params.id as string
    const loadProduct = async () => {
      try {
        const resp = await fetch(`/api/products/${id}`, { cache: 'no-store' })
        if (resp.ok) {
          const data = await resp.json()
          setProduct(data.product || null)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [params.id])

  // 获取该产品的 brainstorm 会话
  useEffect(() => {
    const loadBrainstormSessions = async () => {
      if (!product) return
      try {
        // 通过搜索本地存储获取会话（简化实现）
        const stored = localStorage.getItem(`brainstorm_${product.id}`)
        if (stored) {
          setBrainstormSessions(JSON.parse(stored))
        }
      } catch {}
    }
    loadBrainstormSessions()
  }, [product])

  const handleDelete = async () => {
    if (!product) return
    if (!confirm(`确定要删除产品「${product.name}」吗？`)) return
    setDeleting(true)
    try {
      await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      router.push('/')
    } catch {} finally {
      setDeleting(false)
    }
  }

  const handleStartBrainstorm = async () => {
    if (!product || startingBrainstorm) return
    setStartingBrainstorm(true)
    try {
      const resp = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (resp.ok) {
        const { session } = await resp.json()
        // 保存到本地存储
        const sessions = [...brainstormSessions, session]
        setBrainstormSessions(sessions)
        localStorage.setItem(`brainstorm_${product.id}`, JSON.stringify(sessions))
        // 跳转到 brainstorm 页面
        router.push(`/brainstorm/${session.id}`)
      }
    } catch {} finally {
      setStartingBrainstorm(false)
    }
  }

  const handleSubmitLeaderboard = async () => {
    if (!product || submitState === 'submitting') return
    if (!showEmailInput) {
      setShowEmailInput(true)
      return
    }
    if (!email.trim() || !email.includes('@')) return

    setSubmitState('submitting')
    try {
      const resp = await fetch('/api/submit-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, email: email.trim() }),
      })
      const data = await resp.json()
      if (data.success) {
        setSubmitState('done')
        setSubmitResult({ id: data.id, message: data.message })
        addNotification({
          title: '打榜提交成功',
          body: `「${product.name}」已提交到 AICPB (ID: ${data.id})`,
          href: `https://www.aicpb.com`,
          type: 'done',
        })
      } else {
        setSubmitState('error')
        setSubmitResult({ message: data.error || '提交失败' })
      }
    } catch {
      setSubmitState('error')
      setSubmitResult({ message: '网络错误' })
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">📦</p>
        <p className="text-gray-500 dark:text-gray-400 mb-2">产品不存在</p>
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </Link>

      {/* 产品头部 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.name}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
              {product.tagline}
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>基于需求：{product.ideaTitle}</span>
              <span>·</span>
              <span>{new Date(product.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          {product.generatedHtml && (
            <Link
              href={`/product/${product.id}/app`}
              className="shrink-0 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full hover:opacity-90 transition shadow-sm"
            >
              👀 预览产品页面 →
            </Link>
          )}
        </div>
      </div>

      {/* 内容 */}
      <div className="space-y-6">
        <Section title="🎯 问题分析" content={product.problem} />
        <Section title="💡 解决方案" content={product.solution} />
        <Section title="👥 目标用户" content={product.targetUsers} />

        {product.coreFeatures.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              ⚡ 核心功能
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.coreFeatures.map((f, i) => (
                <span key={i} className="px-3 py-1.5 text-sm rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.techStack.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🛠 推荐技术栈
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.techStack.map((t, i) => (
                <span key={i} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <Section title="💰 商业模式" content={product.monetization} />
        <Section title="🔍 竞品分析" content={product.competitors} />
        <Section title="✨ 差异化优势" content={product.differentiator} />
        <Section title="🚀 MVP 方案" content={product.mvp} />
      </div>

      {/* 操作 */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleStartBrainstorm}
          disabled={startingBrainstorm}
          className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition disabled:opacity-50"
        >
          {startingBrainstorm ? '创建中...' : '💬 发起 Brainstorm'}
        </button>
        <button
          onClick={handleSubmitLeaderboard}
          disabled={submitState === 'submitting'}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:opacity-90 transition shadow-sm disabled:opacity-50"
        >
          {submitState === 'submitting' ? '提交中...' : submitState === 'done' ? '✅ 已提交' : '🏆 打榜'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
        >
          {deleting ? '删除中...' : '删除'}
        </button>
      </div>

      {/* 打榜邮箱输入 */}
      {showEmailInput && submitState !== 'done' && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
            提交到 AICPB 需要联系邮箱（用于审核通知）
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSubmitLeaderboard}
              disabled={submitState === 'submitting' || !email.includes('@')}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
            >
              确认提交
            </button>
          </div>
        </div>
      )}

      {/* 打榜结果 */}
      {submitResult && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          submitState === 'done'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {submitState === 'done' ? (
            <span>✅ 提交成功！AICPB ID: {submitResult.id} — {submitResult.message}</span>
          ) : (
            <span>❌ {submitResult.message}</span>
          )}
        </div>
      )}

      {/* 历史 Brainstorm 会话 */}
      {brainstormSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Brainstorm 历史
          </h2>
          <div className="space-y-2">
            {brainstormSessions.map((session) => (
              <Link
                key={session.id}
                href={`/brainstorm/${session.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {session.status === 'active' ? '进行中' : '已结束'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {session.participants.length} 人参与 · {session.requirementCount} 条需求
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
