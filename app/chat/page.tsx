'use client'

import { useState, useCallback } from 'react'
import ChatContainer, { type Message } from '@/components/chat/ChatContainer'
import type { Idea } from '@/lib/types'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [processing, setProcessing] = useState(false)

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMsg])
    return newMsg
  }, [])

  const updateLastMessage = useCallback((updates: Partial<Message>) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (!last) return prev
      return prev.map((m, i) => i === prev.length - 1 ? { ...m, ...updates } : m)
    })
  }, [])

  const handleIdeaSearch = useCallback(async (userIdea: string) => {
    setProcessing(true)
    addMessage({ role: 'user', content: userIdea })

    // 1) 搜索相关需求
    addMessage({ role: 'assistant', content: `正在搜索「${userIdea}」相关的需求...`, cards: [{ type: 'progress', progress: 20, stage: '搜索中' }] })
    let relatedNeeds: string[] = []
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(userIdea)}`, { cache: 'no-store' })
      const data = await resp.json()
      if (data.results?.length > 0) {
        relatedNeeds = data.results.slice(0, 5).map((r: any) => r.title || r.description || '')
      }
    } catch {}

    // 2) 尝试从 feed 也获取需求
    let feedIdeas: Idea[] = []
    try {
      const feedResp = await fetch('/api/feed', { cache: 'no-store' })
      const feedData = await feedResp.json()
      feedIdeas = (feedData.ideas || []).slice(0, 5)
    } catch {}

    // 聚合需求描述
    const aggregatedNeeds = [
      ...relatedNeeds,
      ...feedIdeas.map(i => `[${i.platform || '社区'}] ${i.title}${i.description ? ': ' + i.description : ''}`),
    ].filter(Boolean)

    const needsSummary = aggregatedNeeds.length > 0
      ? aggregatedNeeds.join('\n')
      : `用户提出的想法：${userIdea}`

    // 3) AI 分析
    updateLastMessage({ content: '正在分析需求并设计产品方案...', cards: [{ type: 'progress', progress: 50, stage: 'AI 分析中' }] })
    try {
      const analyzeResp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitle: userIdea,
          ideaDescription: `相关需求聚合：\n${needsSummary}`,
          platform: 'other',
          category: 'AI工具',
        }),
      })
      const analysis = await analyzeResp.json()
      if (analysis.product) {
        updateLastMessage({
          content: '产品方案设计完成，请确认：',
          cards: [{ type: 'product', data: analysis.product }],
        })
      } else {
        updateLastMessage({ content: `分析失败：${analysis.error || '请重试'}`, cards: undefined })
      }
    } catch (e) {
      updateLastMessage({ content: '分析出错，请稍后重试。', cards: undefined })
    }
    setProcessing(false)
  }, [addMessage, updateLastMessage])

  const handleConfirmProduct = useCallback(async (product: any) => {
    setProcessing(true)
    addMessage({ role: 'assistant', content: '正在生成产品...', cards: [{ type: 'progress', progress: 20, stage: '保存中' }] })

    try {
      // 构建产品对象
      const productId = `prod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      const now = new Date().toISOString()
      const productData = {
        id: productId,
        ideaId: `idea_${productId}`,
        ideaTitle: product.ideaTitle || product.name,
        name: product.name,
        tagline: product.tagline || '',
        problem: product.problem || '',
        solution: product.solution || '',
        targetUsers: product.targetUsers || '',
        coreFeatures: product.coreFeatures || [],
        techStack: product.techStack || [],
        monetization: product.monetization || '',
        competitors: product.competitors || '',
        differentiator: product.differentiator || '',
        mvp: product.mvp || '',
        createdAt: now,
        status: 'confirmed',
        generatedHtml: '',
        votes: 0,
        votedBy: [],
      }

      // 保存产品
      updateLastMessage({ content: '保存产品...', cards: [{ type: 'progress', progress: 40, stage: '保存中' }] })
      const saveResp = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (!saveResp.ok) throw new Error('Save failed')
      const saved = await saveResp.json()
      if (!saved.success) throw new Error('Save failed')

      // 生成 HTML
      updateLastMessage({ content: 'AI 正在生成交互页面...（可能需要 1-3 分钟，请耐心等待）', cards: [{ type: 'progress', progress: 50, stage: 'AI 生成中' }] })
      const genResp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (!genResp.ok) throw new Error('Generate failed')
      const genData = await genResp.json()
      if (!genData.html) throw new Error('No HTML generated')

      // 保存版本
      updateLastMessage({ content: '保存页面...', cards: [{ type: 'progress', progress: 85, stage: '保存中' }] })
      const versionResp = await fetch(`/api/products/${productId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: genData.html }),
      })
      if (!versionResp.ok) throw new Error('Version save failed')

      updateLastMessage({
        content: '✨ 产品已生成并发布！',
        cards: [{ type: 'preview', data: { productId, html: genData.html, name: productData.name } }],
      })
    } catch (e) {
      updateLastMessage({ content: `生成失败：${e instanceof Error ? e.message : '未知错误'}`, cards: undefined })
    }
    setProcessing(false)
  }, [addMessage, updateLastMessage])

  const handleAction = useCallback(async (action: string, data?: any) => {
    if (processing) return

    // 点按社区作品 → 直接分析
    if (action === 'analyze_idea' && data) {
      const idea = data as Idea
      await handleIdeaSearch(idea.title)
      return
    }

    // 确认生成产品
    if (action === 'confirm_product' && data) {
      await handleConfirmProduct(data)
      return
    }

    // 其他操作（社区、部署、打榜等）
    if (action === '看看社区里别人做了什么') {
      addMessage({ role: 'user', content: action })
      addMessage({ role: 'assistant', content: '正在加载社区作品...' })
      try {
        const resp = await fetch('/api/community', { cache: 'no-store' })
        const data = await resp.json()
        const products = data.products?.slice(0, 5) || []
        if (products.length > 0) {
          addMessage({ role: 'assistant', content: `社区有 ${products.length} 个作品：`, cards: products.map((p: any) => ({ type: 'copy', data: { productId: p.id, name: p.name, tagline: p.tagline } })) })
        } else {
          addMessage({ role: 'assistant', content: '社区还没有作品，你来创建第一个吧！' })
        }
      } catch {
        addMessage({ role: 'assistant', content: '加载失败，请稍后重试。' })
      }
      return
    }

    if (action === 'copy_product' && data) {
      addMessage({ role: 'user', content: `复制产品：${data.name}` })
      addMessage({ role: 'assistant', content: '正在复制产品...' })
      try {
        const resp = await fetch('/api/clone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: data.productId }) })
        const result = await resp.json()
        if (result.success) {
          addMessage({ role: 'assistant', content: `已复制「${data.name}」` })
        }
      } catch {
        addMessage({ role: 'assistant', content: '复制失败。' })
      }
      return
    }

    if (action === 'share_product' && data) {
      const url = `${window.location.origin}/p/${data.productId}`
      navigator.clipboard?.writeText(url)
      addMessage({ role: 'assistant', content: `分享链接已复制：${url}` })
      return
    }

    // 默认：用户输入的想法 → 搜索+分析
    await handleIdeaSearch(action)
  }, [processing, addMessage, updateLastMessage, handleIdeaSearch, handleConfirmProduct])

  return (
    <ChatContainer messages={messages} onAction={handleAction} />
  )
}
