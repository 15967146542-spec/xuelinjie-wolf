import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AsyncStatus, TeacherStock, KLinePoint, MacroFactor, NextDayProjection } from '@/types'
import { initialStocks, initialMacroFactor, generateKLineData } from '@/mock/initialData'
import { useUserStore } from './user'

export const useMarketStore = defineStore('market', () => {
  const userStore = useUserStore()
  const stocks = ref<TeacherStock[]>([])
  const selectedCode = ref<string>('1005') // Default to 计网赵
  const macroFactor = ref<MacroFactor>({ ...initialMacroFactor })
  const klineCache = ref<Record<string, KLinePoint[]>>({})
  const marketStatus = ref<AsyncStatus>('idle')
  const marketError = ref<string>('')

  function rebuildKlineCache(targetStocks: TeacherStock[]) {
    const cache: Record<string, KLinePoint[]> = {}
    targetStocks.forEach((stock) => {
      cache[stock.code] = generateKLineData(stock.currentPrice, 35)
    })
    klineCache.value = cache
  }

  async function bootstrapMarket(forceRefresh = false) {
    if (!forceRefresh && (marketStatus.value === 'loading' || marketStatus.value === 'success')) {
      return
    }

    marketStatus.value = 'loading'
    marketError.value = ''
    try {
      await new Promise((resolve) => setTimeout(resolve, 180))
      stocks.value = initialStocks.map((item) => ({ ...item }))
      rebuildKlineCache(stocks.value)
      if (!stocks.value.find((s) => s.code === selectedCode.value)) {
        selectedCode.value = stocks.value[0]?.code || ''
      }
      marketStatus.value = 'success'
    } catch {
      marketStatus.value = 'error'
      marketError.value = '行情数据加载失败，请稍后重试。'
    }
  }

  const hasStocks = computed(() => stocks.value.length > 0)

  const selectedStock = computed<TeacherStock>(() => {
    return stocks.value.find((s) => s.code === selectedCode.value) || initialStocks[0]
  })

  const marketIndex = computed(() => {
    const totalCap = stocks.value.reduce((acc, s) => acc + s.marketCap, 0)
    const baseCap = 80000000
    const val = (totalCap / baseCap) * 1000
    return Number(val.toFixed(2))
  })

  const indexChangePct = computed(() => {
    const avgChange = stocks.value.reduce((acc, s) => {
      const pct = ((s.currentPrice - s.prevClose) / s.prevClose) * 100
      return acc + pct
    }, 0) / stocks.value.length
    return Number(avgChange.toFixed(2))
  })

  function selectStock(code: string) {
    selectedCode.value = code
    if (!klineCache.value[code]) {
      const target = stocks.value.find((s) => s.code === code)
      if (target) {
        klineCache.value[code] = generateKLineData(target.currentPrice, 35)
      }
    }
  }

  function getStockByCode(code: string) {
    return stocks.value.find((s) => s.code === code)
  }

  function getKLineByCode(code: string): KLinePoint[] {
    return klineCache.value[code] || []
  }

  function getRatingTrendByCode(code: string) {
    const target = getStockByCode(code)
    if (!target) {
      return {
        ratings: [],
        last5Avg: 0
      }
    }
    return {
      ratings: [...target.recentRatings],
      last5Avg: target.last5AvgRating
    }
  }

  function toggleWatchlist(code: string) {
    const stock = stocks.value.find((s) => s.code === code)
    if (stock) {
      stock.isWatchlisted = !stock.isWatchlisted
    }
  }

  // Calculate simulated next-day price projection using formula
  function calculateNextDayProjection(stock: TeacherStock): NextDayProjection {
    const alpha = macroFactor.value.alpha // 0.02
    const beta = macroFactor.value.beta   // 0.10
    const gamma = macroFactor.value.gamma // 0.005
    const sigma = macroFactor.value.sigma // 0.015

    // 1. Evaluation Factor E
    const evalFactor = alpha * ((stock.last5AvgRating - 3) / 2)

    // 2. Fund Flow Factor F
    const fundFactor = beta * (stock.netInflow / stock.marketCap)

    // 3. Macro Factor M
    const macroImpact = gamma * (macroFactor.value.indexValue - 1.0)

    // 4. Random Noise N
    const noise = (Math.random() * 2 - 1) * sigma

    // Total clamped delta
    const rawDelta = evalFactor + fundFactor + macroImpact + noise
    const clampedDelta = Math.max(-0.10, Math.min(0.10, rawDelta))

    const nextPrice = Number((stock.currentPrice * (1 + clampedDelta)).toFixed(2))
    const deltaPct = Number((clampedDelta * 100).toFixed(2))

    return {
      evalFactor: Number((evalFactor * 100).toFixed(2)),
      fundFactor: Number((fundFactor * 100).toFixed(2)),
      macroImpact: Number((macroImpact * 100).toFixed(2)),
      noise: Number((noise * 100).toFixed(2)),
      deltaPct,
      nextPrice
    }
  }

  // Admin trigger to execute next-day settlement
  function settleNextTradingDay() {
    if (!userStore.canUse('RISK_ADMIN')) return false
    stocks.value.forEach((stock) => {
      const proj = calculateNextDayProjection(stock)
      const oldPrice = stock.currentPrice
      stock.prevClose = oldPrice
      stock.currentPrice = proj.nextPrice
      stock.openPrice = Number((oldPrice * (1 + (Math.random() - 0.48) * 0.01)).toFixed(2))
      stock.highPrice = Number((Math.max(stock.openPrice, stock.currentPrice) * (1 + Math.random() * 0.02)).toFixed(2))
      stock.lowPrice = Number((Math.min(stock.openPrice, stock.currentPrice) * (1 - Math.random() * 0.02)).toFixed(2))
      stock.volume = Math.floor(stock.volume * (0.8 + Math.random() * 0.5))
      stock.amount = Number((stock.volume * stock.currentPrice).toFixed(0))
      stock.marketCap = Number((stock.currentPrice * 100000).toFixed(0))

      // Push to KLine cache
      const list = klineCache.value[stock.code] || []
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`
      list.push({
        date: dateStr,
        open: stock.openPrice,
        close: stock.currentPrice,
        high: stock.highPrice,
        low: stock.lowPrice,
        volume: stock.volume
      })
    })
    return true
  }

  function updateMacroFactor(indexVal: number, title: string, desc: string) {
    if (!userStore.canUse('RISK_ADMIN')) return false
    macroFactor.value.indexValue = indexVal
    macroFactor.value.title = title
    macroFactor.value.description = desc
    macroFactor.value.updatedAt = new Date().toLocaleString()
    return true
  }

  return {
    stocks,
    selectedCode,
    selectedStock,
  hasStocks,
  marketStatus,
  marketError,
    macroFactor,
    marketIndex,
    indexChangePct,
    klineCache,
  bootstrapMarket,
    selectStock,
  getStockByCode,
  getKLineByCode,
  getRatingTrendByCode,
    toggleWatchlist,
    calculateNextDayProjection,
    settleNextTradingDay,
    updateMacroFactor
  }
})
