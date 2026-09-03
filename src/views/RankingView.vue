<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRankingStore } from '@/stores/ranking'
import {
  Trophy,
  Crown,
  Flame,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  Users
} from 'lucide-vue-next'

const rankingStore = useRankingStore()
const activeTab = ref<'CAMPUS' | 'EXTERNAL' | 'TOTAL' | 'PROFIT' | 'DRAGON_TIGER'>('CAMPUS')

const currentRankingList = computed(() => {
  if (activeTab.value === 'CAMPUS') return rankingStore.campusRankings
  if (activeTab.value === 'EXTERNAL') return rankingStore.externalRankings
  if (activeTab.value === 'PROFIT') return rankingStore.dailyProfitRankings
  return rankingStore.liveRankings
})

function getRankBadgeClass(rank: number) {
  if (rank === 1) return 'rank-1'
  if (rank === 2) return 'rank-2'
  if (rank === 3) return 'rank-3'
  return 'rank-normal'
}
</script>

<template>
  <div class="ranking-view">
    <!-- Top Weekly Title Hall of Fame Banner -->
    <div class="title-hall-banner">
      <div class="hall-header">
        <div class="hall-badge">
          <Crown :size="16" />
          <span>周度荣誉称号名人堂 (每周日 18:00 结算，有效期 7 天)</span>
        </div>
        <span class="countdown-tip">本周结算倒计时：4天 12小时</span>
      </div>

      <div class="titles-grid">
        <div
          v-for="title in rankingStore.weeklyTitles"
          :key="title.id"
          class="title-card"
          :style="{ borderColor: title.color + '40', background: title.color + '0d' }"
        >
          <div class="t-top">
            <span class="t-badge" :style="{ color: title.color, borderColor: title.color + '50', background: title.color + '1a' }">
              {{ title.name }}
            </span>
            <span class="t-role">{{ title.holderRole }}</span>
          </div>
          <strong class="t-holder">{{ title.holder }}</strong>
          <p class="t-desc">{{ title.description }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content: Tabbed Rankings -->
    <div class="ranking-content-card">
      <div class="ranking-toolbar">
        <div class="ranking-tabs">
          <button
            class="r-tab"
            :class="{ active: activeTab === 'CAMPUS' }"
            @click="activeTab = 'CAMPUS'"
          >
            <Award :size="16" /> 校内总资产榜
          </button>
          <button
            class="r-tab"
            :class="{ active: activeTab === 'EXTERNAL' }"
            @click="activeTab = 'EXTERNAL'"
          >
            <Users :size="16" /> 校外总资产榜
          </button>
          <button
            class="r-tab"
            :class="{ active: activeTab === 'TOTAL' }"
            @click="activeTab = 'TOTAL'"
          >
            <Layers :size="16" /> 全站总榜 (混合)
          </button>
          <button
            class="r-tab"
            :class="{ active: activeTab === 'PROFIT' }"
            @click="activeTab = 'PROFIT'"
          >
            <TrendingUp :size="16" /> 每日收益率榜
          </button>
          <button
            class="r-tab"
            :class="{ active: activeTab === 'DRAGON_TIGER' }"
            @click="activeTab = 'DRAGON_TIGER'"
          >
            <Flame :size="16" /> 龙虎风云榜
          </button>
        </div>
      </div>

      <!-- 1. Normal User Ranking Table -->
      <div v-if="activeTab !== 'DRAGON_TIGER'" class="table-container">
        <table class="ranking-table">
          <thead>
            <tr>
              <th width="80" class="text-center">排名</th>
              <th>投资者</th>
              <th width="140">认证身份</th>
              <th width="140" class="text-right">总资产 (学币)</th>
              <th width="120" class="text-right">今日收益率</th>
              <th width="120" class="text-right">周收益率</th>
              <th width="140">头号重仓</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in currentRankingList" :key="user.userId" class="r-row">
              <td class="text-center">
                <div class="rank-badge" :class="getRankBadgeClass(user.rank)">
                  {{ user.rank }}
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <img :src="user.avatar" class="u-avatar" alt="avatar" />
                  <div class="u-meta">
                    <strong class="u-name">{{ user.username }}</strong>
                    <span v-if="user.title" class="honor-tag">{{ user.title }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-pill" :class="user.userRole === 'STUDENT' ? 'campus' : 'external'">
                  {{ user.userRole === 'STUDENT' ? '校内学生认证' : '校外付费用户' }}
                </span>
              </td>
              <td class="text-right font-mono font-bold text-lg">
                ¥{{ user.totalAsset.toLocaleString() }}
              </td>
              <td class="text-right font-mono" :class="user.dailyProfitRatio >= 0 ? 'up' : 'down'">
                {{ user.dailyProfitRatio >= 0 ? '+' : '' }}{{ user.dailyProfitRatio }}%
              </td>
              <td class="text-right font-mono" :class="user.weeklyProfitRatio >= 0 ? 'up' : 'down'">
                {{ user.weeklyProfitRatio >= 0 ? '+' : '' }}{{ user.weeklyProfitRatio }}%
              </td>
              <td>
                <span class="holding-pill font-mono">{{ user.topHolding || '分散建仓' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. Dragon-Tiger Leaderboard -->
      <div v-else class="table-container">
        <div class="dragon-intro">
          <span>根据今日收盘全站交易流水统计买入与卖出净额前四标的</span>
        </div>
        <table class="ranking-table">
          <thead>
            <tr>
              <th width="80" class="text-center">排位</th>
              <th>标的代码 / 教师</th>
              <th class="text-right">今日买入总额</th>
              <th class="text-right">今日卖出总额</th>
              <th class="text-right">主力净流入</th>
              <th>龙虎榜特征标签</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in rankingStore.dragonTigerList" :key="item.stockCode" class="r-row">
              <td class="text-center">
                <div class="rank-badge" :class="getRankBadgeClass(item.rank)">
                  {{ item.rank }}
                </div>
              </td>
              <td>
                <div class="dragon-stock">
                  <span class="code-badge">{{ item.stockCode }}</span>
                  <strong>{{ item.stockName }}</strong>
                  <small class="text-soft"> ({{ item.teacherName }})</small>
                </div>
              </td>
              <td class="text-right font-mono text-soft">¥{{ (item.buyAmount / 10000).toFixed(1) }}万</td>
              <td class="text-right font-mono text-soft">¥{{ (item.sellAmount / 10000).toFixed(1) }}万</td>
              <td class="text-right font-mono font-bold" :class="item.netAmount >= 0 ? 'up' : 'down'">
                {{ item.netAmount >= 0 ? '+' : '' }}¥{{ (item.netAmount / 10000).toFixed(1) }}万
              </td>
              <td>
                <span class="dragon-tag" :class="item.netAmount >= 0 ? 'd-up' : 'd-down'">
                  {{ item.tag }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title-hall-banner {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hall-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.hall-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 800;
  color: #fbbf24;
}

.countdown-tip {
  font-size: 0.78rem;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px 10px;
  border-radius: 6px;
}

.titles-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.title-card {
  border: 1px solid;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.t-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.t-badge {
  font-size: 0.76rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid;
}

.t-role {
  font-size: 0.68rem;
  color: #94a3b8;
}

.t-holder {
  font-size: 0.92rem;
  color: #f8fafc;
}

.t-desc {
  margin: 0;
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.4;
}

.ranking-content-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ranking-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ranking-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.r-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.r-tab.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
}

.table-container {
  overflow-x: auto;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.ranking-table th {
  padding: 10px 12px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.4);
  text-align: left;
}

.ranking-table td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.r-row:hover {
  background: rgba(56, 189, 248, 0.04);
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.86rem;
  margin: 0 auto;
}

.rank-1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #111827; }
.rank-2 { background: linear-gradient(135deg, #94a3b8, #cbd5e1); color: #111827; }
.rank-3 { background: linear-gradient(135deg, #b45309, #d97706); color: white; }
.rank-normal { background: rgba(30, 41, 59, 0.6); color: #94a3b8; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.u-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.u-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.u-name {
  color: #f8fafc;
}

.honor-tag {
  font-size: 0.68rem;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.role-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.role-pill.campus { background: rgba(56, 189, 248, 0.12); color: #38bdf8; }
.role-pill.external { background: rgba(139, 92, 246, 0.12); color: #c4b5fd; }

.holding-pill {
  font-size: 0.76rem;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px 8px;
  border-radius: 6px;
}

.dragon-intro {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.dragon-stock {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-badge {
  font-family: monospace;
  font-size: 0.74rem;
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-radius: 6px;
}

.dragon-tag {
  font-size: 0.76rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.dragon-tag.d-up { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.dragon-tag.d-down { background: rgba(52, 211, 153, 0.15); color: #34d399; }

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: 700; }
.text-lg { font-size: 1.05rem; }
.text-soft { color: #94a3b8; }
.up { color: #f87171; }
.down { color: #34d399; }

@media (max-width: 1050px) {
  .titles-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

