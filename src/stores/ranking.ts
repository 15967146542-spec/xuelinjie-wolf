import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RankingUser, DragonTigerItem, WeeklyTitle, TeacherStock } from '@/types'
import { initialRankings, initialStocks, initialWeeklyTitles } from '@/mock/initialData'
import { useTradeStore } from './trade'
import { useUserStore } from './user'
import { useMarketStore } from './market'

/** 由成交额与主力净流入推演龙虎榜买卖盘：买入 + 卖出 = 成交额，买入 - 卖出 = 净流入 */
function deriveDragonAmounts(stock: TeacherStock) {
  const turnover = Math.max(0, stock.amount)
  const netAmount = stock.netInflow
  const buyAmount = Math.max(0, Math.round((turnover + netAmount) / 2))
  const sellAmount = Math.max(0, Math.round((turnover - netAmount) / 2))
  return { buyAmount, sellAmount, netAmount }
}


/** 读取全部老师标的并按主力净流入排序，为首尾各两支授予突出称号 */
function buildDragonTigerList(stocks: TeacherStock[]): DragonTigerItem[] {
  const items: DragonTigerItem[] = stocks.map((stock) => {
    const { buyAmount, sellAmount, netAmount } = deriveDragonAmounts(stock)
    return {
      rank: 0,
      stockCode: stock.code,
      stockName: stock.name,
      teacherName: stock.teacherName,
      buyAmount,
      sellAmount,
      netAmount,
    }
  })
  items.sort((a, b) => b.netAmount - a.netAmount)

  const total = items.length
  return items.map((item, index) => {
    const rank = index + 1
    let title: string | undefined
    let highlight: DragonTigerItem['highlight']
    if (rank === 1) {
      title = '多头总龙头'
      highlight = 'TOP'
    } else if (rank === 2) {
      title = '多头人气王'
      highlight = 'TOP'
    } else if (rank === total) {
      title = '空头总龙头'
      highlight = 'BOTTOM'
    } else if (rank === total - 1) {
      title = '恐慌出逃王'
      highlight = 'BOTTOM'
    }
    return { ...item, rank, title, highlight }
  })
}

export const useRankingStore = defineStore('ranking', () => {
  const tradeStore = useTradeStore()
  const userStore = useUserStore()
  const marketStore = useMarketStore()

  const rankingUsers = ref<RankingUser[]>([...initialRankings])
  const weeklyTitles = ref<WeeklyTitle[]>([...initialWeeklyTitles])

  // Sync current user's live asset into the ranking list
  const liveRankings = computed(() => {
    const list = [...rankingUsers.value]
    const userIndex = list.findIndex((u) => u.userId === userStore.user.id || u.username.includes('林予'))
    if (userIndex !== -1) {
      list[userIndex].totalAsset = tradeStore.totalAsset
      list[userIndex].userRole = userStore.user.role
    }
    return list.sort((a, b) => b.totalAsset - a.totalAsset).map((u, idx) => ({
      ...u,
      rank: idx + 1
    }))
  })

  const campusRankings = computed(() => {
    return liveRankings.value
      .filter((u) => u.userRole === 'STUDENT')
      .sort((a, b) => b.totalAsset - a.totalAsset) // 按总资产降序排序
      .map((u, idx) => ({
        ...u,
        rank: idx + 1 // 自增排名
      }));
  });

  const externalRankings = computed(() => {
    return liveRankings.value
      .filter((u) => u.userRole === 'EXTERNAL')
      .sort((a, b) => b.totalAsset - a.totalAsset)
      .map((u, idx) => ({
        ...u,
        rank: idx + 1 // 自增排名
      }));
  });

  const dailyProfitRankings = computed(() => {
    return [...liveRankings.value]
      .sort((a, b) => b.dailyProfitRatio - a.dailyProfitRatio) // 按每日收益率降序排序
      .map((u, idx) => ({
        ...u,
        rank: idx + 1 // 自增排名
      }));
  });

  // 龙虎风云榜：读取全量老师标的（含合成档案），行情就绪后取 store 数据，否则回退同源 Mock
  const dragonTigerList = computed<DragonTigerItem[]>(() => {
    const source = marketStore.stocks.length > 0 ? marketStore.stocks : initialStocks
    return buildDragonTigerList(source)
  })

  return {
    rankingUsers,
    liveRankings,
    campusRankings,
    externalRankings,
    dailyProfitRankings,
    dragonTigerList,
    weeklyTitles
  }
})
