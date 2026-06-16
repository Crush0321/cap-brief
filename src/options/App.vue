<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Settings } from '@/types'

const settings = ref<Settings>({
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com',
  reportLanguage: 'zh'
})

const saved = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    if (response.success) {
      settings.value = response.data
    } else {
      error.value = response.error || '获取设置失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取设置失败'
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      payload: settings.value
    })

    if (response.success) {
      saved.value = true
      setTimeout(() => {
        saved.value = false
      }, 2000)
    } else {
      error.value = response.error || '保存设置失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存设置失败'
  }
}
</script>

<template>
  <div class="settings-container">
    <h1>⚙️ 设置</h1>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载设置中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button class="btn-retry" @click="location.reload()">重试</button>
    </div>

    <!-- 设置表单 -->
    <form v-else @submit.prevent="handleSave" class="settings-form">
      <div class="form-group">
        <label for="apiKey">DeepSeek API Key</label>
        <input
          id="apiKey"
          v-model="settings.apiKey"
          type="password"
          placeholder="输入你的 API Key"
        />
        <p class="hint">
          <a href="https://platform.deepseek.com" target="_blank">
            点击这里获取 API Key
          </a>
        </p>
      </div>

      <div class="form-group">
        <label for="apiBaseUrl">API Base URL</label>
        <input
          id="apiBaseUrl"
          v-model="settings.apiBaseUrl"
          type="text"
          placeholder="https://api.deepseek.com"
        />
        <p class="hint">默认使用官方 API，如需使用代理可修改</p>
      </div>

      <div class="form-group">
        <label for="language">报告语言</label>
        <select id="language" v-model="settings.reportLanguage">
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save">
          {{ saved ? '✓ 已保存' : '保存设置' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 24px;
  color: #333;
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

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input, select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

input:focus, select:focus {
  outline: none;
  border-color: #00a1d6;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

.hint a {
  color: #00a1d6;
}

.form-actions {
  margin-top: 24px;
}

.btn-save {
  padding: 10px 32px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover {
  background: #0090c4;
}
</style>
