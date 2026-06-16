<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ExtractButton from './components/ExtractButton.vue'
import SubtitlePreview from './components/SubtitlePreview.vue'
import ReportView from './components/ReportView.vue'
import type { SubtitleData, Report, Settings, ReportProgress } from '@/types'

type PageState = 'idle' | 'extracting' | 'preview' | 'generating' | 'done' | 'error'

const state = ref<PageState>('idle')
const videoTitle = ref<string>('')
const subtitleData = ref<SubtitleData | null>(null)
const report = ref<Report | null>(null)
const errorMessage = ref<string>('')
const errorType = ref<'api-key' | 'network' | 'generic'>('generic')
const progressContent = ref<string>('')
const isBilibiliPage = ref(false)
const currentChunk = ref<number>(0)
const totalChunks = ref<number>(0)

// 检查当前页面
onMounted(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  isBilibiliPage.value = !!tab.url?.match(/bilibili\.com\/video\/BV\w+/)

  if (isBilibiliPage.value && tab.title) {
    videoTitle.value = tab.title.replace(/_哔哩哔哩.*$/, '')
  }

  // 监听进度消息
  chrome.runtime.onMessage.addListener(handleProgress)
})

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(handleProgress)
})

function handleProgress(message: any) {
  if (message.type === 'REPORT_PROGRESS') {
    const progress = message.payload as ReportProgress
    if (progress.content) {
      progressContent.value = progress.content
      // 解析分块进度，如 "正在处理第 2/5 部分..."
      const chunkMatch = progress.content.match(/(\d+)\/(\d+)/)
      if (chunkMatch) {
        currentChunk.value = parseInt(chunkMatch[1])
        totalChunks.value = parseInt(chunkMatch[2])
      }
    }
  }
}

async function handleExtract() {
  state.value = 'extracting'
  errorMessage.value = ''

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab.id) {
      throw new Error('无法获取当前标签页')
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_SUBTITLE'
    })

    if (response.success) {
      subtitleData.value = response.data
      state.value = 'preview'
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    state.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '提取字幕失败'
  }
}

function openSettingsPage() {
  chrome.runtime.openOptionsPage()
}

async function handleGenerate() {
  if (!subtitleData.value) return

  state.value = 'generating'
  errorMessage.value = ''
  errorType.value = 'generic'
  progressContent.value = ''
  currentChunk.value = 0
  totalChunks.value = 0

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_REPORT',
      payload: subtitleData.value
    })

    if (response.success) {
      report.value = response.data
      state.value = 'done'
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    state.value = 'error'
    const msg = error instanceof Error ? error.message : '生成报告失败'

    if (msg.includes('API Key') || msg.includes('apiKey')) {
      errorType.value = 'api-key'
      errorMessage.value = '未配置 API Key，请先在设置页面配置 DeepSeek API Key'
    } else if (error instanceof TypeError || msg.includes('Failed to fetch') || msg.includes('network') || msg.includes('网络')) {
      errorType.value = 'network'
      errorMessage.value = '网络连接失败，请检查网络后重试'
    } else {
      errorType.value = 'generic'
      errorMessage.value = msg
    }
  }
}

function handleRetry() {
  if (state.value === 'error' && subtitleData.value) {
    handleGenerate()
  } else {
    handleExtract()
  }
}

function handleReset() {
  state.value = 'idle'
  subtitleData.value = null
  report.value = null
  errorMessage.value = ''
  errorType.value = 'generic'
  progressContent.value = ''
  currentChunk.value = 0
  totalChunks.value = 0
}
</script>

<template>
  <div class="popup-container">
    <header class="header">
      <h1>📹 字幕摘要</h1>
      <button
        v-if="state !== 'idle'"
        class="btn-back"
        @click="handleReset"
      >
        返回
      </button>
    </header>

    <main class="content">
      <!-- 非 B站页面 -->
      <div v-if="!isBilibiliPage" class="notice">
        <p>⚠️ 请在 Bilibili 视频页面使用此插件</p>
      </div>

      <!-- 初始态 -->
      <ExtractButton
        v-else-if="state === 'idle'"
        :video-title="videoTitle"
        @extract="handleExtract"
      />

      <!-- 提取中 -->
      <div v-else-if="state === 'extracting'" class="loading">
        <div class="spinner"></div>
        <p>正在提取字幕...</p>
      </div>

      <!-- 字幕预览 -->
      <SubtitlePreview
        v-else-if="state === 'preview' && subtitleData"
        :subtitle-data="subtitleData"
        @generate="handleGenerate"
      />

      <!-- 生成中 -->
      <div v-else-if="state === 'generating'" class="loading">
        <div class="spinner"></div>
        <p v-if="totalChunks > 0">AI 正在生成报告... ({{ currentChunk }}/{{ totalChunks }})</p>
        <p v-else>AI 正在生成报告...</p>
        <div v-if="totalChunks > 1" class="chunk-progress">
          <div class="chunk-bar">
            <div class="chunk-bar-fill" :style="{ width: (currentChunk / totalChunks * 100) + '%' }"></div>
          </div>
          <span class="chunk-text">正在处理第 {{ currentChunk }}/{{ totalChunks }} 部分</span>
        </div>
        <div v-if="progressContent" class="progress-preview">
          {{ progressContent.substring(0, 200) }}...
        </div>
      </div>

      <!-- 报告完成 -->
      <ReportView
        v-else-if="state === 'done' && report"
        :report="report"
      />

      <!-- 错误态 -->
      <div v-else-if="state === 'error'" class="error">
        <p>❌ {{ errorMessage }}</p>
        <div class="error-actions">
          <button v-if="errorType === 'api-key'" class="btn-settings" @click="openSettingsPage">
            打开设置
          </button>
          <button class="btn-retry" @click="handleRetry">重试</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.popup-container {
  padding: 16px;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 18px;
  color: #333;
}

.btn-back {
  padding: 4px 12px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-back:hover {
  background: #d0d0d0;
}

.content {
  min-height: 200px;
}

.notice {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid #e0e0e0;
  border-top-color: #00a1d6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.chunk-progress {
  margin-top: 12px;
}

.chunk-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.chunk-bar-fill {
  height: 100%;
  background: #00a1d6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.chunk-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.progress-preview {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  text-align: left;
  max-height: 100px;
  overflow: hidden;
}

.error {
  text-align: center;
  padding: 40px 20px;
  color: #e74c3c;
}

.error-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-settings {
  padding: 8px 24px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-settings:hover {
  background: #e55a28;
}

.btn-retry {
  padding: 8px 24px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #0090c4;
}
</style>
