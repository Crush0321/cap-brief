<script setup lang="ts">
import { computed } from 'vue'
import type { SubtitleData } from '@/types'

const props = defineProps<{
  subtitleData: SubtitleData
}>()

const emit = defineEmits<{
  generate: []
}>()

const subtitleCount = computed(() => props.subtitleData.subtitles.length)

const previewItems = computed(() => {
  return props.subtitleData.subtitles.slice(0, 5)
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="preview-container">
    <div class="stats">
      <span>📝 共 {{ subtitleCount }} 条字幕</span>
    </div>

    <div class="subtitle-list">
      <div
        v-for="(item, index) in previewItems"
        :key="index"
        class="subtitle-item"
      >
        <span class="time">{{ formatTime(item.from) }}</span>
        <span class="text">{{ item.content }}</span>
      </div>
      <p v-if="subtitleCount > 5" class="more">
        ...还有 {{ subtitleCount - 5 }} 条字幕
      </p>
    </div>

    <button class="btn-generate" @click="emit('generate')">
      🤖 生成 AI 报告
    </button>
  </div>
</template>

<style scoped>
.preview-container {
  padding: 16px;
}

.stats {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.subtitle-list {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  max-height: 250px;
  overflow-y: auto;
}

.subtitle-item {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.subtitle-item:last-child {
  border-bottom: none;
}

.time {
  color: #00a1d6;
  font-size: 12px;
  flex-shrink: 0;
}

.text {
  font-size: 13px;
  color: #333;
}

.more {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.btn-generate {
  width: 100%;
  padding: 12px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #0090c4;
}
</style>
