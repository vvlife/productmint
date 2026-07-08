'use client'

interface CopyCardProps {
  data: {
    productId: string
    name: string
    tagline: string
  }
  onAction?: (action: string, data?: any) => void
}

export default function CopyCard({ data, onAction }: CopyCardProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📋</span>
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">复制产品</span>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
        将「{data.name}」复制到你的账户，可以在此基础上修改
      </p>
      <button
        onClick={() => onAction?.('clone_product', data)}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:opacity-90 transition"
      >
        复制并改编
      </button>
    </div>
  )
}
