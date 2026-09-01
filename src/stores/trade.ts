import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, Position } from '@/types'
import { initialOrders, initialPositions } from '@/mock/initialData'
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
  function executeBuy(stockCode: string, shares: number): { success: boolean; message: string } {
    if (shares <= 0) return { success: false, message: '买入股数必须大于0' }

    const stock = marketStore.stocks.find((s) => s.code === stockCode)
    if (!stock) return { success: false, message: '标的不存在' }

    // External user permission check
    if (userStore.user.role === 'EXTERNAL' && !userStore.user.monthCardActive) {
      return { success: false, message: '校外用户需开通月卡或通行证解锁模拟交易权限' }
    }

    const price = stock.currentPrice
    const tradeAmount = Number((price * shares).toFixed(2))
    const feeRate = userStore.user.monthCardActive ? 0.0005 : 0.001 // Month card gives 50% discount
    const fee = Number((tradeAmount * feeRate).toFixed(2))
    const totalRequired = Number((tradeAmount + fee).toFixed(2))

    if (userStore.user.balance < totalRequired) {
      return { success: false, message: `资金不足，需要 ¥${totalRequired} (含手续费 ¥${fee})` }
    }

    // Risk control: Max position limit <= 30% of Total Asset
    const currentHolding = positions.value.find((p) => p.stockCode === stockCode)
    const existingVal = currentHolding ? currentHolding.totalShares * price : 0
    const targetVal = existingVal + tradeAmount
    const currentTotalAsset = totalAsset.value

    if (targetVal / currentTotalAsset > 0.30) {
      const maxAllowedShares = Math.floor(((currentTotalAsset * 0.30) - existingVal) / price)
      return {
        success: false,
        message: `触发风控：单只标的持仓不得超过总资产的30%！当前最多还可买入 ${Math.max(0, maxAllowedShares)} 股`
      }
    }

    // Deduct balance
    userStore.deductBalance(totalRequired, `买入 ${stock.name} ${shares}股`, '证券交易')

    // Platform pool takes 50% fee, rest destroyed
    platformFeePool.value = Number((platformFeePool.value + (fee * 0.5)).toFixed(2))

    // Record order
    const orderNo = `ORD${Date.now().toString().slice(-8)}`
    orders.value.unshift({
      id: 'ord-' + Date.now(),
      orderNo,
      stockCode,
      stockName: stock.name,
      side: 'BUY',
      price,
      shares,
      amount: tradeAmount,
      fee,
      status: 'FILLED',
      createTime: new Date().toLocaleTimeString()
    })

    // Update or create position
    if (currentHolding) {
      const oldTotal = currentHolding.totalShares * currentHolding.costPrice
      const newTotal = oldTotal + tradeAmount
      currentHolding.totalShares += shares
      currentHolding.costPrice = Number((newTotal / currentHolding.totalShares).toFixed(2))
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
  function executeSell(stockCode: string, shares: number): { success: boolean; message: string } {
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
    const tradeAmount = Number((price * shares).toFixed(2))
    const feeRate = userStore.user.monthCardActive ? 0.0005 : 0.001
    const fee = Number((tradeAmount * feeRate).toFixed(2))
    const netReturn = Number((tradeAmount - fee).toFixed(2))

    // Add balance back to user
    userStore.addBalance(netReturn, `卖出 ${stock.name} ${shares}股`, '证券交易')
    platformFeePool.value = Number((platformFeePool.value + (fee * 0.5)).toFixed(2))

    // Record order
    const orderNo = `ORD${Date.now().toString().slice(-8)}`
    orders.value.unshift({
      id: 'ord-' + Date.now(),
      orderNo,
      stockCode,
      stockName: stock.name,
      side: 'SELL',
      price,
      shares,
      amount: tradeAmount,
      fee,
      status: 'FILLED',
      createTime: new Date().toLocaleTimeString()
    })

    // Reduce position lots FIFO
    let remainingToDeduct = shares
    holding.availableShares -= shares
    holding.totalShares -= shares

    for (const lot of holding.lots) {
      if (lot.canSellToday) {
        if (lot.shares <= remainingToDeduct) {
          remainingToDeduct -= lot.shares
          lot.shares = 0
        } else {
          lot.shares -= remainingToDeduct
          remainingToDeduct = 0
          break
        }
      }
    }
    holding.lots = holding.lots.filter((l) => l.shares > 0)

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
