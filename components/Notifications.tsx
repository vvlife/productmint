'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getNotifications,
  markRead,
  markAllRead,
  clearAll,
  subscribe,
  type AppNotification,
} from '@/lib/notify'

export default function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const refresh = () => setItems(getNotifications())
  const count = items.filter(n => !n.read).length

  useEffect(() => {
    refresh()
    const unsub = subscribe(refresh)
    window.addEventListener('ideahub:notification', refresh)
    return () => {
      unsub()
      window.removeEventListener('ideahub:notification', refresh)
    }
  }, [])

  const handleClick = (n: AppNotification) => {
    markRead(n.id)
    setOpen(false)
    if (n.href) router.push(n.href)
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        title="站内信"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">站内信</span>
              {items.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  清空
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  暂无消息
                </div>
              ) : (
                items.map(n => {
                  const isGenerating = n.type === 'generating'
                  return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                      n.read ? '' : 'bg-blue-50/40 dark:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && !isGenerating && (
                        <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                      {isGenerating && (
                        <span className="mt-1 w-3.5 h-3.5 shrink-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        {isGenerating && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${Math.max(5, Math.min(100, n.progress || 0))}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                          {new Date(n.createdAt).toLocaleString('zh-CN', { hour12: false })}
                        </p>
                      </div>
                    </div>
                  </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
