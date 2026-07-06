import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        platform: {
          weibo: '#E6162D',
          zhihu: '#0084FF',
          v2ex: '#333333',
          producthunt: '#DA552F',
          reddit: '#FF4500',
          twitter: '#1DA1F2',
          github: '#181717',
          hackernews: '#FF6600',
          douyin: '#000000',
          xiaohongshu: '#FE2C55',
        },
      },
      maxWidth: {
        'content': '680px',
      },
    },
  },
  plugins: [],
}

export default config
