'use client'

import { useState, useCallback, useRef } from 'react'
import ChatContainer, { type Message } from '@/components/chat/ChatContainer'
import type { Idea, Product, FeedResponse } from '@/lib/types'
import { addNotification } from '@/lib/notify'

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const chatRef = useRef<any>(null)

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMsg])
    return newMsg
  }, [])

  const handleAction = useCallback(async (action: string, data?: any) => {
    // 处理快捷操作
    if (action === '帮我找一些热门的创业需求') {
      addMessage({ role: 'assistant', content: '正在从多个平台搜索热门创业需求...' , cards: [{ type: 'progress', progress: 30, stage: '搜索中' }]})

      try {
        const resp = await fetch('/api/feed', { cache: 'no-store' })
        const feedData: FeedResponse = await resp.json()
        const ideas = feedData.ideas?.slice(0, 5) || []

        if (ideas.length > 0) {
          addMessage({
            role: 'assistant',
            content: `找到了 ${ideas.length} 个热门需求，点击你想分析的需求：`,
            cards: ideas.map(idea => ({ type: 'idea', data: idea })),
          })
        } else {
          addMessage({
            role: 'assistant',
            content: '暂时没有找到热门需求，你可以点击「刷新」按钮抓取，或者直接告诉我你的想法。',
            cards: [{ type: 'action', actions: [
              { label: '刷新抓取', action: 'refresh_crawl', icon: '🔄' },
              { label: '我有想法', action: '我有一个创业想法', icon: '💡' },
            ]}],
          })
        }
      } catch {
        addMessage({ role: 'assistant', content: '搜索失败，请稍后重试或直接告诉我你的想法。' })
      }
    }

    else if (action === '我有一个创业想法') {
      addMessage({
        role: 'assistant',
        content: '太棒了！请描述你的创业想法，我会帮你分析并生成产品方案。',
        cards: [{ type: 'input', placeholder: '例如：我想做一个AI帮你写周报的工具', label: '描述你的想法' }],
      })
    }

    else if (action === '帮我把一个想法变成产品') {
      addMessage({
        role: 'assistant',
        content: '请告诉我你想变成产品的想法，我来帮你完成从需求分析到产品生成的全过程。',
        cards: [{ type: 'input', placeholder: '输入产品想法或需求', label: '产品想法' }],
      })
    }

    else if (action === '看看社区里别人做了什么') {
      addMessage({ role: 'assistant', content: '正在加载社区作品...' })
      try {
        const resp = await fetch('/api/community', { cache: 'no-store' })
        const data = await resp.json()
        const products = data.products?.slice(0, 5) || []

        if (products.length > 0) {
          addMessage({
            role: 'assistant',
            content: `社区有 ${products.length} 个作品，你可以复制任何一个进行改编：`,
            cards: products.map((p: any) => ({
              type: 'copy',
              data: { productId: p.id, name: p.name, tagline: p.tagline },
            })),
          })
        } else {
          addMessage({
            role: 'assistant',
            content: '社区还没有作品，你来创建第一个吧！',
            cards: [{ type: 'action', actions: [
              { label: '创建产品', action: '帮我把一个想法变成产品', icon: '🚀', primary: true },
            ]}],
          })
        }
      } catch {
        addMessage({ role: 'assistant', content: '加载失败，请稍后重试。' })
      }
    }

    else if (action === 'refresh_crawl') {
      addMessage({ role: 'assistant', content: '正在抓取最新需求...', cards: [{ type: 'progress', progress: 50, stage: '抓取中' }] })
      try {
        const resp = await fetch('/api/crawl', { method: 'POST' })
        const data = await resp.json()
        if (data.success) {
          addMessage({
            role: 'assistant',
            content: `抓取完成！找到 ${data.ideas?.length || 0} 个需求，选择一个来分析：`,
            cards: (data.ideas || []).slice(0, 5).map((idea: Idea) => ({ type: 'idea', data: idea })),
          })
        }
      } catch {
        addMessage({ role: 'assistant', content: '抓取失败，请稍后重试。' })
      }
    }

    else if (action === 'analyze_idea' && data) {
      const idea = data as Idea
      addMessage({
        role: 'user',
        content: `分析这个需求：${idea.title}`,
      })
      addMessage({
        role: 'assistant',
        content: `正在分析「${idea.title}」...`,
        cards: [{ type: 'progress', progress: 20, stage: 'AI 分析中' }],
      })

      try {
        const analyzeResp = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idea),
        })
        const analysis = await analyzeResp.json()

        if (analysis.name) {
          addMessage({
            role: 'assistant',
            content: 'AI 分析完成！这是生成的产品方案：',
            cards: [{ type: 'product', data: analysis }],
          })
        } else {
          addMessage({ role: 'assistant', content: '分析失败，请重试。' })
        }
      } catch {
        addMessage({ role: 'assistant', content: '分析出错，请稍后重试。' })
      }
    }

    else if (action === 'confirm_product' && data) {
      addMessage({ role: 'user', content: '确认生成产品' })
      addMessage({
        role: 'assistant',
        content: '正在保存产品并生成页面...',
        cards: [{ type: 'progress', progress: 30, stage: '保存中' }],
      })

      try {
        // 保存产品
        const saveResp = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const saved = await saveResp.json()
        const productId = saved.product?.id || saved.id

        if (productId) {
          // 生成 HTML
          addMessage({
            role: 'assistant',
            content: '产品已保存，正在生成可运行的页面...',
            cards: [{ type: 'progress', progress: 60, stage: 'AI 生成页面中' }],
          })

          const genResp = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const genData = await genResp.json()

          if (genData.html) {
            // 保存版本
            await fetch(`/api/products/${productId}/versions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ html: genData.html }),
            })

            addMessage({
              role: 'assistant',
              content: '产品页面生成完成！你可以预览、部署或分享。',
              cards: [{
                type: 'preview',
                data: { productId, html: genData.html, name: data.name },
              }],
            })
          } else {
            addMessage({
              role: 'assistant',
              content: '页面生成失败，但产品方案已保存。你可以在产品详情页重试。',
              cards: [{ type: 'action', actions: [
                { label: '查看产品', action: `go_product_${productId}`, icon: '📦' },
              ]}],
            })
          }
        }
      } catch {
        addMessage({ role: 'assistant', content: '保存失败，请稍后重试。' })
      }
    }

    else if (action === 'adjust_product' && data) {
      addMessage({
        role: 'assistant',
        content: '请告诉我你想怎么调整这个产品：',
        cards: [{ type: 'input', placeholder: '例如：把主色调改成深色，增加用户评价功能', label: '调整要求' }],
      })
    }

    else if (action === 'deploy' && data) {
      addMessage({ role: 'user', content: '部署到公网' })
      addMessage({ role: 'assistant', content: '正在部署...', cards: [{ type: 'progress', progress: 50, stage: '部署中' }] })

      try {
        const resp = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: data.productId }),
        })
        const result = await resp.json()
        if (result.success) {
          addMessage({
            role: 'assistant',
            content: `部署成功！访问链接：${result.url}`,
            cards: [{ type: 'action', actions: [
              { label: '打开链接', action: `open_${result.url}`, icon: '🔗' },
            ]}],
          })
          addNotification({ title: '部署成功', body: '产品已部署到公网', type: 'done' })
        }
      } catch {
        addMessage({ role: 'assistant', content: '部署失败，请稍后重试。' })
      }
    }

    else if (action === 'submit_leaderboard' && data) {
      addMessage({
        role: 'assistant',
        content: '请提供你的联系邮箱，用于 AICPB 审核通知：',
        cards: [{ type: 'input', placeholder: 'your@email.com', label: '联系邮箱', inputType: 'email' }],
      })
    }

    else if (action === 'copy_product' && data) {
      addMessage({ role: 'user', content: `复制产品：${data.name}` })
      addMessage({ role: 'assistant', content: '正在复制产品...' })

      try {
        const resp = await fetch('/api/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: data.productId }),
        })
        const result = await resp.json()
        if (result.success) {
          addMessage({
            role: 'assistant',
            content: `已复制「${data.name}」，你现在可以告诉我要怎么修改它。`,
            cards: [{ type: 'preview', data: { productId: result.product.id, name: result.product.name } }],
          })
        }
      } catch {
        addMessage({ role: 'assistant', content: '复制失败，请稍后重试。' })
      }
    }

    else if (action === 'share_product' && data) {
      const url = `${window.location.origin}/p/${data.productId}`
      navigator.clipboard?.writeText(url)
      addMessage({
        role: 'assistant',
        content: `分享链接已复制到剪贴板：${url}`,
      })
    }

    else if (action.startsWith('go_product_')) {
      const productId = action.replace('go_product_', '')
      window.location.href = `/product/${productId}`
    }

    else if (action.startsWith('open_')) {
      const url = action.replace('open_', '')
      window.open(url, '_blank')
    }

    // 用户输入的自由文本 - 作为搜索或新需求
    else if (!action.startsWith('refresh_') && !action.startsWith('go_') && !action.startsWith('open_')) {
      // 检查是否是输入卡片的提交
      if (data?.type === 'input_card') {
        // 处理输入卡片的值
        addMessage({ role: 'user', content: data.value })
        // 可以根据上下文做更多处理
        return
      }

      // 普通文本 - 尝试搜索
      addMessage({ role: 'assistant', content: `正在搜索「${action}」相关的需求...` })
      try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(action)}`, { cache: 'no-store' })
        const data = await resp.json()
        const results = data.results || []

        if (results.length > 0) {
          addMessage({
            role: 'assistant',
            content: `找到 ${results.length} 个相关结果：`,
            cards: results.slice(0, 5).map((r: any) => ({ type: 'idea', data: r })),
          })
        } else {
          addMessage({
            role: 'assistant',
            content: `没有找到「${action}」相关的需求。你可以直接描述你的想法，我来帮你分析生成产品。`,
            cards: [{ type: 'action', actions: [
              { label: '直接生成', action: `generate_from_${action}`, icon: '🚀', primary: true },
            ]}],
          })
        }
      } catch {
        addMessage({ role: 'assistant', content: '搜索失败，请稍后重试。' })
      }
    }
  }, [addMessage])

  return (
    <ChatContainer
      messages={messages}
      onAction={handleAction}
    />
  )
}
