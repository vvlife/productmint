'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { BrainstormSession, BrainstormRequirement } from '@/lib/types'

type RequirementType = 'requirement' | 'feedback' | 'suggestion'

const TYPE_LABELS: Record<RequirementType, { label: string; color: string }> = {
  requirement: { label: '需求', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  feedback: { label: '反馈', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  suggestion: { label: '建议', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export default function BrainstormPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<BrainstormSession | null>(null)
  const [requirements, setRequirements] = useState<BrainstormRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<RequirementType>('requirement')
  const [submitting, setSubmitting] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showMergeResult, setShowMergeResult] = useState(false)
  const [mergedText, setMergedText] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      const resp = await fetch(`/api/brainstorm/${sessionId}`, { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        setSession(data.session)
        setRequirements(data.requirements || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // 轮询更新（每 3 秒）
  useEffect(() => {
    if (session?.status === 'closed') return
    const timer = setInterval(fetchSession, 3000)
    return () => clearInterval(timer)
  }, [fetchSession, session?.status])

  // 从 localStorage 读取/保存昵称
  useEffect(() => {
    const saved = localStorage.getItem('brainstorm_author')
    if (saved) setAuthor(saved)
  }, [])

  const handleAuthorChange = (value: string) => {
    setAuthor(value)
    localStorage.setItem('brainstorm_author', value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim() || submitting) return

    setSubmitting(true)
    try {
      await fetch(`/api/brainstorm/${sessionId}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim(), content: content.trim(), type }),
      })
      setContent('')
      await fetchSession()
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('确定要结束 Brainstorm 并合并所有需求吗？')) return
    setClosing(true)
    try {
      const resp = await fetch(`/api/brainstorm/${sessionId}/close`, { method: 'POST' })
      if (resp.ok) {
        const data = await resp.json()
        setMergedText(data.mergedRequirements)
        setShowMergeResult(true)
        await fetchSession()
      }
    } catch {} finally {
      setClosing(false)
    }
  }

  const handleRegenerate = async () => {
    if (!session) return
    setRegenerating(true)
    try {
      // 获取产品信息，用合并后的需求重新生成
      const resp = await fetch(`/api/products/${session.productId}`)
      if (!resp.ok) return
      const { product } = await resp.json()
      if (!product) return

      // 将合并的需求追加到产品描述中
      const genResp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          tagline: product.tagline,
          problem: product.problem,
          solution: product.solution + '\n\n## 用户反馈的补充需求\n' + (mergedText || session.mergedRequirements || ''),
          targetUsers: product.targetUsers,
          coreFeatures: product.coreFeatures,
          techStack: product.techStack,
        }),
      })

      if (genResp.ok) {
        const { html } = await genResp.json()
        // 保存新版本
        await fetch(`/api/products/${session.productId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html,
            prompt: `Brainstorm 合并需求 (${session.requirementCount}条来自${session.participants.length}人)`,
          }),
        })
        // 跳转到产品页
        router.push(`/product/${session.productId}`)
      }
    } catch {} finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
        <p className="mt-4 text-sm text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-gray-500 dark:text-gray-400 mb-2">Brainstorm 会话不存在</p>
        <Link href="/" className="text-blue-500 hover:underline text-sm">返回首页</Link>
      </div>
    )
  }

  const isActive = session.status === 'active'

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={isActive ? `/product/${session.productId}` : '/'} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </Link>

      {/* 会话头部 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Brainstorm
              </h1>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {isActive ? '进行中' : '已结束'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              针对产品「{session.productTitle}」的协作需求讨论
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span>{session.participants.length} 位参与者</span>
              <span>{session.requirementCount} 条需求</span>
              <span>{new Date(session.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          {isActive && (
            <button
              onClick={handleClose}
              disabled={closing || session.requirementCount === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {closing ? '合并中...' : '结束并合并需求'}
            </button>
          )}
          {!isActive && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {regenerating ? '生成中...' : '用合并需求重新生成产品'}
            </button>
          )}
        </div>
      </div>

      {/* 合并结果弹窗 */}
      {showMergeResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-green-800 dark:text-green-300">合并结果</h3>
            <button onClick={() => setShowMergeResult(false)} className="text-green-600 dark:text-green-400 hover:text-green-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap font-mono">{mergedText}</pre>
        </div>
      )}

      {/* 需求列表 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          协作需求列表
        </h2>
        {requirements.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-4xl mb-3">💡</p>
            <p className="text-gray-500 dark:text-gray-400">还没有需求，快来添加第一条吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => {
              const typeInfo = TYPE_LABELS[req.type]
              return (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {req.author.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{req.author}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(req.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{req.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加需求表单 */}
      {isActive && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="mb-3">
            <input
              type="text"
              value={author}
              onChange={(e) => handleAuthorChange(e.target.value)}
              placeholder="你的昵称"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div className="mb-3">
            <div className="flex gap-2">
              {(Object.keys(TYPE_LABELS) as RequirementType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    type === t
                      ? TYPE_LABELS[t].color
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {TYPE_LABELS[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的需求、反馈或建议..."
              required
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!author.trim() || !content.trim() || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
