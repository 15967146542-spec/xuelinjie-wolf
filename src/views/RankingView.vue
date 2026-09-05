<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRankingStore } from '@/stores/ranking'
import { useRouter } from 'vue-router'
import { useMarketStore } from '@/stores/market'
import {
  Trophy,
  Crown,
  Flame,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  ExternalLink,
  Users
} from 'lucide-vue-next'

const rankingStore = useRankingStore()
const router = useRouter()
const marketStore = useMarketStore()
const activeTab = ref<'CAMPUS' | 'EXTERNAL' | 'TOTAL' | 'PROFIT' | 'DRAGON_TIGER'>('CAMPUS')

const currentRankingList = computed(() => {
  if (activeTab.value === 'CAMPUS') return rankingStore.campusRankings
  if (activeTab.value === 'EXTERNAL') return rankingStore.externalRankings
  if (activeTab.value === 'PROFIT') return rankingStore.dailyProfitRankings
  return rankingStore.liveRankings
})

// 龙虎风云榜：读取全部老师标的并按主力净流入排序，每页展示 20 条；仅最高/最低各两支授予称号并高亮
const dragonPageSize = 20
const dragonCurrentPage = ref(1)
const dragonList = computed(() => rankingStore.dragonTigerList)
const dragonTotal = computed(() => dragonList.value.length)
const dragonPageItems = computed(() => {
  const start = (dragonCurrentPage.value - 1) * dragonPageSize
  return dragonList.value.slice(start, start + dragonPageSize)
})

watch(dragonTotal, (total) => {
  const lastPage = Math.max(1, Math.ceil(total / dragonPageSize))
  if (dragonCurrentPage.value > lastPage) dragonCurrentPage.value = lastPage
})

function goToDetail(code: string) {
  marketStore.selectStock(code)
  router.push({ path: `/stock/${code}` })
}

// 龙虎榜与详情跳转依赖全量老师标的，进入页面即确保行情数据就绪（幂等）
onMounted(() => {
  marketStore.bootstrapMarket()
})

// 固定三甲展示的左右顺序：第二名、第一名、第三名。
// 这样第一名无论数据原始排序如何，都会落在中间一列。
const topThreeRankings = computed(() => {
  const topUsers = currentRankingList.value.filter((user) => user.rank <= 3)
  return [2, 1, 3]
    .map((rank) => topUsers.find((user) => user.rank === rank))
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
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
        <section
          v-if="activeTab === 'CAMPUS' && topThreeRankings.length"
          class="top-three"
          aria-label="杭电总资产榜前三名"
        >
          <article
            v-for="user in topThreeRankings"
            :key="user.userId"
            class="top-three-user"
            :class="`top-three-rank-${user.rank}`"
          >
            <div class="top-three-avatar-wrap">
              <img :src="user.avatar" class="top-three-avatar" :alt="`${user.username}的头像`" />
              <span class="top-three-medal">{{ user.rank }}</span>
            </div>
            <strong class="top-three-name">{{ user.username }}</strong>
            <span v-if="user.title" class="top-three-title">{{ user.title }}</span>
            <strong class="top-three-asset">¥{{ user.totalAsset.toLocaleString() }}</strong>
          </article>
        </section>
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
      <div v-else class="dragon-panel">
        <div class="dragon-intro">
          <span>
            基于今日收盘全站交易流水，读取全部 {{ dragonTotal }} 只老师标的并按主力净流入排序，
            每页展示 {{ dragonPageSize }} 只；仅最高两支（多头总龙头 / 多头人气王）与最低两支
            （空头总龙头 / 恐慌出逃王）授予称号并高亮。
          </span>
        </div>
        <div class="table-container">
          <table class="ranking-table">
            <thead>
              <tr>
                <th width="80" class="text-center">排位</th>
                <th>标的代码 / 教师</th>
                <th class="text-right">今日买入总额</th>
                <th class="text-right">今日卖出总额</th>
                <th class="text-right">主力净流入</th>
                <th width="92" class="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in dragonPageItems"
                :key="item.stockCode"
                class="r-row"
                :class="{ 'dragon-best': item.highlight === 'TOP', 'dragon-worst': item.highlight === 'BOTTOM' }"
              >
                <td class="text-center">
                  <div class="rank-badge" :class="getRankBadgeClass(item.rank)">
                    {{ item.rank }}
                  </div>
                </td>
                <td>
                  <div class="dragon-stock">
                    <span class="code-badge">{{ item.stockCode }}</span>
                    <div class="dragon-stock-main">
                      <span class="dragon-stock-name">
                        <strong>{{ item.stockName }}</strong>
                        <small class="text-soft">({{ item.teacherName }})</small>
                      </span>
                      <span
                        v-if="item.title"
                        class="dragon-title-chip"
                        :class="item.highlight === 'TOP' ? 'chip-top' : 'chip-bottom'"
                      >
                        {{ item.title }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="text-right font-mono text-soft">¥{{ (item.buyAmount / 10000).toFixed(1) }}万</td>
                <td class="text-right font-mono text-soft">¥{{ (item.sellAmount / 10000).toFixed(1) }}万</td>
                <td class="text-right font-mono font-bold" :class="item.netAmount >= 0 ? 'up' : 'down'">
                  {{ item.netAmount >= 0 ? '+' : '' }}¥{{ (item.netAmount / 10000).toFixed(1) }}万
                </td>
                <td class="text-center">
                  <button type="button" class="detail-btn" @click="goToDetail(item.stockCode)">
                    <ExternalLink :size="13" /> 详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="dragonTotal > dragonPageSize" class="pagination">
          <el-pagination
            v-model:current-page="dragonCurrentPage"
            background
            layout="prev, pager, next"
            :page-size="dragonPageSize"
            :total="dragonTotal"
          />
        </div>
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

/* 三列等宽：DOM 顺序为 2、1、3，第一名永远处于正中。 */
.top-three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: clamp(16px, 6vw, 72px);
  min-width: 520px;
  padding: 18px clamp(24px, 8vw, 100px) 24px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: radial-gradient(circle at center bottom, rgba(251, 191, 36, 0.12), transparent 58%);
}

.top-three-user {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
}

.top-three-avatar-wrap {
  position: relative;
  width: 68px;
  height: 68px;
}

.top-three-avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border: 3px solid rgba(148, 163, 184, 0.75);
  border-radius: 50%;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.45);
}

.top-three-medal {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 25px;
  height: 25px;
  display: grid;
  place-items: center;
  border: 2px solid #111a2c;
  border-radius: 50%;
  font-size: 0.78rem;
  font-weight: 900;
}

.top-three-name {
  max-width: 100%;
  overflow: hidden;
  color: #f8fafc;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-three-asset {
  color: #f87171;
  font-family: monospace;
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.top-three-title {
  max-width: 100%;
  overflow: hidden;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  font-size: 0.72rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-three-rank-1 .top-three-avatar-wrap {
  width: 86px;
  height: 86px;
}

.top-three-rank-1 .top-three-avatar {
  border-color: #fbbf24;
  box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.14), 0 10px 24px rgba(251, 191, 36, 0.22);
}

.top-three-rank-1 .top-three-medal { background: #fbbf24; color: #111827; }
.top-three-rank-2 .top-three-avatar { border-color: #cbd5e1; }
.top-three-rank-2 .top-three-medal { background: #cbd5e1; color: #111827; }
.top-three-rank-3 .top-three-avatar { border-color: #d97706; }
.top-three-rank-3 .top-three-medal { background: #d97706; color: white; }

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

.dragon-panel { display: flex; flex-direction: column; gap: 14px; }

/* 龙虎榜突出展示：最高两支（多头·金）与最低两支（空头·蓝） */
tr.dragon-best { background: linear-gradient(90deg, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.02) 42%, transparent 80%); box-shadow: inset 3px 0 0 #fbbf24; }
tr.dragon-worst { background: linear-gradient(90deg, rgba(56, 189, 248, 0.12), rgba(56, 189, 248, 0.02) 42%, transparent 80%); box-shadow: inset 3px 0 0 #38bdf8; }

.dragon-stock-main { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.dragon-stock-name { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }

.dragon-title-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.5;
  white-space: nowrap;
}
.dragon-title-chip.chip-top { color: #fbbf24; background: rgba(251, 191, 36, 0.14); border: 1px solid rgba(251, 191, 36, 0.42); }
.dragon-title-chip.chip-bottom { color: #38bdf8; background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.42); }

.detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.12);
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.detail-btn:hover { background: rgba(56, 189, 248, 0.24); color: #e0f2fe; }

.pagination { display: flex; justify-content: center; }
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

