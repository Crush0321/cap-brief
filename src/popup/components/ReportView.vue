<script setup lang="ts">
import ExportButtons from './ExportButtons.vue'
import type { Report } from '@/types'

defineProps<{
  report: Report
}>()
</script>

<template>
  <div class="report-container">
    <div class="report-header">
      <h2>📊 分析报告</h2>
      <span class="time">
        {{ new Date(report.generatedAt).toLocaleString() }}
      </span>
    </div>

    <div class="report-content" v-html="renderMarkdown(report.content)"></div>

    <ExportButtons :report="report" />
  </div>
</template>

<script lang="ts">
/** 简单的 Markdown 渲染 */
function renderMarkdown(md: string): string {
  return md
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.report-container {
  padding: 16px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-header h2 {
  font-size: 16px;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.report-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  max-height: 350px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.report-content :deep(h2) {
  font-size: 15px;
  margin: 12px 0 8px;
  color: #00a1d6;
}

.report-content :deep(h3) {
  font-size: 14px;
  margin: 10px 0 6px;
  color: #333;
}
</style>
