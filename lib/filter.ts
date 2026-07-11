// ── 广告/垃圾内容过滤 ──────────────────────────────────────────

// 广告关键词列表
const AD_KEYWORDS = [
  // 推广营销
  '推广', '引流', '裂变', '获客',
  // 优惠促销
  '秒杀', '限时', '免费领', '0元',
  '盖楼送', '抽奖', '送礼品', '送激活码', '送余额',
  // 联系方式诱导
  '加群', '扫码', '加好友', '加v', '加V',
  // 诱导点击
  '点击链接', '速来', '先到先得',
  // 金融投资广告
  '开户', '低佣', '万1免5',
  // 其他
  '赞助', '商务合作',
]

// 广告标题模式（正则）
const AD_PATTERNS = [
  /\d+折/,
  /\d+%.*off/i,
  /立减\d+/,
  /满\d+减\d+/,
  /\d+元.*包邮/,
  /【.*广告.*】/,
  /【.*推广.*】/,
]

// 判断是否为广告内容
export function isAdContent(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase()

  for (const keyword of AD_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return true
    }
  }

  for (const pattern of AD_PATTERNS) {
    if (pattern.test(title)) {
      return true
    }
  }

  return false
}

// 过滤广告内容
export function filterAds<T extends { title: string; description: string }>(
  items: T[]
): T[] {
  return items.filter(item => !isAdContent(item.title, item.description))
}
