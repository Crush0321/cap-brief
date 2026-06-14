# Video Subtitle Summarizer — 浏览器插件设计文档

## 概述

一款 Chrome 浏览器插件，用于提取 Bilibili 视频字幕并通过 DeepSeek AI 生成结构化报告，支持 Markdown 和 TXT 格式导出。

## 目标用户

Bilibili 用户，需要快速了解视频内容而无需完整观看。

## 技术选型

| 维度 | 选择 | 理由 |
|------|------|------|
| Manifest 版本 | MV3 | Chrome 强制要求，未来趋势 |
| 开发语言 | TypeScript | 类型安全 |
| 构建工具 | Vite + CRXJS | MV3 支持最好，HMR 热更新 |
| UI 框架 | Vue 3 | 国内开发者熟悉度高 |
| AI 服务 | DeepSeek | 国内可用，价格便宜，中文效果好 |
| API Key 管理 | 用户自备 | 无需承担 API 费用 |

## 架构设计

### 整体架构

采用标准三层架构：

- **Popup UI (Vue 3)**：展示报告、导出下载、设置配置
- **Background Service Worker**：AI API 调用、数据存储、消息路由
- **Content Script**：字幕提取、页面交互、状态监听

### 数据流

1. 用户在 B站视频页点击插件图标
2. Popup 向 Content Script 发送「提取字幕」请求
3. Content Script 调用 B站 API 获取字幕数据，返回给 Popup
4. Popup 将字幕发送给 Background Worker
5. Background Worker 调用 DeepSeek API 生成报告
6. 报告返回 Popup 展示，用户可导出 Markdown/TXT

## 字幕提取方案

### Bilibili 字幕提取流程

1. 从当前页面 URL 解析 bvid
2. 调用 `api.bilibili.com/x/web-interface/view` 获取 cid
3. 调用 `api.bilibili.com/x/player/v2` 获取字幕 URL 列表
4. 下载字幕 JSON（含时间戳和文本）
5. 清洗合并字幕，去除重复和空行

### 注意事项

- B站字幕 API 需要登录态（Cookie）
- Content Script 可直接调用（同源）
- 如果视频没有字幕，Popup 提示用户「该视频无字幕」
- 视频页检测：URL 匹配 `bilibili.com/video/BV*` 模式

## AI 汇总方案

### DeepSeek 汇总流程

1. 字幕文本拼接后检查 token 长度
2. 短视频（<4000 token）：一次性发送给 DeepSeek
3. 长视频（>4000 token）：按时间分块，每块独立汇总，最后合并
4. 使用结构化 Prompt 生成报告（概要、核心观点、详细内容、结论）
5. 支持流式输出，用户可实时看到报告生成过程

### Prompt 模板

预设 Prompt 模板，MVP 阶段不支持用户自定义。

## UI 设计

### Popup 界面（400x600px）

页面状态：

1. **初始态**：显示「提取字幕」按钮 + 视频标题
2. **提取中**：Loading 动画 + 进度提示
3. **字幕预览**：显示字幕片段，可选择「生成报告」
4. **生成中**：流式显示报告内容
5. **报告完成**：完整报告 + 导出按钮（MD/TXT）

### 设置页面（独立 tab）

- DeepSeek API Key 输入框
- API Base URL（可选，默认官方）
- 报告语言（中文/英文）— 指 AI 生成报告的语言，通过 Prompt 控制

## 导出功能

支持两种格式：

- **Markdown**：通用格式，方便二次编辑
- **TXT**：纯文本，最简单

## 错误处理

需要处理的边界情况：

1. **非 B站页面**：Popup 显示「请在 B站视频页使用」
2. **视频无字幕**：提示「该视频没有字幕，无法生成报告」
3. **API Key 未配置**：引导用户去设置页面填写
4. **API 调用失败**：显示错误信息 + 重试按钮
5. **网络异常**：显示网络错误提示
6. **长视频处理**：显示进度条（已处理 X/Y 块）
7. **Service Worker 被杀**：使用 chrome.alarms 保活

## 项目结构

```
video-subtitle-summarizer/
├── src/
│   ├── manifest.json           # MV3 配置
│   ├── background/
│   │   └── index.ts            # Service Worker
│   ├── content/
│   │   ├── index.ts            # Content Script 入口
│   │   └── bilibili.ts         # B站字幕提取
│   ├── popup/
│   │   ├── App.vue             # 主界面
│   │   └── components/         # Vue 组件
│   ├── options/
│   │   └── App.vue             # 设置页面
│   ├── ai/
│   │   ├── client.ts           # DeepSeek API 封装
│   │   └── prompts.ts          # Prompt 模板
│   ├── utils/
│   │   ├── export.ts           # 导出工具
│   │   └── storage.ts          # 存储封装
│   └── types/
│       └── index.ts            # 类型定义
├── public/icons/               # 插件图标
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 依赖清单

### 运行时依赖

- vue ^3.4
- webext-bridge ^6.0

### 开发依赖

- @crxjs/vite-plugin ^2.0
- typescript ^5.4
- vite ^5.0
- web-ext ^8.0

## 开发路线图

### Phase 1 — MVP（2 周）

- 搭建 Vite + CRXJS + Vue3 脚手架
- 实现 Bilibili 字幕提取
- 接入 DeepSeek API
- 基础 Popup UI（提取 → 汇总 → 下载 Markdown）

### Phase 2 — 完善（1 周）

- 多格式导出（TXT）
- 设置页面（API Key 配置）
- 错误处理完善

### Phase 3 — 发布（1 周）

- Chrome Web Store 发布准备
- 隐私政策撰写
- 图标和商店截图制作
