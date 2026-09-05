import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ActionResult, Order, Position, TradeSide } from '@/types'
import { initialOrders, initialPositions } from '@/mock/initialData'
import {
  calcMaxAdditionalSharesToLimit,
  calcTradeAmount,
  calcTradeFee,
  calcTradeNetReturn,
  calcTradePayable,
  calcWeightedCostPrice,
  deductSellableLots,
  exceedsPositionLimit,
  FEE_POOL_RETAIN_RATIO
} from '@/rules'
import { useUserStore } from './user'
import { useMarketStore } from './market'

export const useTradeStore = defineStore('trade', () => {
  const userStore = useUserStore()
  const marketStore = useMarketStore()

  const orders = ref<Order[]>([...initialOrders])
  const positions = ref<Position[]>([...initialPositions])
  const platformFeePool = ref<number>(2450.80) // 50% fee pool

  // Total portfolio value = cash balance + sum of position market value
  const totalPositionValue = computed(() => {
    return positions.value.reduce((acc, pos) => {
      const liveStock = marketStore.stocks.find((s) => s.code === pos.stockCode)
      const currentPrice = liveStock ? liveStock.currentPrice : pos.currentPrice
      return acc + (pos.totalShares * currentPrice)
    }, 0)
  })

  const totalAsset = computed(() => {
    return Number((userStore.user.balance + totalPositionValue.value).toFixed(2))
  })

  const totalFloatProfit = computed(() => {
    return positions.value.reduce((acc, pos) => {
      const liveStock = marketStore.stocks.find((s) => s.code === pos.stockCode)
      const currentPrice = liveStock ? liveStock.currentPrice : pos.currentPrice
      const profit = (currentPrice - pos.costPrice) * pos.totalShares
      return acc + profit
    }, 0)
  })

  const totalProfitRatio = computed(() => {
    const totalCost = positions.value.reduce((acc, p) => acc + (p.costPrice * p.totalShares), 0)
    if (totalCost === 0) return 0
    return Number(((totalFloatProfit.value / totalCost) * 100).toFixed(2))
  })

  // Recalculate live prices for positions
  function syncPositionPrices() {
    positions.value.forEach((pos) => {
      const live = marketStore.stocks.find((s) => s.code === pos.stockCode)
      if (live) {
        pos.currentPrice = live.currentPrice
        pos.marketValue = Number((pos.totalShares * live.currentPrice).toFixed(2))
        pos.floatProfit = Number(((live.currentPrice - pos.costPrice) * pos.totalShares).toFixed(2))
        pos.profitRatio = Number((((live.currentPrice - pos.costPrice) / pos.costPrice) * 100).toFixed(2))
      }
    })
  }

  // Buy order execution
  function executeBuy(stockCode: string, shares: number): ActionResult {
    if (!userStore.canUse('TRADE')) {
      return { success: false, message: '当前身份仅可阅读行情与评价，不能进行模拟交易' }
    }
    if (shares <= 0) return { success: false, message: '买入股数必须大于0' }

    const stock = marketStore.stocks.find((s) => s.code === stockCode)
    if (!stock) return { success: false, message: '标的不存在' }

    const price = stock.currentPrice
    const tradeAmount = calcTradeAmount(price, shares)
    const fee = calcTradeFee(tradeAmount, userStore.user.monthCardActive) // Month card gives 50% discount
    const totalRequired = calcTradePayable(tradeAmount, fee)

    if (userStore.user.balance < totalRequired) {
      return { success: false, message: `资金不足，需要 ¥${totalRequired} (含手续费 ¥${fee})` }
    }

    // Risk control: Max position limit <= 30% of Total Asset (rules.POSITION_LIMIT_RATIO)
    const currentHolding = positions.value.find((p) => p.stockCode === stockCode)
    const existingVal = currentHolding ? currentHolding.totalShares * price : 0
    const currentTotalAsset = totalAsset.value

    if (exceedsPositionLimit(existingVal, tradeAmount, currentTotalAsset)) {
      const maxAllowedShares = calcMaxAdditionalSharesToLimit(currentTotalAsset, existingVal, price)
      return {
        success: false,
        message: `触发风控：单只标的持仓不得超过总资产的30%！当前最多还可买入 ${Math.max(0, maxAllowedShares)} 股`
      }
    }

    // Deduct balance
    userStore.deductBalance(totalRequired, `买入 ${stock.name} ${shares}股`, '证券交易')

    // Platform pool takes 50% fee, rest destroyed
    platformFeePool.value = Number((platformFeePool.value + (fee * FEE_POOL_RETAIN_RATIO)).toFixed(2))

    // Record order
    const orderNo = `ORD${Date.now().toString().slice(-8)}`
    orders.value.unshift({
      id: 'ord-' + Date.now(),
      orderNo,
      stockCode,
      stockName: stock.name,
  side: 'BUY' as TradeSide,
      price,
      shares,
      amount: tradeAmount,
      fee,
      status: 'FILLED',
      createTime: new Date().toLocaleTimeString()
    })

    // Update or create position
    if (currentHolding) {
      // 摊薄均价先按旧仓数量计算，再累加本次买入股数（与加权公式逐位一致）
      currentHolding.costPrice = calcWeightedCostPrice(
        currentHolding.totalShares,
        currentHolding.costPrice,
        shares,
        price
      )
      currentHolding.totalShares += shares
      currentHolding.lots.push({
        lotId: 'lot-' + Date.now(),
        buyDate: new Date().toISOString().split('T')[0],
        shares,
        costPrice: price,
        canSellToday: false // T+1 locked
      })
    } else {
      positions.value.push({
        stockCode,
        stockName: stock.name,
        totalShares: shares,
        availableShares: 0,
        costPrice: price,
        currentPrice: price,
        marketValue: tradeAmount,
        floatProfit: 0,
        profitRatio: 0,
        lots: [
          {
            lotId: 'lot-' + Date.now(),
            buyDate: new Date().toISOString().split('T')[0],
            shares,
            costPrice: price,
            canSellToday: false
          }
        ]
      })
    }

    // Increase stock net inflow
    stock.netInflow += tradeAmount
    stock.volume += shares
    syncPositionPrices()

    return { success: true, message: `成功以 ¥${price} 买入 ${stock.name} ${shares} 股！` }
  }

  // Sell order execution
  function executeSell(stockCode: string, shares: number): ActionResult {
    if (!userStore.canUse('TRADE')) {
      return { success: false, message: '当前身份仅可阅读行情与评价，不能进行模拟交易' }
    }
    if (shares <= 0) return { success: false, message: '卖出股数必须大于0' }

    const stock = marketStore.stocks.find((s) => s.code === stockCode)
    if (!stock) return { success: false, message: '标的不存在' }

    const holding = positions.value.find((p) => p.stockCode === stockCode)
    if (!holding || holding.totalShares < shares) {
      return { success: false, message: '持仓不足' }
    }

    if (holding.availableShares < shares) {
      return { success: false, message: `触发T+1限制：当日买入不可卖出！当前仅 ${holding.availableShares} 股可卖` }
    }

    const price = stock.currentPrice
    const tradeAmount = calcTradeAmount(price, shares)
    const fee = calcTradeFee(tradeAmount, userStore.user.monthCardActive)
    const netReturn = calcTradeNetReturn(tradeAmount, fee)

    // Add balance back to user
    userStore.addBalance(netReturn, `卖出 ${stock.name} ${shares}股`, '证券交易')
    platformFeePool.value = Number((platformFeePool.value + (fee * FEE_POOL_RETAIN_RATIO)).toFixed(2))

    // Record order
    const orderNo = `ORD${Date.now().toString().slice(-8)}`
    orders.value.unshift({
      id: 'ord-' + Date.now(),
      orderNo,
      stockCode,
      stockName: stock.name,
  side: 'SELL' as TradeSide,
      price,
      shares,
      amount: tradeAmount,
      fee,
      status: 'FILLED',
      createTime: new Date().toLocaleTimeString()
    })

    // Reduce position lots FIFO（T+1：仅已解锁批次参与，扣减规则见 rules.deductSellableLots）
    holding.lots = deductSellableLots(holding.lots, shares).lots
    holding.availableShares -= shares
    holding.totalShares -= shares

    if (holding.totalShares === 0) {
      positions.value = positions.value.filter((p) => p.stockCode !== stockCode)
    }

    // Update stock net inflow
    stock.netInflow -= tradeAmount
    stock.volume += shares
    syncPositionPrices()

    return { success: true, message: `成功以 ¥${price} 卖出 ${stock.name} ${shares} 股，回笼资金 ¥${netReturn}` }
  }

  // T+1 unlock on next day
  function unlockTPlusOne() {
    positions.value.forEach((pos) => {
      pos.lots.forEach((lot) => {
        lot.canSellToday = true
      })
      pos.availableShares = pos.totalShares
    })
  }

  return {
    orders,
    positions,
    platformFeePool,
    totalPositionValue,
    totalAsset,
    totalFloatProfit,
    totalProfitRatio,
    syncPositionPrices,
    executeBuy,
    executeSell,
    unlockTPlusOne
  }
})
