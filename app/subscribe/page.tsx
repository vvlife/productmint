'use client'

import { useState } from 'react'
import Link from 'next/link'

const TOPICS = [
  { id: 'ai-tools', name: 'AI 工具', desc: 'AI 写作、编程、设计等工具' },
  { id: 'saas', name: 'SaaS 产品', desc: '企业软件、协作工具' },
  { id: 'dev-tools', name: '开发者工具', desc: 'IDE、框架、API' },
  { id: 'consumer', name: '消费科技', desc: '电商、社交、生活服务' },
  { id: 'education', name: '教育科技', desc: '在线学习、培训平台' },
  { id: 'design', name: '设计工具', desc: 'UI/UX、图形设计' },
  { id: 'global', name: '出海产品', desc: '跨境、国际化产品' },
  { id: 'hardware', name: '智能硬件', desc: 'IoT、可穿戴设备' },
]

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || selectedTopics.length === 0) return

    setSubmitting(true)
    setError('')
    try {
      const resp = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), topics: selectedTopics }),
      })
      const data = await resp.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || '订阅失败')
      }
    } catch {
      setError('网络错误，请重试')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">订阅成功</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          我们会在每天早上 9 点为你收集最新资讯，<br />
          有新的产品想法会发送到你的邮箱。
        </p>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">订阅每日资讯</h1>
        <p className="text-gray-500 dark:text-gray-400">
          选择你感兴趣的主题，我们会每天为你收集最新资讯，<br />
          生成产品想法发送到你的邮箱。
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮箱地址
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            感兴趣的主题
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS.map(topic => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`p-3 rounded-lg border text-left transition ${
                  selectedTopics.includes(topic.id)
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium">{topic.name}</div>
                <div className={`text-xs mt-0.5 ${
                  selectedTopics.includes(topic.id)
                    ? 'text-gray-300 dark:text-gray-600'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {topic.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={!email.trim() || selectedTopics.length === 0 || submitting}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? '订阅中...' : '订阅'}
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
        每天早上 9 点发送，随时可取消订阅
      </p>
    </div>
  )
}
