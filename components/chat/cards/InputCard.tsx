'use client'

import { useState } from 'react'

interface InputCardProps {
  placeholder?: string
  label?: string
  inputType?: 'text' | 'email' | 'textarea'
  onSubmit?: (value: string) => void
}

export default function InputCard({ placeholder, label, inputType = 'text', onSubmit }: InputCardProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit?.(value.trim())
    setValue('')
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-w-sm">
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {inputType === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          确认
        </button>
      </div>
    </div>
  )
}
