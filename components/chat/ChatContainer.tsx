'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import QuickActions from './QuickActions'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  cards?: any[]
  timestamp: string
}

interface ChatContainerProps {
  messages?: Message[]
  initialMessages?: Message[]
  onAction?: (action: string, data?: any) => void
}

export default function ChatContainer({ messages: externalMessages, initialMessages = [], onAction }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(externalMessages || initialMessages)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 同步外部消息
  useEffect(() => {
    if (externalMessages) {
      setMessages(externalMessages)
    }
  }, [externalMessages])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMsg])
    return newMsg
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* 消息列表 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💡</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                你好，我是 IdeaHub
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                告诉我你的创业想法，或者让我帮你发现热门需求
              </p>
              <QuickActions onAction={(action) => {
                const userMsg = addMessage({ role: 'user', content: action })
                onAction?.(action)
              }} />
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} onAction={onAction} />
          ))}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <ChatInput
        onSend={(text) => {
          addMessage({ role: 'user', content: text })
          onAction?.(text)
        }}
        disabled={isTyping}
      />
    </div>
  )
}
