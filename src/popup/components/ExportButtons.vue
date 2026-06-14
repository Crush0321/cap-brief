<script setup lang="ts">
import { exportAsMarkdown, exportAsTxt } from '@/utils/export'
import type { Report } from '@/types'

const props = defineProps<{
  report: Report
}>()

function handleExportMarkdown() {
  exportAsMarkdown(props.report)
}

function handleExportTxt() {
  exportAsTxt(props.report)
}
</script>

<template>
  <div class="export-buttons">
    <button class="btn-export btn-md" @click="handleExportMarkdown">
      📄 导出 Markdown
    </button>
    <button class="btn-export btn-txt" @click="handleExportTxt">
      📝 导出 TXT
    </button>
  </div>
</template>

<style scoped>
.export-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn-export {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-md {
  background: #4caf50;
  color: white;
}

.btn-md:hover {
  background: #43a047;
}

.btn-txt {
  background: #ff9800;
  color: white;
}

.btn-txt:hover {
  background: #f57c00;
}
</style>
