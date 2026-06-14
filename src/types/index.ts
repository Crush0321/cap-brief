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
