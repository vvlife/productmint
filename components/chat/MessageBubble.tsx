'use client'

import type { Message } from './ChatContainer'
import TextCard from './cards/TextCard'
import IdeaCard from './cards/IdeaCard'
import ProductCard from './cards/ProductCard'
import PreviewCard from './cards/PreviewCard'
import ActionCard from './cards/ActionCard'
import ProgressCard from './cards/ProgressCard'
import CopyCard from './cards/CopyCard'

interface MessageBubbleProps {
  message: Message
  onAction?: (action: string, data?: any) => void
}

export default function MessageBubble({ message, onAction }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const renderCard = (card: any, index: number) => {
    switch (card.type) {
      case 'text': return <TextCard key={index} content={card.content} />
      case 'idea': return <IdeaCard key={index} data={card.data} onAction={onAction} />
      case 'product': return <ProductCard key={index} data={card.data} onAction={onAction} />
      case 'preview': return <PreviewCard key={index} data={card.data} onAction={onAction} />
      case 'action': return <ActionCard key={index} actions={card.actions} onAction={onAction} />
      case 'progress': return <ProgressCard key={index} progress={card.progress} stage={card.stage} />
      case 'copy': return <CopyCard key={index} data={card.data} onAction={onAction} />
      default: return null
    }
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
          : 'bg-gradient-to-br from-blue-500 to-indigo-500'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 文本消息 */}
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}>
            {message.content}
          </div>
        )}

        {/* 卡片 */}
        {message.cards?.map((card, i) => renderCard(card, i))}

        {/* 时间戳 */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
