# IdeaHub

> 创业需求聚合平台 — 搜集社交媒体上的热点需求，汇聚成时间线，给创业者参考。

## ✨ 功能特性

- **时间线首页**：按时间倒序展示热点需求，支持分类筛选
- **需求集合**：相似需求自动聚合，点击查看详情和汇总分析
- **搜索功能**：关键词搜索需求和集合
- **API 接口**：提供数据采集框架，可未来接入真实爬取
- **暗色模式**：自动跟随系统主题
- **响应式设计**：移动端友好

## 🛠 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- 部署到 Vercel

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

## 📦 构建生产版本

```bash
npm run build
npm start
```

## 🔌 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/feed` | GET | 获取时间线数据，支持 `?category=` 筛选 |
| `/api/collections` | GET | 获取需求集合列表 |
| `/api/search?q=关键词` | GET | 搜索需求 |
| `/api/crawl` | POST | 触发爬取任务（框架，待接入） |

## 📁 目录结构

```
ideahub/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页时间线
│   ├── collection/[id]/page.tsx  # 集合详情页
│   ├── search/page.tsx         # 搜索页
│   ├── api/
│   │   ├── feed/route.ts       # 时间线 API
│   │   ├── collections/route.ts # 集合 API
│   │   ├── search/route.ts     # 搜索 API
│   │   └── crawl/route.ts      # 爬取 API
│   └── globals.css
├── components/
│   ├── Header.tsx              # 顶部导航
│   ├── Timeline.tsx            # 时间线组件
│   ├── IdeaCard.tsx            # 需求卡片
│   ├── CollectionCard.tsx      # 集合卡片
│   ├── SearchBar.tsx           # 搜索框
│   └── CategoryFilter.tsx      # 分类筛选
├── lib/
│   ├── data.ts                 # 模拟数据
│   ├── types.ts                # TypeScript 类型
│   └── store.ts                # 数据存储层
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json
└── README.md
```

## 🚢 部署到 Vercel

### 方式一：通过 Vercel 网站

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com) 并登录
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 Next.js 配置，直接点击 "Deploy"
6. 等待部署完成，获得线上地址

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录下执行
cd ideahub
vercel

# 按提示操作（直接回车使用默认值即可）
# 部署完成后，执行以下命令部署到生产环境
vercel --prod
```

## 📄 License

MIT
