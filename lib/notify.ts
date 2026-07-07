// 轻量级站内信（通知）系统
// 内存 + localStorage 持久化，通过自定义事件跨组件广播

export type NotificationType = 'info' | 'generating' | 'done' | 'error'

export interface AppNotification {
  id: string
  title: string
  body: string
  href?: string        // 点击跳转地址
  type?: NotificationType
  progress?: number    // 0-100，generating 类型可用
  read: boolean
  createdAt: string
}

const STORAGE_KEY = 'ideahub_notifications'
const EVENT_NAME = 'ideahub:notification'

type Listener = () => void
let listeners: Listener[] = []
let cache: AppNotification[] | null = null

function load(): AppNotification[] {
  if (cache) return cache
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      cache = JSON.parse(raw) as AppNotification[]
      return cache
    }
  } catch {}
  cache = []
  return cache
}

function persist(list: AppNotification[]) {
  cache = list
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    }
  } catch {}
  listeners.forEach(l => l())
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

export function getNotifications(): AppNotification[] {
  return load().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addNotification(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
  const list = load()
  const item: AppNotification = {
    ...n,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  list.unshift(item)
  // 最多保留 50 条
  if (list.length > 50) list.length = 50
  persist(list)
  return item
}

// 更新指定通知（用于进度推进 / 由 generating 转为 done）
export function updateNotification(id: string, patch: Partial<Omit<AppNotification, 'id' | 'createdAt'>>): void {
  const list = load()
  const item = list.find(n => n.id === id)
  if (!item) return
  Object.assign(item, patch)
  persist(list)
}

export function findNotification(id: string): AppNotification | undefined {
  return load().find(n => n.id === id)
}

export function markRead(id: string) {
  const list = load()
  const item = list.find(n => n.id === id)
  if (item && !item.read) {
    item.read = true
    persist(list)
  }
}

export function markAllRead() {
  const list = load()
  let changed = false
  list.forEach(n => { if (!n.read) { n.read = true; changed = true } })
  if (changed) persist(list)
}

export function clearAll() {
  persist([])
}

export function unreadCount(): number {
  return load().filter(n => !n.read).length
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}
