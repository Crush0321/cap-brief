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
const progressContent = ref<string>('')
const isBilibiliPage = ref(false)

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
    }
  }
}

async function handleExtract() {
  state.value = 'extracting'
  errorMessage.value = ''

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const response = await chrome.tabs.sendMessage(tab.id!, {
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

async function handleGenerate() {
  if (!subtitleData.value) return

  state.value = 'generating'
  errorMessage.value = ''
  progressContent.value = ''

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
    errorMessage.value = error instanceof Error ? error.message : '生成报告失败'
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
  progressContent.value = ''
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
        <p>AI 正在生成报告...</p>
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
        <button class="btn-retry" @click="handleRetry">重试</button>
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

.btn-retry {
  margin-top: 16px;
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
