# 📹 Video Subtitle Summarizer

一款 Chrome 浏览器插件，用于提取 Bilibili 视频字幕并通过 DeepSeek AI 生成结构化报告。

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-MV3-blue)
![Vue 3](https://img.shields.io/badge/Vue-3-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)

## ✨ 功能特性

- 🎬 **字幕提取** — 自动提取 Bilibili 视频的 CC 字幕
- 🤖 **AI 汇总** — 使用 DeepSeek AI 生成结构化报告
- 📊 **报告展示** — 实时流式显示报告生成过程
- 📥 **多格式导出** — 支持 Markdown 和 TXT 格式下载
- ⚙️ **灵活配置** — 支持自定义 API Key、API 地址、报告语言
- 🔄 **长视频支持** — 自动分块处理长视频字幕

## 📸 截图

<details>
<summary>点击展开截图</summary>

### 插件弹窗
- 初始状态：显示视频标题和提取按钮
- 字幕预览：展示提取的字幕片段
- 报告生成：实时显示 AI 生成进度
- 报告完成：展示完整报告和导出按钮

### 设置页面
- API Key 配置
- API Base URL 设置
- 报告语言选择（中文/英文）

</details>

## 🚀 快速开始

### 安装

1. 克隆项目
```bash
git clone https://github.com/Crush0321/cap-brief.git
cd cap-brief/video-subtitle-summarizer
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 加载到 Chrome
   - 打开 `chrome://extensions/`
   - 开启右上角「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目中的 `dist` 目录

### 配置

1. 右键点击插件图标 → 选项
2. 输入你的 [DeepSeek API Key](https://platform.deepseek.com)
3. （可选）修改 API Base URL 和报告语言

### 使用

1. 打开任意 [Bilibili 视频页面](https://www.bilibili.com)
2. 点击浏览器工具栏中的插件图标
3. 点击「提取字幕并生成报告」
4. 等待 AI 生成报告
5. 点击「导出 Markdown」或「导出 TXT」下载报告

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **Vue 3** | Popup 和 Options 页面 UI 框架 |
| **TypeScript** | 类型安全的开发语言 |
| **Vite** | 构建工具 |
| **CRXJS** | Chrome Extension Vite 插件 |
| **DeepSeek API** | AI 文本分析和报告生成 |
| **Chrome MV3** | Manifest V3 扩展规范 |

## 📁 项目结构

```
video-subtitle-summarizer/
├── src/
│   ├── manifest.json           # MV3 扩展配置
│   ├── background/
│   │   └── index.ts            # Service Worker（消息路由、AI 调用）
│   ├── content/
│   │   ├── index.ts            # Content Script 入口
│   │   └── bilibili.ts         # B站字幕提取逻辑
│   ├── popup/
│   │   ├── App.vue             # 主界面（状态管理）
│   │   ├── main.ts             # 入口文件
│   │   ├── index.html          # HTML 模板
│   │   └── components/
│   │       ├── ExtractButton.vue    # 字幕提取按钮
│   │       ├── SubtitlePreview.vue  # 字幕预览
│   │       ├── ReportView.vue       # 报告展示
│   │       └── ExportButtons.vue    # 导出按钮
│   ├── options/
│   │   ├── App.vue             # 设置页面
│   │   ├── main.ts             # 入口文件
│   │   └── index.html          # HTML 模板
│   ├── ai/
│   │   ├── client.ts           # DeepSeek API 客户端
│   │   └── prompts.ts          # Prompt 模板
│   ├── utils/
│   │   ├── export.ts           # 导出工具（MD/TXT）
│   │   └── storage.ts          # Chrome 存储封装
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   └── shims-vue.d.ts          # Vue 类型声明
├── public/
│   └── icons/                  # 插件图标
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 项目配置
```

## 🔧 开发

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 代码检查

```bash
npx tsc --noEmit
```

## 📐 架构设计

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Popup UI  │◄──►│  Background      │◄──►│  Content    │
│  (Vue 3)    │    │  Service Worker  │    │  Script     │
│             │    │                  │    │             │
│ • 展示报告  │    │ • AI API 调用    │    │ • 字幕提取  │
│ • 导出下载  │    │ • 数据存储       │    │ • 页面交互  │
│ • 设置配置  │    │ • 消息路由       │    │ • 状态监听  │
└─────────────┘    └──────────────────┘    └─────────────┘
```

### 数据流

1. 用户在 B站视频页点击插件图标
2. Popup 向 Content Script 发送「提取字幕」请求
3. Content Script 调用 B站 API 获取字幕数据
4. Popup 将字幕发送给 Background Worker
5. Background Worker 调用 DeepSeek API 生成报告
6. 报告返回 Popup 展示，用户可导出

## ❓ 常见问题

### Q: 为什么有些视频没有字幕？
A: 该插件仅支持提取 B站已有的 CC 字幕。如果视频没有上传字幕，插件会提示「该视频没有字幕」。

### Q: 支持哪些浏览器？
A: 目前仅支持 Chrome 浏览器（及基于 Chromium 的浏览器，如 Edge、Brave 等）。

### Q: API Key 安全吗？
A: API Key 存储在浏览器本地（chrome.storage.sync），不会上传到任何服务器。所有 API 调用直接从浏览器发送到 DeepSeek。

### Q: 支持多长的视频？
A: 理论上没有限制。对于长视频，插件会自动将字幕分块处理，然后合并生成报告。

## 📄 许可证

MIT License

## 🙏 致谢

- [Vue.js](https://vuejs.org/) — 渐进式 JavaScript 框架
- [CRXJS](https://crxjs.dev/vite-plugin) — Chrome Extension Vite 插件
- [DeepSeek](https://deepseek.com/) — AI API 服务
- [Bilibili](https://www.bilibili.com/) — 视频平台
