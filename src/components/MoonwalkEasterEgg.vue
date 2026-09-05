<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { moonwalkEventName } from '@/utils/mjEasterEgg'
import videoSource from '@/assets/mj-spiderman-hanging.mp4'

const visible = ref(false)
const playId = ref(0)
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
let frameId = 0

function stopRendering() {
  window.cancelAnimationFrame(frameId)
  frameId = 0
}

function endPlayback() {
  stopRendering()
  visible.value = false
}

function renderMaskedFrame() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || video.paused || video.ended) return

  const sourceCanvas = document.createElement('canvas')
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  const outputContext = canvas.getContext('2d')
  const sourceHalfWidth = Math.floor(video.videoWidth / 2)
  if (!sourceContext || !outputContext || sourceHalfWidth === 0 || video.videoHeight === 0) return
  const halfWidth = Math.min(160, sourceHalfWidth)
  const height = Math.round(video.videoHeight * (halfWidth / sourceHalfWidth))

  sourceCanvas.width = halfWidth * 2
  sourceCanvas.height = height
  canvas.width = halfWidth
  canvas.height = height

  const draw = () => {
    if (video.paused || video.ended) return
    sourceContext.drawImage(video, 0, 0, halfWidth * 2, height)
    const source = sourceContext.getImageData(0, 0, halfWidth * 2, height).data
    const output = outputContext.createImageData(halfWidth, height)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < halfWidth; x += 1) {
        const maskIndex = (y * halfWidth * 2 + x) * 4
        const colorIndex = (y * halfWidth * 2 + x + halfWidth) * 4
        const outputIndex = (y * halfWidth + x) * 4
        output.data[outputIndex] = source[colorIndex]
        output.data[outputIndex + 1] = source[colorIndex + 1]
        output.data[outputIndex + 2] = source[colorIndex + 2]
        output.data[outputIndex + 3] = source[maskIndex]
      }
    }
    outputContext.putImageData(output, 0, 0)
    frameId = window.requestAnimationFrame(draw)
  }

  draw()
}

function play() {
  visible.value = false
  stopRendering()
  window.requestAnimationFrame(() => {
    playId.value += 1
    visible.value = true
  })
}

onMounted(() => window.addEventListener(moonwalkEventName, play))
onUnmounted(() => {
  window.removeEventListener(moonwalkEventName, play)
  stopRendering()
})
</script>

<template>
  <div v-if="visible" :key="playId" class="moonwalk-easter-egg" aria-hidden="true">
    <video ref="videoRef" class="moonwalk-source" :src="videoSource" autoplay muted playsinline @playing="renderMaskedFrame" @ended="endPlayback" />
    <canvas ref="canvasRef" class="moonwalk-video" />
  </div>
</template>

<style scoped>
.moonwalk-easter-egg{position:fixed;z-index:3000;top:0;left:50%;pointer-events:none;transform:translateX(-50%)}.moonwalk-source{position:absolute;width:1px;height:1px;opacity:0}.moonwalk-video{display:block;width:min(130px,36vw);height:auto}@media (prefers-reduced-motion:reduce){.moonwalk-easter-egg{display:none}}
</style>
