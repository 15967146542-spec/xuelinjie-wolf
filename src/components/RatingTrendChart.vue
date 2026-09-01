<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  ratings: number[]
  last5Avg: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || !props.ratings) return

  const xLabels = ['前第5讲', '前第4讲', '前第3讲', '前第2讲', '最近一讲']
  const data = props.ratings.slice(-5)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      textStyle: { color: '#f8fafc', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const diff = (item.value - 3.0).toFixed(2)
        return `
          <div style="font-weight:600;">${item.name}</div>
          <div>平均星级: <strong>${item.value} ★</strong></div>
          <div>相较中性基准 (3.0): <span style="color:${Number(diff) >= 0 ? '#f87171' : '#34d399'}">${Number(diff) >= 0 ? '+' : ''}${diff}</span></div>
        `
      }
    },
    grid: {
      left: '6%',
      right: '6%',
      top: '18%',
      bottom: '18%'
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      min: 1.0,
      max: 5.0,
      interval: 1.0,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}★' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)' } }
    },
    series: [
      {
        name: '评分趋势',
        type: 'line',
        data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        itemStyle: { color: '#fbbf24' },
        lineStyle: { width: 2.5, color: '#fbbf24' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 191, 36, 0.35)' },
            { offset: 1, color: 'rgba(251, 191, 36, 0.02)' }
          ])
        },
        markLine: {
          symbol: ['none', 'none'],
          data: [
            {
              yAxis: 3.0,
              name: '中性基准 3.0★',
              lineStyle: { color: '#94a3b8', type: 'dashed', width: 1.5 },
              label: { position: 'end', formatter: '中性线(3.0★)', color: '#94a3b8', fontSize: 10 }
            }
          ]
        }
      }
    ]
  }

  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.ratings,
  () => {
    updateChart()
  },
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div class="trend-container">
    <div ref="chartRef" class="trend-chart-box"></div>
  </div>
</template>

<style scoped>
.trend-container {
  width: 100%;
  height: 180px;
}
.trend-chart-box {
  width: 100%;
  height: 100%;
}
</style>
