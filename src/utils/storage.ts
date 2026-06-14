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
  const stored = result.settings as Partial<Settings> | undefined
  return { ...DEFAULT_SETTINGS, ...stored }
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
  const result = await chrome.storage.local.get('reports')
  const reports: Report[] = (result.reports as Report[] | undefined) ?? []
  reports.unshift(report)
  // 只保留最近 50 条
  await chrome.storage.local.set({ reports: reports.slice(0, 50) })
}

/** 获取报告历史 */
export async function getReports(): Promise<Report[]> {
  const result = await chrome.storage.local.get('reports')
  return (result.reports as Report[] | undefined) ?? []
}
