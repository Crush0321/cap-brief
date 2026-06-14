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
