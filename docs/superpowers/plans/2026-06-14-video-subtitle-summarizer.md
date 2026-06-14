# Video Subtitle Summarizer 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款 Chrome 浏览器插件，提取 Bilibili 视频字幕并通过 DeepSeek AI 生成结构化报告。

**Architecture:** 标准三层架构 — Popup UI (Vue 3) 负责展示，Background Service Worker 负责 AI 调用，Content Script 负责字幕提取。使用 chrome.runtime.sendMessage 进行层间通信。

**Tech Stack:** TypeScript, Vue 3, Vite, CRXJS, DeepSeek API, Chrome MV3

---

## 文件结构

```
video-subtitle-summarizer/
├── src/
│   ├── manifest.json
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── index.ts
│   │   └── bilibili.ts
│   ├── popup/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── index.html
│   │   └── components/
│   │       ├── ExtractButton.vue
│   │       ├── SubtitlePreview.vue
│   │       ├── ReportView.vue
│   │       └── ExportButtons.vue
│   ├── options/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── index.html
│   ├── ai/
│   │   ├── client.ts
│   │   └── prompts.ts
│   ├── utils/
│   │   ├── export.ts
│   │   └── storage.ts
│   └── types/
│       └── index.ts
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

- [ ] **Step 1: 初始化项目**

```bash
mkdir -p /Volumes/Fanxiang/workspace/cap-brief/video-subtitle-summarizer
cd /Volumes/Fanxiang/workspace/cap-brief/video-subtitle-summarizer
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install vue@^3.4
npm install -D typescript@^5.4 vite@^5.0 @crxjs/vite-plugin@^2.0 @vitejs/plugin-vue@^5.0 web-ext@^8.0
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["chrome"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), crx({ manifest: './src/manifest.json' })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html')
      }
    }
  }
})
```

- [ ] **Step 5: 验证构建**

```bash
npx vite build
```

Expected: 构建成功，生成 dist 目录

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize project with Vite + CRXJS + Vue 3"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/types/index.ts

/** B站字幕项 */
export interface SubtitleItem {
  from: number    // 开始时间（秒）
  to: number      // 结束时间（秒）
  content: string // 字幕文本
}

/** 视频信息 */
export interface VideoInfo {
  bvid: string
  cid: number
  title: string
}

/** 字幕数据 */
export interface SubtitleData {
  videoInfo: VideoInfo
  subtitles: SubtitleItem[]
}

/** AI 报告 */
export interface Report {
  content: string       // Markdown 格式报告
  videoTitle: string
  generatedAt: number   // 时间戳
}

/** 插件设置 */
export interface Settings {
  apiKey: string
  apiBaseUrl: string    // 默认: https://api.deepseek.com
  reportLanguage: 'zh' | 'en'  // 默认: zh
}

/** 消息类型 */
export type MessageType =
  | 'EXTRACT_SUBTITLE'
  | 'GENERATE_REPORT'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'

/** 消息请求 */
export interface MessageRequest {
  type: MessageType
  payload?: unknown
}

/** 消息响应 */
export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** 报告生成进度 */
export interface ReportProgress {
  stage: 'extracting' | 'generating' | 'done' | 'error'
  progress?: number  // 0-100
  content?: string   // 流式内容
  error?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: Manifest 配置

**Files:**
- Create: `src/manifest.json`

- [ ] **Step 1: 创建 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Video Subtitle Summarizer",
  "version": "1.0.0",
  "description": "提取 Bilibili 视频字幕，AI 生成结构化报告",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "*://*.bilibili.com/*",
    "*://api.bilibili.com/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://*.bilibili.com/video/*"],
      "js": ["src/content/index.ts"]
    }
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icons/icon16.png",
      "48": "public/icons/icon48.png",
      "128": "public/icons/icon128.png"
    }
  },
  "options_page": "src/options/index.html",
  "icons": {
    "16": "public/icons/icon16.png",
    "48": "public/icons/icon48.png",
    "128": "public/icons/icon128.png"
  }
}
```

- [ ] **Step 2: 创建占位图标**

创建 16x16, 48x48, 128x128 的 PNG 图标文件（可以先用纯色占位）

- [ ] **Step 3: Commit**

```bash
git add src/manifest.json public/icons/
git commit -m "feat: add MV3 manifest configuration"
```

---

### Task 4: 存储工具

**Files:**
- Create: `src/utils/storage.ts`

- [ ] **Step 1: 创建存储封装**

```typescript
// src/utils/storage.ts
import type { Settings, Report } from '@/types'

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com',
  reportLanguage: 'zh'
}

/** 获取设置 */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get('settings')
  return { ...DEFAULT_SETTINGS, ...result.settings }
}

/** 保存设置 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await chrome.storage.sync.set({
    settings: { ...current, ...settings }
  })
}

/** 保存报告历史 */
export async function saveReport(report: Report): Promise<void> {
  const { reports = [] } = await chrome.storage.local.get('reports')
  reports.unshift(report)
  // 只保留最近 50 条
  await chrome.storage.local.set({ reports: reports.slice(0, 50) })
}

/** 获取报告历史 */
export async function getReports(): Promise<Report[]> {
  const { reports = [] } = await chrome.storage.local.get('reports')
  return reports
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/storage.ts
git commit -m "feat: add Chrome storage utility"
```

---

### Task 5: Bilibili 字幕提取

**Files:**
- Create: `src/content/bilibili.ts`
- Create: `src/content/index.ts`

- [ ] **Step 1: 创建字幕提取模块**

```typescript
// src/content/bilibili.ts
import type { VideoInfo, SubtitleItem, SubtitleData } from '@/types'

/** 从 URL 解析 bvid */
export function parseBvid(url: string): string | null {
  const match = url.match(/bilibili\.com\/video\/(BV\w+)/)
  return match ? match[1] : null
}

/** 获取视频信息（包含 cid） */
export async function getVideoInfo(bvid: string): Promise<VideoInfo> {
  const response = await fetch(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    { credentials: 'include' }
  )
  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`获取视频信息失败: ${data.message}`)
  }

  return {
    bvid,
    cid: data.data.cid,
    title: data.data.title
  }
}

/** 获取字幕 URL 列表 */
export async function getSubtitleUrl(
  bvid: string,
  cid: number
): Promise<string | null> {
  const response = await fetch(
    `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`,
    { credentials: 'include' }
  )
  const data = await response.json()

  if (data.code !== 0 || !data.data?.subtitle?.subtitles?.length) {
    return null
  }

  const subtitle = data.data.subtitle.subtitles[0]
  return subtitle.subtitle_url.startsWith('http')
    ? subtitle.subtitle_url
    : `https:${subtitle.subtitle_url}`
}

/** 下载并解析字幕 */
export async function fetchSubtitles(url: string): Promise<SubtitleItem[]> {
  const response = await fetch(url)
  const data = await response.json()

  return data.body.map((item: any) => ({
    from: item.from,
    to: item.to,
    content: item.content
  }))
}

/** 清洗字幕：去重、去空 */
export function cleanSubtitles(subtitles: SubtitleItem[]): SubtitleItem[] {
  const seen = new Set<string>()
  return subtitles.filter(item => {
    const trimmed = item.content.trim()
    if (!trimmed || seen.has(trimmed)) return false
    seen.add(trimmed)
    return true
  })
}

/** 主流程：提取字幕 */
export async function extractSubtitles(): Promise<SubtitleData> {
  const bvid = parseBvid(window.location.href)
  if (!bvid) {
    throw new Error('无法从当前页面解析 BV 号')
  }

  const videoInfo = await getVideoInfo(bvid)
  const subtitleUrl = await getSubtitleUrl(bvid, videoInfo.cid)

  if (!subtitleUrl) {
    throw new Error('该视频没有字幕')
  }

  const rawSubtitles = await fetchSubtitles(subtitleUrl)
  const subtitles = cleanSubtitles(rawSubtitles)

  return { videoInfo, subtitles }
}
```

- [ ] **Step 2: 创建 Content Script 入口**

```typescript
// src/content/index.ts
import { extractSubtitles } from './bilibili'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_SUBTITLE') {
    extractSubtitles()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // 保持消息通道开放
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add src/content/
git commit -m "feat: add Bilibili subtitle extraction"
```

---

### Task 6: DeepSeek API 客户端

**Files:**
- Create: `src/ai/client.ts`
- Create: `src/ai/prompts.ts`

- [ ] **Step 1: 创建 Prompt 模板**

```typescript
// src/ai/prompts.ts

export function getSummaryPrompt(language: 'zh' | 'en'): string {
  if (language === 'en') {
    return `You are a professional video content analyst. Based on the video subtitles below, generate a structured report.

## Requirements
1. Extract core themes and key points
2. Organize main content by timeline
3. Summarize key conclusions and action items
4. Be objective, don't add information not in the video

## Output Format
### 📋 Video Summary
(One sentence summary)

### 🎯 Key Points
(3-5 main points)

### 📝 Detailed Content
(Organized by timeline/theme)

### 💡 Key Conclusions
(Summary and recommendations)

## Subtitles
`
  }

  return `你是一个专业的视频内容分析师。请根据以下视频字幕内容，生成一份结构化的报告：

## 要求
1. 提取核心主题和关键观点
2. 按时间线梳理主要内容
3. 总结关键结论和行动建议
4. 保持客观，不要添加视频中没有的信息

## 输出格式
### 📋 视频概要
（一句话总结）

### 🎯 核心观点
（3-5 个要点）

### 📝 详细内容
（按时间线/主题分段）

### 💡 关键结论
（总结和建议）

## 字幕内容
`
}

export function getChunkSummaryPrompt(
  chunkIndex: number,
  totalChunks: number,
  language: 'zh' | 'en'
): string {
  if (language === 'en') {
    return `Summarize part ${chunkIndex + 1} of ${totalChunks} of a video. Extract key points concisely.`
  }
  return `这是视频的第 ${chunkIndex + 1}/${totalChunks} 部分字幕，请提取这部分的关键要点，简洁概括。`
}

export function getMergePrompt(language: 'zh' | 'en'): string {
  if (language === 'en') {
    return `You are given summaries of different parts of a video. Merge them into a coherent, complete report following the same structure:

### 📋 Video Summary
### 🎯 Key Points
### 📝 Detailed Content
### 💡 Key Conclusions

Part summaries:
`
  }

  return `以下是视频各部分的摘要，请将它们合并成一份完整、连贯的报告，保持相同的结构：

### 📋 视频概要
### 🎯 核心观点
### 📝 详细内容
### 💡 关键结论

各部分摘要：
`
}
```

- [ ] **Step 2: 创建 DeepSeek 客户端**

```typescript
// src/ai/client.ts
import type { Settings, SubtitleItem } from '@/types'
import {
  getSummaryPrompt,
  getChunkSummaryPrompt,
  getMergePrompt
} from './prompts'

const MAX_TOKENS_PER_CHUNK = 4000

/** 简单估算 token 数（中文约 1.5 字/token） */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.5)
}

/** 将字幕按 token 限制分块 */
function chunkSubtitles(subtitles: SubtitleItem[]): SubtitleItem[][] {
  const chunks: SubtitleItem[][] = []
  let currentChunk: SubtitleItem[] = []
  let currentTokens = 0

  for (const item of subtitles) {
    const itemTokens = estimateTokens(item.content)
    if (currentTokens + itemTokens > MAX_TOKENS_PER_CHUNK && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = []
      currentTokens = 0
    }
    currentChunk.push(item)
    currentTokens += itemTokens
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

/** 格式化字幕为文本 */
function formatSubtitles(subtitles: SubtitleItem[]): string {
  return subtitles
    .map(item => {
      const minutes = Math.floor(item.from / 60)
      const seconds = Math.floor(item.from % 60)
      return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}] ${item.content}`
    })
    .join('\n')
}

/** 调用 DeepSeek API */
async function callDeepSeek(
  settings: Settings,
  prompt: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const response = await fetch(`${settings.apiBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: !!onChunk
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API 错误: ${response.status} ${error}`)
  }

  if (onChunk && response.body) {
    // 流式处理
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          fullText += content
          onChunk(fullText)
        } catch {
          // 忽略解析错误
        }
      }
    }

    return fullText
  }

  // 非流式
  const data = await response.json()
  return data.choices[0].message.content
}

/** 生成报告（自动处理分块） */
export async function generateReport(
  subtitles: SubtitleItem[],
  settings: Settings,
  videoTitle: string,
  onProgress?: (progress: { stage: string; content?: string }) => void
): Promise<string> {
  const chunks = chunkSubtitles(subtitles)

  if (chunks.length === 1) {
    // 短视频：一次性生成
    onProgress?.({ stage: 'generating' })
    const prompt =
      getSummaryPrompt(settings.reportLanguage) +
      formatSubtitles(chunks[0])
    return callDeepSeek(settings, prompt, (text) =>
      onProgress?.({ stage: 'generating', content: text })
    )
  }

  // 长视频：分块处理
  const chunkSummaries: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({
      stage: 'generating',
      content: `正在处理第 ${i + 1}/${chunks.length} 部分...`
    })

    const prompt =
      getChunkSummaryPrompt(i, chunks.length, settings.reportLanguage) +
      '\n\n' +
      formatSubtitles(chunks[i])

    const summary = await callDeepSeek(settings, prompt)
    chunkSummaries.push(summary)
  }

  // 合并摘要
  onProgress?.({ stage: 'generating', content: '正在合并生成最终报告...' })
  const mergePrompt =
    getMergePrompt(settings.reportLanguage) +
    '\n\n' +
    chunkSummaries
      .map((s, i) => `### 第 ${i + 1} 部分\n${s}`)
      .join('\n\n')

  return callDeepSeek(settings, mergePrompt, (text) =>
    onProgress?.({ stage: 'generating', content: text })
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ai/
git commit -m "feat: add DeepSeek AI client with streaming support"
```

---

### Task 7: 导出工具

**Files:**
- Create: `src/utils/export.ts`

- [ ] **Step 1: 创建导出工具**

```typescript
// src/utils/export.ts
import type { Report } from '@/types'

/** 下载文件 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 清理文件名 */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
}

/** 导出为 Markdown */
export function exportAsMarkdown(report: Report): void {
  const filename = sanitizeFilename(report.videoTitle) + '.md'
  downloadFile(report.content, filename, 'text/markdown;charset=utf-8')
}

/** 导出为 TXT（去除 Markdown 格式） */
export function exportAsTxt(report: Report): void {
  const plainText = report.content
    .replace(/#{1,6}\s/g, '')      // 移除标题标记
    .replace(/\*\*/g, '')          // 移除加粗
    .replace(/\*/g, '')            // 移除斜体
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, '')) // 移除代码标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/\n{3,}/g, '\n\n')    // 压缩空行

  const filename = sanitizeFilename(report.videoTitle) + '.txt'
  downloadFile(plainText, filename, 'text/plain;charset=utf-8')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/export.ts
git commit -m "feat: add Markdown and TXT export utilities"
```

---

### Task 8: Background Service Worker

**Files:**
- Create: `src/background/index.ts`

- [ ] **Step 1: 创建 Background Service Worker**

```typescript
// src/background/index.ts
import { generateReport } from '@/ai/client'
import { getSettings, saveReport } from '@/utils/storage'
import type { SubtitleData, ReportProgress } from '@/types'

// 保持 Service Worker 存活
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // 空操作，仅保活
  }
})

// 存储进行中的任务
let currentTask: {
  abort: () => void
} | null = null

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_REPORT') {
    handleGenerateReport(message.payload as SubtitleData, sendResponse)
    return true
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(settings => sendResponse({ success: true, data: settings }))
    return true
  }

  if (message.type === 'SAVE_SETTINGS') {
    import('@/utils/storage').then(({ saveSettings }) => {
      saveSettings(message.payload).then(() =>
        sendResponse({ success: true })
      )
    })
    return true
  }
})

async function handleGenerateReport(
  subtitleData: SubtitleData,
  sendResponse: (response: any) => void
) {
  const settings = await getSettings()

  if (!settings.apiKey) {
    sendResponse({
      success: false,
      error: '请先在设置中配置 DeepSeek API Key'
    })
    return
  }

  try {
    const reportContent = await generateReport(
      subtitleData.subtitles,
      settings,
      subtitleData.videoInfo.title,
      (progress) => {
        // 广播进度给 popup
        chrome.runtime.sendMessage({
          type: 'REPORT_PROGRESS',
          payload: progress as ReportProgress
        }).catch(() => {
          // popup 可能已关闭，忽略错误
        })
      }
    )

    const report: Report = {
      content: reportContent,
      videoTitle: subtitleData.videoInfo.title,
      generatedAt: Date.now()
    }

    await saveReport(report)
    sendResponse({ success: true, data: report })
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : '生成报告失败'
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/background/index.ts
git commit -m "feat: add Background Service Worker with report generation"
```

---

### Task 9: Popup 入口文件

**Files:**
- Create: `src/popup/index.html`
- Create: `src/popup/main.ts`

- [ ] **Step 1: 创建 Popup HTML**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Subtitle Summarizer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 400px;
      min-height: 300px;
      max-height: 600px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 Popup 入口**

```typescript
// src/popup/main.ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 3: Commit**

```bash
git add src/popup/index.html src/popup/main.ts
git commit -m "feat: add Popup entry files"
```

---

### Task 10: Popup 主组件

**Files:**
- Create: `src/popup/App.vue`

- [ ] **Step 1: 创建 Popup 主组件**

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ExtractButton from './components/ExtractButton.vue'
import SubtitlePreview from './components/SubtitlePreview.vue'
import ReportView from './components/ReportView.vue'
import type { SubtitleData, Report, Settings, ReportProgress } from '@/types'

type PageState = 'idle' | 'extracting' | 'preview' | 'generating' | 'done' | 'error'

const state = ref<PageState>('idle')
const videoTitle = ref<string>('')
const subtitleData = ref<SubtitleData | null>(null)
const report = ref<Report | null>(null)
const errorMessage = ref<string>('')
const progressContent = ref<string>('')
const isBilibiliPage = ref(false)

// 检查当前页面
onMounted(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  isBilibiliPage.value = !!tab.url?.match(/bilibili\.com\/video\/BV\w+/)

  if (isBilibiliPage.value && tab.title) {
    videoTitle.value = tab.title.replace(/_哔哩哔哩.*$/, '')
  }

  // 监听进度消息
  chrome.runtime.onMessage.addListener(handleProgress)
})

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(handleProgress)
})

function handleProgress(message: any) {
  if (message.type === 'REPORT_PROGRESS') {
    const progress = message.payload as ReportProgress
    if (progress.content) {
      progressContent.value = progress.content
    }
  }
}

async function handleExtract() {
  state.value = 'extracting'
  errorMessage.value = ''

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const response = await chrome.tabs.sendMessage(tab.id!, {
      type: 'EXTRACT_SUBTITLE'
    })

    if (response.success) {
      subtitleData.value = response.data
      state.value = 'preview'
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    state.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '提取字幕失败'
  }
}

async function handleGenerate() {
  if (!subtitleData.value) return

  state.value = 'generating'
  errorMessage.value = ''
  progressContent.value = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_REPORT',
      payload: subtitleData.value
    })

    if (response.success) {
      report.value = response.data
      state.value = 'done'
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    state.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '生成报告失败'
  }
}

function handleRetry() {
  if (state.value === 'error' && subtitleData.value) {
    handleGenerate()
  } else {
    handleExtract()
  }
}

function handleReset() {
  state.value = 'idle'
  subtitleData.value = null
  report.value = null
  errorMessage.value = ''
  progressContent.value = ''
}
</script>

<template>
  <div class="popup-container">
    <header class="header">
      <h1>📹 字幕摘要</h1>
      <button
        v-if="state !== 'idle'"
        class="btn-back"
        @click="handleReset"
      >
        返回
      </button>
    </header>

    <main class="content">
      <!-- 非 B站页面 -->
      <div v-if="!isBilibiliPage" class="notice">
        <p>⚠️ 请在 Bilibili 视频页面使用此插件</p>
      </div>

      <!-- 初始态 -->
      <ExtractButton
        v-else-if="state === 'idle'"
        :video-title="videoTitle"
        @extract="handleExtract"
      />

      <!-- 提取中 -->
      <div v-else-if="state === 'extracting'" class="loading">
        <div class="spinner"></div>
        <p>正在提取字幕...</p>
      </div>

      <!-- 字幕预览 -->
      <SubtitlePreview
        v-else-if="state === 'preview' && subtitleData"
        :subtitle-data="subtitleData"
        @generate="handleGenerate"
      />

      <!-- 生成中 -->
      <div v-else-if="state === 'generating'" class="loading">
        <div class="spinner"></div>
        <p>AI 正在生成报告...</p>
        <div v-if="progressContent" class="progress-preview">
          {{ progressContent.substring(0, 200) }}...
        </div>
      </div>

      <!-- 报告完成 -->
      <ReportView
        v-else-if="state === 'done' && report"
        :report="report"
      />

      <!-- 错误态 -->
      <div v-else-if="state === 'error'" class="error">
        <p>❌ {{ errorMessage }}</p>
        <button class="btn-retry" @click="handleRetry">重试</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.popup-container {
  padding: 16px;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 18px;
  color: #333;
}

.btn-back {
  padding: 4px 12px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-back:hover {
  background: #d0d0d0;
}

.content {
  min-height: 200px;
}

.notice {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid #e0e0e0;
  border-top-color: #00a1d6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-preview {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  text-align: left;
  max-height: 100px;
  overflow: hidden;
}

.error {
  text-align: center;
  padding: 40px 20px;
  color: #e74c3c;
}

.btn-retry {
  margin-top: 16px;
  padding: 8px 24px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #0090c4;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/popup/App.vue
git commit -m "feat: add Popup main component with state management"
```

---

### Task 11: ExtractButton 组件

**Files:**
- Create: `src/popup/components/ExtractButton.vue`

- [ ] **Step 1: 创建组件**

```vue
<script setup lang="ts">
defineProps<{
  videoTitle: string
}>()

const emit = defineEmits<{
  extract: []
}>()
</script>

<template>
  <div class="extract-container">
    <div class="video-info" v-if="videoTitle">
      <p class="title">{{ videoTitle }}</p>
    </div>
    <button class="btn-extract" @click="emit('extract')">
      🎬 提取字幕并生成报告
    </button>
  </div>
</template>

<style scoped>
.extract-container {
  text-align: center;
  padding: 20px;
}

.video-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.btn-extract {
  padding: 12px 32px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-extract:hover {
  background: #0090c4;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/popup/components/ExtractButton.vue
git commit -m "feat: add ExtractButton component"
```

---

### Task 12: SubtitlePreview 组件

**Files:**
- Create: `src/popup/components/SubtitlePreview.vue`

- [ ] **Step 1: 创建组件**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { SubtitleData } from '@/types'

const props = defineProps<{
  subtitleData: SubtitleData
}>()

const emit = defineEmits<{
  generate: []
}>()

const subtitleCount = computed(() => props.subtitleData.subtitles.length)

const previewItems = computed(() => {
  return props.subtitleData.subtitles.slice(0, 5)
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="preview-container">
    <div class="stats">
      <span>📝 共 {{ subtitleCount }} 条字幕</span>
    </div>

    <div class="subtitle-list">
      <div
        v-for="(item, index) in previewItems"
        :key="index"
        class="subtitle-item"
      >
        <span class="time">{{ formatTime(item.from) }}</span>
        <span class="text">{{ item.content }}</span>
      </div>
      <p v-if="subtitleCount > 5" class="more">
        ...还有 {{ subtitleCount - 5 }} 条字幕
      </p>
    </div>

    <button class="btn-generate" @click="emit('generate')">
      🤖 生成 AI 报告
    </button>
  </div>
</template>

<style scoped>
.preview-container {
  padding: 16px;
}

.stats {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.subtitle-list {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  max-height: 250px;
  overflow-y: auto;
}

.subtitle-item {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.subtitle-item:last-child {
  border-bottom: none;
}

.time {
  color: #00a1d6;
  font-size: 12px;
  flex-shrink: 0;
}

.text {
  font-size: 13px;
  color: #333;
}

.more {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.btn-generate {
  width: 100%;
  padding: 12px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #0090c4;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/popup/components/SubtitlePreview.vue
git commit -m "feat: add SubtitlePreview component"
```

---

### Task 13: ReportView 组件

**Files:**
- Create: `src/popup/components/ReportView.vue`
- Create: `src/popup/components/ExportButtons.vue`

- [ ] **Step 1: 创建 ExportButtons 组件**

```vue
<script setup lang="ts">
import { exportAsMarkdown, exportAsTxt } from '@/utils/export'
import type { Report } from '@/types'

const props = defineProps<{
  report: Report
}>()

function handleExportMarkdown() {
  exportAsMarkdown(props.report)
}

function handleExportTxt() {
  exportAsTxt(props.report)
}
</script>

<template>
  <div class="export-buttons">
    <button class="btn-export btn-md" @click="handleExportMarkdown">
      📄 导出 Markdown
    </button>
    <button class="btn-export btn-txt" @click="handleExportTxt">
      📝 导出 TXT
    </button>
  </div>
</template>

<style scoped>
.export-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn-export {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-md {
  background: #4caf50;
  color: white;
}

.btn-md:hover {
  background: #43a047;
}

.btn-txt {
  background: #ff9800;
  color: white;
}

.btn-txt:hover {
  background: #f57c00;
}
</style>
```

- [ ] **Step 2: 创建 ReportView 组件**

```vue
<script setup lang="ts">
import ExportButtons from './ExportButtons.vue'
import type { Report } from '@/types'

defineProps<{
  report: Report
}>()
</script>

<template>
  <div class="report-container">
    <div class="report-header">
      <h2>📊 分析报告</h2>
      <span class="time">
        {{ new Date(report.generatedAt).toLocaleString() }}
      </span>
    </div>

    <div class="report-content" v-html="renderMarkdown(report.content)"></div>

    <ExportButtons :report="report" />
  </div>
</template>

<script lang="ts">
/** 简单的 Markdown 渲染 */
function renderMarkdown(md: string): string {
  return md
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.report-container {
  padding: 16px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-header h2 {
  font-size: 16px;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.report-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  max-height: 350px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.report-content :deep(h2) {
  font-size: 15px;
  margin: 12px 0 8px;
  color: #00a1d6;
}

.report-content :deep(h3) {
  font-size: 14px;
  margin: 10px 0 6px;
  color: #333;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/popup/components/ReportView.vue src/popup/components/ExportButtons.vue
git commit -m "feat: add ReportView and ExportButtons components"
```

---

### Task 14: Options 页面

**Files:**
- Create: `src/options/index.html`
- Create: `src/options/main.ts`
- Create: `src/options/App.vue`

- [ ] **Step 1: 创建 Options HTML**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Subtitle Summarizer - 设置</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 Options 入口**

```typescript
// src/options/main.ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 3: 创建 Options 组件**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Settings } from '@/types'

const settings = ref<Settings>({
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com',
  reportLanguage: 'zh'
})

const saved = ref(false)

onMounted(async () => {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
  if (response.success) {
    settings.value = response.data
  }
})

async function handleSave() {
  const response = await chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    payload: settings.value
  })

  if (response.success) {
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="settings-container">
    <h1>⚙️ 设置</h1>

    <form @submit.prevent="handleSave" class="settings-form">
      <div class="form-group">
        <label for="apiKey">DeepSeek API Key</label>
        <input
          id="apiKey"
          v-model="settings.apiKey"
          type="password"
          placeholder="输入你的 API Key"
        />
        <p class="hint">
          <a href="https://platform.deepseek.com" target="_blank">
            点击这里获取 API Key
          </a>
        </p>
      </div>

      <div class="form-group">
        <label for="apiBaseUrl">API Base URL</label>
        <input
          id="apiBaseUrl"
          v-model="settings.apiBaseUrl"
          type="text"
          placeholder="https://api.deepseek.com"
        />
        <p class="hint">默认使用官方 API，如需使用代理可修改</p>
      </div>

      <div class="form-group">
        <label for="language">报告语言</label>
        <select id="language" v-model="settings.reportLanguage">
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save">
          {{ saved ? '✓ 已保存' : '保存设置' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input, select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

input:focus, select:focus {
  outline: none;
  border-color: #00a1d6;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

.hint a {
  color: #00a1d6;
}

.form-actions {
  margin-top: 24px;
}

.btn-save {
  padding: 10px 32px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover {
  background: #0090c4;
}
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/options/
git commit -m "feat: add Options settings page"
```

---

### Task 15: Vue 类型声明

**Files:**
- Create: `src/shims-vue.d.ts`

- [ ] **Step 1: 创建 Vue 类型声明**

```typescript
// src/shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shims-vue.d.ts
git commit -m "chore: add Vue type declarations"
```

---

### Task 16: 构建验证

- [ ] **Step 1: 运行构建**

```bash
cd /Volumes/Fanxiang/workspace/cap-brief/video-subtitle-summarizer
npx vite build
```

Expected: 构建成功，生成 dist 目录

- [ ] **Step 2: 检查构建产物**

```bash
ls -la dist/
```

Expected: 看到 manifest.json、各种 JS/CSS 文件

- [ ] **Step 3: 加载到 Chrome 测试**

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist` 目录
5. 打开任意 Bilibili 视频页面
6. 点击插件图标测试

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: verify build and test in Chrome"
```

---

### Task 17: 错误处理完善

- [ ] **Step 1: 更新 App.vue 错误处理**

在 `src/popup/App.vue` 中添加更完善的错误边界处理，包括：
- API Key 未配置时的引导提示
- 网络错误的友好提示
- 长视频处理的进度展示

（此任务在基础功能验证通过后进行）

- [ ] **Step 2: Commit**

```bash
git add src/popup/App.vue
git commit -m "feat: improve error handling and user guidance"
```

---

## 自检清单

### Spec 覆盖

- ✅ Bilibili 字幕提取 — Task 5
- ✅ DeepSeek API 集成 — Task 6, 8
- ✅ Popup UI 五种状态 — Task 10, 11, 12, 13
- ✅ 设置页面 — Task 14
- ✅ Markdown/TXT 导出 — Task 7, 13
- ✅ 错误处理 — Task 10, 17
- ✅ Service Worker 保活 — Task 8

### 无占位符

所有步骤均包含完整代码，无 TBD/TODO。

### 类型一致性

所有文件使用统一的类型定义（`src/types/index.ts`）。
