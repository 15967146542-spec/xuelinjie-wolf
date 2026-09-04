import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RankingUser, DragonTigerItem, WeeklyTitle } from '@/types'
import { initialRankings, initialDragonTiger, initialWeeklyTitles } from '@/mock/initialData'
import { useTradeStore } from './trade'
import { useUserStore } from './user'

export const useRankingStore = defineStore('ranking', () => {
  const tradeStore = useTradeStore()
  const userStore = useUserStore()

  const rankingUsers = ref<RankingUser[]>([...initialRankings])
  const dragonTigerList = ref<DragonTigerItem[]>([...initialDragonTiger])
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
