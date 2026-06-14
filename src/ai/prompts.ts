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
