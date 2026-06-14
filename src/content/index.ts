import { extractSubtitles } from './bilibili'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_SUBTITLE') {
    extractSubtitles()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // 保持消息通道开放
  }
})
