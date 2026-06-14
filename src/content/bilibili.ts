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
