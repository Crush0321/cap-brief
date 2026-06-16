<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import ExportButtons from './ExportButtons.vue'
import type { Report } from '@/types'

defineProps<{
  report: Report
}>()

/** 安全的 Markdown 渲染 */
function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(html)
}
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

.report-content :deep(p) {
  margin: 8px 0;
}

.report-content :deep(ul),
.report-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.report-content :deep(li) {
  margin: 4px 0;
}

.report-content :deep(strong) {
  font-weight: 600;
}

.report-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.report-content :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.report-content :deep(pre code) {
  background: none;
  padding: 0;
}
</style>
