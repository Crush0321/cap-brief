<script setup lang="ts">
defineProps<{
  videoTitle: string
}>()

const emit = defineEmits<{
  extract: []
}>()
</script>

<template>
  <div class="extract-container">
    <div class="video-info" v-if="videoTitle">
      <p class="title">{{ videoTitle }}</p>
    </div>
    <button class="btn-extract" @click="emit('extract')">
      🎬 提取字幕并生成报告
    </button>
  </div>
</template>

<style scoped>
.extract-container {
  text-align: center;
  padding: 20px;
}

.video-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.btn-extract {
  padding: 12px 32px;
  background: #00a1d6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-extract:hover {
  background: #0090c4;
}
</style>