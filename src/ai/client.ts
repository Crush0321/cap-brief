// src/ai/client.ts
import type { Settings, SubtitleItem } from '@/types'
import {
  getSummaryPrompt,
  getChunkSummaryPrompt,
  getMergePrompt
} from './prompts'

const MAX_TOKENS_PER_CHUNK = 4000
const DEEPSEEK_MODEL = 'deepseek-chat'

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
      model: DEEPSEEK_MODEL,
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
        } catch (e) {
          console.debug('SSE parse error:', data, e)
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
      `视频标题: ${videoTitle}\n\n` +
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
      `视频标题: ${videoTitle}\n\n` +
      getChunkSummaryPrompt(i, chunks.length, settings.reportLanguage) +
      '\n\n' +
      formatSubtitles(chunks[i])

    const summary = await callDeepSeek(settings, prompt)
    chunkSummaries.push(summary)
  }

  // 合并摘要
  onProgress?.({ stage: 'generating', content: '正在合并生成最终报告...' })
  const mergePrompt =
    `视频标题: ${videoTitle}\n\n` +
    getMergePrompt(settings.reportLanguage) +
    '\n\n' +
    chunkSummaries
      .map((s, i) => `### 第 ${i + 1} 部分\n${s}`)
      .join('\n\n')

  return callDeepSeek(settings, mergePrompt, (text) =>
    onProgress?.({ stage: 'generating', content: text })
  )
}
