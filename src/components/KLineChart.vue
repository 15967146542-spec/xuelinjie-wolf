<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { KLinePoint } from '@/types'

const props = defineProps<{
  data: KLinePoint[]
  stockName?: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || !props.data || props.data.length === 0) return

  const dates = props.data.map((p) => p.date)
  // ECharts Candlestick expects: [open, close, low, high]
  const ohlc = props.data.map((p) => [p.open, p.close, p.low, p.high])
  const volumes = props.data.map((p, idx) => {
    const isUp = p.close >= p.open
    return {
      value: p.volume,
      itemStyle: {
        color: isUp ? 'rgba(248, 113, 113, 0.75)' : 'rgba(52, 211, 153, 0.75)'
      }
    }
  })

  const ma5 = props.data.map((p) => p.ma5 || null)
  const ma10 = props.data.map((p) => p.ma10 || null)
  const ma20 = props.data.map((p) => p.ma20 || null)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#94a3b8',
          width: 1,
          type: 'dashed'
        }
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const date = params[0].axisValue
        const item = params.find((p: any) => p.seriesType === 'candlestick')
        if (!item) return ''
        const [open, close, low, high] = item.data
        const diff = (close - open).toFixed(2)
        const diffPct = (((close - open) / open) * 100).toFixed(2)
        const color = close >= open ? '#f87171' : '#34d399'

        return `
          <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(148,163,184,0.2); padding-bottom: 2px;">
            ${date} ${props.stockName ? `· ${props.stockName}` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px;">
            <div>开盘: <span style="font-weight:600;">¥${open}</span></div>
            <div>收盘: <span style="font-weight:600; color:${color}">¥${close}</span></div>
            <div>最高: <span style="font-weight:600; color:#f87171;">¥${high}</span></div>
            <div>最低: <span style="font-weight:600; color:#34d399;">¥${low}</span></div>
            <div>涨跌: <span style="font-weight:600; color:${color}">${Number(diff) >= 0 ? '+' : ''}${diff} (${diffPct}%)</span></div>
          </div>
        `
      }
    },
    legend: {
      data: ['日K', 'MA5', 'MA10', 'MA20'],
      top: 0,
      right: 20,
      textStyle: {
        color: '#94a3b8',
        fontSize: 11
      }
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }]
    },
    grid: [
      {
        left: '4%',
        right: '3%',
        top: '8%',
        height: '62%'
      },
      {
        left: '4%',
        right: '3%',
        top: '76%',
        height: '18%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        boundaryGap: true,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { show: false }
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        boundaryGap: true,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { show: false },
        splitLine: { show: false }
      }
    ],
    yAxis: [
      {
        scale: true,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 10,
          formatter: (v: number) => `¥${v.toFixed(1)}`
        },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.08)' } }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: '#f87171',         // Yang Candle (Up) -> Red
          color0: '#34d399',        // Yin Candle (Down) -> Green
          borderColor: '#f87171',
          borderColor0: '#34d399'
        }
      },
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#fbbf24' }
      },
      {
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#38bdf8' }
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#c084fc' }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes
      }
    ]
  }

  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.data,
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
  <div class="kline-container">
    <div ref="chartRef" class="echarts-box"></div>
  </div>
</template>

<style scoped>
.kline-container {
  width: 100%;
  height: 100%;
  min-height: 380px;
  position: relative;
}

.echarts-box {
  width: 100%;
  height: 100%;
  min-height: 380px;
}
</style>
