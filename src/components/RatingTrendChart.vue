<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { init, graphic, use } from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  EVALUATION_MIN_RATING,
  EVALUATION_MAX_RATING,
  NEUTRAL_RATING,
  RATING_WINDOW
} from '@/rules'

// 按需注册：只引入折线图所需的图表/组件/渲染器，避免把整个 echarts 打进本组件
use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  ratings: number[]
  last5Avg: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: ReturnType<typeof init> | null = null
let resizeObserver: ResizeObserver | null = null

const isEmpty = computed(() => !props.ratings || props.ratings.length === 0)

/**
 * 按实际数据长度生成讲次标签（上限 RATING_WINDOW），
 * 聚合窗口调整后图表自动跟随，不再写死“前第5讲…最近一讲”。
 */
function buildLabels(count: number): string[] {
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    labels.push(i === count - 1 ? '最近一讲' : `前第${count - i}讲`)
  }
  return labels
}

function initChart() {
  if (!chartRef.value || chartInstance) return
  chartInstance = init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || isEmpty.value) return

  const windowData = props.ratings.slice(-RATING_WINDOW)
  const xLabels = buildLabels(windowData.length)

  const option: EChartsCoreOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      textStyle: { color: '#f8fafc', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0]
        const diff = (item.value - NEUTRAL_RATING).toFixed(2)
        return `
          <div style="font-weight:600;">${item.name}</div>
          <div>平均星级: <strong>${item.value} ★</strong></div>
          <div>相较中性基准 (${NEUTRAL_RATING}): <span style="color:${Number(diff) >= 0 ? '#f87171' : '#34d399'}">${Number(diff) >= 0 ? '+' : ''}${diff}</span></div>
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
      min: EVALUATION_MIN_RATING,
      max: EVALUATION_MAX_RATING,
      interval: 1.0,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}★' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)' } }
    },
    series: [
      {
        name: '评分趋势',
        type: 'line',
        data: windowData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        itemStyle: { color: '#fbbf24' },
        lineStyle: { width: 2.5, color: '#fbbf24' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 191, 36, 0.35)' },
            { offset: 1, color: 'rgba(251, 191, 36, 0.02)' }
          ])
        },
        markLine: {
          symbol: ['none', 'none'],
          data: [
            {
              yAxis: NEUTRAL_RATING,
              name: `中性基准 ${NEUTRAL_RATING}★`,
              lineStyle: { color: '#94a3b8', type: 'dashed', width: 1.5 },
              label: { position: 'end', formatter: `中性线(${NEUTRAL_RATING}★)`, color: '#94a3b8', fontSize: 10 }
            }
          ]
        }
      }
    ]
  }

  chartInstance.setOption(option, true)
}

// 数据由“替换新数组”驱动（evaluation store 聚合后整体赋值），浅比较即可，
// 相比原 deep watch 减少无效重绘；同时兼容空态 → 首次有数据时补初始化。
watch(
  () => props.ratings,
  () => {
    if (isEmpty.value) {
      chartInstance?.clear()
      return
    }
    nextTick(() => {
      if (!chartInstance) initChart()
      else updateChart()
    })
  }
)

onMounted(() => {
  if (!isEmpty.value) {
    nextTick(initChart)
  }
  if (chartRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => chartInstance?.resize())
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="trend-container">
    <div v-if="isEmpty" class="trend-empty">
      暂无评教数据，提交首条评教后将在此展示近 {{ RATING_WINDOW }} 讲趋势
    </div>
    <div v-else ref="chartRef" class="trend-chart-box"></div>
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
.trend-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #64748b;
  border: 1px dashed rgba(148, 163, 184, 0.25);
  border-radius: 12px;
}
</style>
