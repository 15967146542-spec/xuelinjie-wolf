<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { moonwalkEventName } from '@/utils/mjEasterEgg'
import videoSource from '@/assets/mj-spiderman-hanging.mp4'

const visible = ref(false)
const playId = ref(0)

function play() {
  visible.value = false
  window.requestAnimationFrame(() => {
    playId.value += 1
    visible.value = true
  })
}

onMounted(() => window.addEventListener(moonwalkEventName, play))
onUnmounted(() => window.removeEventListener(moonwalkEventName, play))
</script>

<template>
  <div v-if="visible" :key="playId" class="moonwalk-easter-egg" aria-hidden="true">
    <video class="moonwalk-video" :src="videoSource" autoplay muted playsinline @ended="visible = false" />
  </div>
</template>

<style scoped>
.moonwalk-easter-egg{position:fixed;z-index:3000;top:0;left:50%;width:min(250px,52vw);pointer-events:none;transform:translateX(-50%)}.moonwalk-video{display:block;width:100%;height:auto}@media (prefers-reduced-motion:reduce){.moonwalk-easter-egg{display:none}}
</style>
