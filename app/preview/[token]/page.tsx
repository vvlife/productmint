'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [productId, setProductId] = useState('')

  // 解析 token
  let ideaData
  try {
    // URL decode the token first, then base64 decode
    const decoded = atob(decodeURIComponent(token))
    ideaData = JSON.parse(decoded)
  } catch {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">无效的链接</p>
      </div>
    )
  }

  const { email, ideaTitle, description } = ideaData

  const handleConfirm = async () => {
    setConfirming(true)
    setGenerating(true)
    setProgress(10)
    setStage('正在分析需求...')

    try {
      // 调用生成 API
      const resp = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ideaId: ideaData.ideaId, ideaTitle }),
      })

      setProgress(50)
      setStage('正在生成产品方案...')

      const data = await resp.json()

      if (data.success) {
        setProgress(100)
        setStage('生成完成')
        setProductId(data.product.id)
        setDone(true)

        // 发送站内信通知
        window.dispatchEvent(new CustomEvent('ideahub:notification', {
          detail: {
            type: 'done',
            title: '产品已生成',
            body: `「${data.product.name}」的产品方案已生成完成`,
            href: `/product/${data.product.id}`,
          }
        }))
      } else {
        setError(data.error || '生成失败')
        setGenerating(false)
      }
    } catch (e) {
      setError('网络错误，请重试')
      setGenerating(false)
    }
  }

  if (done) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">产品已生成</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          「{ideaTitle}」的产品方案已生成完成
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href={`/product/${productId}`}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            查看产品方案
          </a>
          <a
            href="/"
            className="px-6 py-2.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
          >
            返回首页
          </a>
        </div>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-gray-100 dark:border-gray-800" />
          <div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-t-gray-900 dark:border-t-white animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">正在生成产品</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{stage}</p>
        <div className="max-w-xs mx-auto h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="py-8 max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">产品预览</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{ideaTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认后将生成：</h3>
        <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <li>• 产品方案（问题分析、解决方案、核心功能）</li>
          <li>• 可运行的 HTML 产品原型</li>
          <li>• 技术栈建议和商业模式</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition"
        >
          确认生成
        </button>
        <a
          href="/"
          className="px-6 py-2.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
        >
          取消
        </a>
      </div>
    </div>
  )
}
