// src/background/index.ts
import { generateReport } from '@/ai/client'
import { getSettings, saveReport } from '@/utils/storage'
import type { SubtitleData, Report, ReportProgress } from '@/types'

// 保持 Service Worker 存活
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // 空操作，仅保活
  }
})

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
